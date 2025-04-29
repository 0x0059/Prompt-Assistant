import OpenAI from 'openai';
import { ModelConfig } from '../../model/types';
import { Message, StreamHandlers, ModelInfo, ThinkingResponse } from '../types';
import { IModelProvider } from './interface';
import { isVercel, getProxyUrl } from '../../../utils/environment';
import { DeepSeekThoughtExtractor } from '../../../utils/deepseekThoughtExtractor';

/**
 * OpenAI兼容的模型提供商
 * @class OpenAIProvider
 * @implements {IModelProvider}
 */
export class OpenAIProvider implements IModelProvider {
  private openai: OpenAI;
  private modelConfig: ModelConfig;
  private thoughtExtractor: DeepSeekThoughtExtractor;
  
  /**
   * 创建OpenAI提供商实例
   * @param {ModelConfig} config - 模型配置
   * @param {boolean} isStream - 是否为流式请求
   */
  constructor(config: ModelConfig, isStream: boolean = false) {
    this.modelConfig = config;
    this.thoughtExtractor = new DeepSeekThoughtExtractor();
    
    let processedBaseURL = config.baseURL;
    if (processedBaseURL?.endsWith('/chat/completions')) {
      processedBaseURL = processedBaseURL.slice(0, -'/chat/completions'.length);
    }
    
    let finalBaseURL = processedBaseURL;
    if (config.useVercelProxy === true && isVercel() && processedBaseURL) {
      finalBaseURL = getProxyUrl(processedBaseURL, isStream);
      console.log(`使用${isStream ? '流式' : ''}API代理:`, finalBaseURL);
    }
    
    const openaiConfig: any = {
      apiKey: config.apiKey,
      baseURL: finalBaseURL,
      dangerouslyAllowBrowser: true
    };
    
    if (isStream) {
      openaiConfig.timeout = 30000;
      openaiConfig.maxRetries = 2;
    }
    
    this.openai = new OpenAI(openaiConfig);
  }
  
  /**
   * 获取思考工具配置
   * @private
   * @returns {object} 思考工具配置
   */
  private getReasoningTools() {
    // 定义用于获取思考过程的tools
    return [
      {
        type: "function" as const,
        function: {
          name: "thinking",
          description: "展示思考过程",
          parameters: {
            type: "object",
            properties: {
              thoughts: {
                type: "string",
                description: "详细的思考过程"
              }
            },
            required: ["thoughts"]
          }
        }
      }
    ];
  }
  
  /**
   * 检查当前模型是否支持函数调用
   * @private
   * @returns {boolean} 是否支持函数调用
   */
  private supportsToolCalling(): boolean {
    // 检查是否为DeepSeek提供商
    const isDeepSeek = this.modelConfig.provider?.toLowerCase() === 'deepseek';
    if (!isDeepSeek) {
      // 非DeepSeek提供商默认支持
      return true;
    }
    
    // 获取当前使用的模型名称
    const modelName = this.modelConfig.defaultModel?.toLowerCase() || '';
    
    // DeepSeek的"reasoner"系列模型不支持函数调用
    const unsupportedModels = ['deepseek-reasoner', 'deepseek-chat'];
    
    // 检查当前模型是否在不支持列表中
    for (const unsupportedModel of unsupportedModels) {
      if (modelName.includes(unsupportedModel)) {
        console.warn(`模型 ${modelName} 不支持函数调用，将跳过思考过程获取`);
        return false;
      }
    }
    
    // 默认支持
    return true;
  }
  
  /**
   * 检查是否为DeepSeek推理模型
   * @private
   * @returns {boolean} 是否为推理模型
   */
  private isDeepSeekReasoner(): boolean {
    // 获取当前使用的模型名称
    const modelName = this.modelConfig.defaultModel?.toLowerCase() || '';
    return modelName.includes('deepseek-reasoner');
  }
  
  /**
   * 为DeepSeek推理模型准备消息
   * 通过在系统提示中添加指令来获取思考过程
   * @private
   * @param {Message[]} messages - 原始消息
   * @returns {any[]} 处理后的消息
   */
  private prepareDeepSeekReasonerMessages(messages: Message[]): any[] {
    // 深拷贝消息数组
    const formattedMessages = [...messages].map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // 检查是否已有系统消息
    const hasSystemMessage = formattedMessages.some(msg => msg.role === 'system');
    
    // 添加或修改系统消息，要求模型展示推理过程
    if (!hasSystemMessage) {
      // 添加新的系统消息
      formattedMessages.unshift({
        role: 'system',
        content: '在回答问题时，请先用"```thinking"代码块详细展示你的推理过程，然后再给出最终答案。例如：\n```thinking\n这里是详细的推理和思考过程\n```\n\n最终回答：...'
      });
    } else {
      // 修改现有系统消息
      for (let i = 0; i < formattedMessages.length; i++) {
        if (formattedMessages[i].role === 'system') {
          formattedMessages[i].content += '\n\n在回答问题时，请先用"```thinking"代码块详细展示你的推理过程，然后再给出最终答案。例如：\n```thinking\n这里是详细的推理和思考过程\n```\n\n最终回答：...';
          break;
        }
      }
    }
    
    return formattedMessages;
  }
  
  /**
   * 从DeepSeek推理模型响应中提取思考过程
   * @private
   * @param {string} content - 模型响应内容 
   * @returns {object} 包含思考过程和最终答案的对象
   */
  private extractReasoningFromContent(content: string): { thoughts: string, finalAnswer: string } {
    // 默认结果
    let result = {
      thoughts: '',
      finalAnswer: content
    };
    
    // 提取思考代码块
    const thinkingMatch = content.match(/```thinking\s*([\s\S]*?)\s*```/);
    if (thinkingMatch && thinkingMatch[1]) {
      result.thoughts = thinkingMatch[1].trim();
      
      // 提取最终答案(思考代码块之后的所有内容)
      const finalAnswerMatch = content.split(/```thinking\s*[\s\S]*?\s*```\s*/);
      if (finalAnswerMatch.length > 1) {
        result.finalAnswer = finalAnswerMatch[1].trim();
      }
    }
    
    return result;
  }
  
  /**
   * 发送消息并获取响应
   * @param {Message[]} messages - 消息列表
   * @returns {Promise<string>} 模型响应
   */
  async sendMessage(messages: Message[]): Promise<string> {
    // 检查是否为DeepSeek提供商且支持函数调用
    const isDeepSeek = this.modelConfig.provider?.toLowerCase() === 'deepseek';
    const supportsTools = this.supportsToolCalling();
    const isReasoner = this.isDeepSeekReasoner();
    
    // 准备消息
    let formattedMessages;
    
    // 针对DeepSeek推理模型的特殊处理
    if (isReasoner) {
      formattedMessages = this.prepareDeepSeekReasonerMessages(messages);
    } else {
      formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
    }
    
    // 准备请求参数
    const requestParams: any = {
      model: this.modelConfig.defaultModel,
      messages: formattedMessages,
      temperature: 0.7
    };
    
    // 只有在支持函数调用的情况下才添加tools参数
    if (isDeepSeek && supportsTools) {
      // DeepSeek支持传递tools参数来获取思考过程
      requestParams.tools = this.getReasoningTools();
      requestParams.tool_choice = "auto";
    }
    
    // 发送请求
    const response = await this.openai.chat.completions.create(requestParams);
    
    // 处理思考过程 - 通过Function Calling
    if (isDeepSeek && supportsTools && response.choices[0]?.message?.tool_calls && response.choices[0].message.tool_calls.length > 0) {
      // 有思考过程的情况
      const toolCall = response.choices[0].message.tool_calls[0];
      if (toolCall && toolCall.function && toolCall.function.name === "thinking") {
        try {
          // 安全地解析工具调用参数
          const argumentsStr = toolCall.function.arguments || '{}';
          const parsed = JSON.parse(argumentsStr);
          const thoughts = parsed.thoughts;
          
          if (thoughts) {
            // 返回思考过程和最终回答
            return `思考过程:\n${thoughts}\n\n最终回答:\n${response.choices[0].message.content || ''}`;
          }
        } catch (error) {
          console.error('解析思考过程时出错:', error);
        }
      }
    }
    
    // 处理思考过程 - 通过解析DeepSeek推理模型输出
    if (isReasoner) {
      const content = response.choices[0].message.content || '';
      const { thoughts, finalAnswer } = this.extractReasoningFromContent(content);
      
      if (thoughts) {
        return `思考过程:\n${thoughts}\n\n最终回答:\n${finalAnswer}`;
      }
    }
    
    return response.choices[0].message.content || '';
  }
  
  /**
   * 发送流式消息
   * @param {Message[]} messages - 消息列表
   * @param {StreamHandlers} callbacks - 流式处理回调
   * @returns {Promise<void>}
   */
  async sendMessageStream(messages: Message[], callbacks: StreamHandlers): Promise<void> {
    try {
      console.log('开始创建流式请求...');
      
      // 检查是否为DeepSeek提供商且支持函数调用
      const isDeepSeek = this.modelConfig.provider?.toLowerCase() === 'deepseek';
      const supportsTools = this.supportsToolCalling();
      const isReasoner = this.isDeepSeekReasoner();
      
      // 准备消息
      let formattedMessages;
      
      // 针对DeepSeek推理模型的特殊处理
      if (isReasoner) {
        formattedMessages = this.prepareDeepSeekReasonerMessages(messages);
      } else {
        formattedMessages = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      }
      
      // 准备请求参数
      const requestParams: any = {
        model: this.modelConfig.defaultModel,
        messages: formattedMessages,
        temperature: 0.7,
        stream: true
      };
      
      // 只有在支持函数调用的情况下才添加tools参数
      if (isDeepSeek && supportsTools) {
        requestParams.tools = this.getReasoningTools();
        requestParams.tool_choice = "auto";
      }
      
      // 处理思考过程的变量
      let isThinking = false;
      let thoughts = '';
      
      // DeepSeek推理模型处理变量
      let reasonerBuffer = '';
      let inThinkingBlock = false;
      let hasOutputThinking = false;
      let thoughtsContent = '';
      
      // 创建流式请求
      const streamResponse = await this.openai.chat.completions.create(requestParams);
      
      // 使用类型断言告诉TypeScript这个对象是可以异步迭代的
      const stream = streamResponse as unknown as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
      
      console.log('成功获取到流式响应');
      
      // 处理流式响应
      for await (const chunk of stream) {
        // 处理思考工具调用
        if (isDeepSeek && supportsTools && 
            chunk.choices[0]?.delta?.tool_calls && 
            chunk.choices[0].delta.tool_calls.length > 0) {
          isThinking = true;
          const toolCallChunk = chunk.choices[0].delta.tool_calls[0];
          if (toolCallChunk && toolCallChunk.function && toolCallChunk.function.arguments) {
            thoughts += toolCallChunk.function.arguments;
            
            // 尝试解析完整的thoughts
            try {
              // 当JSON逐步构建时，可能会收到不完整的JSON
              // 只有当它是有效的JSON时才尝试处理
              const parsedThoughts = JSON.parse(thoughts);
              if (parsedThoughts.thoughts) {
                callbacks.onToken(`思考中: ${parsedThoughts.thoughts}\n`);
              }
            } catch (e) {
              // 忽略不完整的JSON解析错误
            }
          }
          continue;
        }
        
        // 处理DeepSeek推理模型的输出
        if (isReasoner) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            reasonerBuffer += content;
            
            // 检测思考代码块开始
            if (!inThinkingBlock && reasonerBuffer.includes('```thinking')) {
              inThinkingBlock = true;
              // 移除代码块前的内容
              const thinkingStart = reasonerBuffer.indexOf('```thinking') + '```thinking'.length;
              reasonerBuffer = reasonerBuffer.substring(thinkingStart);
              
              // 输出思考过程标记
              if (!hasOutputThinking) {
                callbacks.onToken('思考过程:\n');
                hasOutputThinking = true;
              }
              continue;
            }
            
            // 检测思考代码块结束
            if (inThinkingBlock && reasonerBuffer.includes('```')) {
              inThinkingBlock = false;
              
              // 提取思考内容(直到结束标记)
              const thinkingEnd = reasonerBuffer.indexOf('```');
              thoughtsContent = reasonerBuffer.substring(0, thinkingEnd);
              
              // 清空缓冲区，只保留代码块之后的内容
              reasonerBuffer = reasonerBuffer.substring(thinkingEnd + 3);
              
              // 输出最终答案标记
              callbacks.onToken('\n\n最终回答:\n');
              
              // 如果缓冲区中有内容，继续输出
              if (reasonerBuffer.trim()) {
                callbacks.onToken(reasonerBuffer);
                reasonerBuffer = '';
              }
              continue;
            }
            
            // 处理思考块内的内容
            if (inThinkingBlock) {
              callbacks.onToken(content);
              continue;
            }
            
            // 处理思考块前的内容(不输出)
            if (!hasOutputThinking && !inThinkingBlock) {
              continue;
            }
            
            // 处理最终答案
            callbacks.onToken(content);
          }
          continue;
        }
        
        // 处理普通内容
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          console.log('收到数据块:', {
            contentLength: content.length,
            content: content.substring(0, 50) + (content.length > 50 ? '...' : '')
          });
          
          // 如果之前有思考过程，在第一个内容块前加上分隔符
          if (isThinking && thoughts && !content.trim().startsWith('思考过程:')) {
            callbacks.onToken('\n最终回答:\n');
            isThinking = false;
          }
          
          callbacks.onToken(content);
          await this.smallDelay();
        }
      }
      
      console.log('流式响应完成');
      callbacks.onComplete();
    } catch (error) {
      console.error('流式处理过程中出错:', error);
      callbacks.onError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
  
  /**
   * 获取模型列表
   * @returns {Promise<ModelInfo[]>} 模型信息列表
   */
  async fetchModels(): Promise<ModelInfo[]> {
    try {
      // 尝试标准 OpenAI 格式的模型列表请求
      const response = await this.openai.models.list();
      console.log('API返回的原始模型列表:', response);
      
      // 只处理标准 OpenAI 格式
      if (response && response.data && Array.isArray(response.data)) {
        return response.data
          .map(model => ({
            id: model.id,
            name: model.id
          }))
          .sort((a, b) => a.id.localeCompare(b.id));
      }
      
      // 如果格式不匹配标准格式，记录并返回空数组
      console.warn('API返回格式与预期不符:', response);
      return [];
    } catch (error: any) {
      console.error('获取模型列表失败:', error);
      console.log('错误详情:', error.response?.data || error.message);
      
      // 发生错误时返回空数组
      return [];
    }
  }
  
  /**
   * 测试连接
   * @returns {Promise<void>}
   */
  async testConnection(): Promise<void> {
    const testMessages: Message[] = [
      { role: 'user', content: '请回答ok' }
    ];
    
    await this.sendMessage(testMessages);
  }
  
  /**
   * 小延迟，让UI有时间更新
   * @private
   * @returns {Promise<void>}
   */
  private async smallDelay(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  /**
   * 发送消息并返回包含思考过程的响应
   * @param {Message[]} messages - 消息列表
   * @returns {Promise<ThinkingResponse>} 包含思考过程的响应
   */
  async sendMessageWithThinking(messages: Message[]): Promise<ThinkingResponse> {
    // 检查是否为DeepSeek Reasoner模型
    const isReasoner = this.isDeepSeekReasoner();
    
    if (isReasoner) {
      try {
        // 对于DeepSeek Reasoner，调用API时直接返回思考过程
        const response = await this.openai.chat.completions.create({
          model: this.modelConfig.defaultModel || '',
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          temperature: this.modelConfig.temperature ?? 0.7,
          max_tokens: this.modelConfig.maxTokens ?? 1024,
        });
        
        // 检查API是否直接返回思考过程
        if (response.choices[0].message && 'reasoning_content' in response.choices[0].message) {
          const result: ThinkingResponse = {
            // @ts-ignore - 忽略类型错误，因为API可能返回未在类型定义中的字段
            thinking: response.choices[0].message.reasoning_content || null,
            content: response.choices[0].message.content || ''
          };
          return result;
        }
        
        // 如果API没有直接返回思考过程，使用提取器
        const content = response.choices[0].message.content || '';
        const extractResult = this.thoughtExtractor.extract(content);
        
        return {
          thinking: extractResult.thinking,
          content: extractResult.answer || content
        };
      } catch (error: any) {
        console.error('使用DeepSeek Reasoner获取思考过程失败:', error);
        // 失败时尝试普通请求方式
        const content = await this.sendMessage(messages);
        const extractResult = this.thoughtExtractor.extract(content);
        
        return {
          thinking: extractResult.thinking,
          content: extractResult.answer || content
        };
      }
    } else {
      // 非DeepSeek Reasoner模型，尝试使用工具调用请求思考过程
      try {
        if (this.supportsToolCalling()) {
          // 使用工具调用请求思考过程
          const response = await this.openai.chat.completions.create({
            model: this.modelConfig.defaultModel || '',
            messages: messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            tools: this.getReasoningTools(),
            temperature: this.modelConfig.temperature ?? 0.7,
            max_tokens: this.modelConfig.maxTokens ?? 1024,
          });
          
          // 提取思考内容和回答
          const responseMessage = response.choices[0].message;
          
          if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
            // 模型使用了思考工具
            const thinkingTool = responseMessage.tool_calls.find(
              tool => tool.function.name === 'thinking'
            );
            
            if (thinkingTool) {
              try {
                const thinkingContent = JSON.parse(thinkingTool.function.arguments);
                return {
                  thinking: thinkingContent.thoughts,
                  content: responseMessage.content || ''
                };
              } catch (error) {
                console.warn('解析思考内容失败', error);
              }
            }
          }
          
          // 如果没有使用工具或解析失败，返回普通内容
          return {
            thinking: null,
            content: responseMessage.content || ''
          };
        } else {
          // 不支持工具调用，尝试使用思考代码块提取
          const content = await this.sendMessage(messages);
          const { thoughts, finalAnswer } = this.extractReasoningFromContent(content);
          
          return {
            thinking: thoughts || null,
            content: finalAnswer
          };
        }
      } catch (error: any) {
        console.error('获取思考过程失败:', error);
        // 失败回退到普通请求
        const content = await this.sendMessage(messages);
        return {
          thinking: null,
          content
        };
      }
    }
  }
} 