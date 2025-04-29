import OpenAI from 'openai';
import { ModelConfig } from '../../model/types';
import { Message, StreamHandlers, ModelInfo, ThinkingResponse } from '../types';
import { IModelProvider } from './interface';
import { isVercel, getProxyUrl } from '../../../utils/environment';
import { DeepSeekThoughtExtractor, IThoughtExtractor } from '../../../utils/deepseekThoughtExtractor';

/**
 * 思考过程调用策略接口
 */
interface ThinkingStrategy {
  prepareMessages(messages: Message[]): any[];
  extractThinking(response: any): ThinkingResponse;
}

/**
 * 使用函数调用获取思考过程的策略
 */
class FunctionCallingStrategy implements ThinkingStrategy {
  /**
   * 准备带有思考工具的消息
   * @param messages 原始消息
   * @returns 处理后的消息
   */
  prepareMessages(messages: Message[]): any[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }
  
  /**
   * 从函数调用响应中提取思考过程
   * @param response 模型响应
   * @returns 包含思考过程和最终答案的响应
   */
  extractThinking(response: any): ThinkingResponse {
    let thinking = null;
    let content = '';
    
    // 检查是否有工具调用
    if (response.tool_calls && response.tool_calls.length > 0) {
      const thinkingCall = response.tool_calls.find(
        (call: any) => call.function?.name === 'thinking'
      );
      
      if (thinkingCall) {
        try {
          const args = JSON.parse(thinkingCall.function.arguments);
          thinking = args.thoughts;
        } catch (e) {
          console.error('无法解析思考参数:', e);
        }
      }
    }
    
    // 获取内容
    content = response.content || '';
    
    return { thinking, content };
  }
}

/**
 * 使用特定提示词获取思考过程的策略
 */
class PromptInstructionStrategy implements ThinkingStrategy {
  private thoughtExtractor: IThoughtExtractor;
  
  constructor(thoughtExtractor: IThoughtExtractor) {
    this.thoughtExtractor = thoughtExtractor;
  }
  
  /**
   * 准备带有思考指令的消息
   * @param messages 原始消息
   * @returns 处理后的消息
   */
  prepareMessages(messages: Message[]): any[] {
    // 深拷贝消息数组
    const formattedMessages = [...messages].map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // 检查是否已有系统消息
    const hasSystemMessage = formattedMessages.some(msg => msg.role === 'system');
    const thinkingInstruction = '在回答问题时，请先用"```thinking"代码块详细展示你的推理过程，然后再给出最终答案。例如：\n```thinking\n这里是详细的推理和思考过程\n```\n\n最终回答：...';
    
    // 添加或修改系统消息
    if (!hasSystemMessage) {
      // 添加新的系统消息
      formattedMessages.unshift({
        role: 'system',
        content: thinkingInstruction
      });
    } else {
      // 修改现有系统消息
      for (let i = 0; i < formattedMessages.length; i++) {
        if (formattedMessages[i].role === 'system') {
          formattedMessages[i].content += '\n\n' + thinkingInstruction;
          break;
        }
      }
    }
    
    return formattedMessages;
  }
  
  /**
   * 从响应中提取思考过程
   * @param content 模型响应内容
   * @returns 包含思考过程和最终答案的响应
   */
  extractThinking(content: string): ThinkingResponse {
    const result = this.thoughtExtractor.extract(content);
    return {
      thinking: result.thinking,
      content: result.answer || content
    };
  }
}

/**
 * OpenAI兼容的模型提供商
 * @class OpenAIProvider
 * @implements {IModelProvider}
 */
export class OpenAIProvider implements IModelProvider {
  private openai: OpenAI;
  private modelConfig: ModelConfig;
  private thoughtExtractor: IThoughtExtractor;
  
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
   * 获取适当的思考策略
   * @private
   * @returns {ThinkingStrategy} 思考策略
   */
  private getThinkingStrategy(): ThinkingStrategy {
    const supportsTools = this.supportsToolCalling();
    const isReasoner = this.isDeepSeekReasoner();
    
    // 如果是推理模型或不支持工具调用，使用提示词策略
    if (isReasoner || !supportsTools) {
      return new PromptInstructionStrategy(this.thoughtExtractor);
    }
    
    // 默认使用函数调用策略
    return new FunctionCallingStrategy();
  }
  
  /**
   * 发送消息并获取响应
   * @param {Message[]} messages - 消息列表
   * @returns {Promise<string>} 模型响应
   */
  async sendMessage(messages: Message[]): Promise<string> {
    // 默认情况下不需要思考过程提取
    // 直接发送普通请求
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    const response = await this.openai.chat.completions.create({
      model: this.modelConfig.defaultModel,
      messages: formattedMessages,
      temperature: this.modelConfig.temperature ?? 0.7,
      max_tokens: this.modelConfig.maxTokens,
    });
    
    return response.choices[0]?.message?.content || '';
  }
  
  /**
   * 发送流式消息
   * @param {Message[]} messages - 消息列表
   * @param {StreamHandlers} callbacks - 流式处理回调
   * @returns {Promise<void>}
   */
  async sendMessageStream(messages: Message[], callbacks: StreamHandlers): Promise<void> {
    try {
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      const stream = await this.openai.chat.completions.create({
        model: this.modelConfig.defaultModel,
        messages: formattedMessages,
        temperature: this.modelConfig.temperature ?? 0.7,
        max_tokens: this.modelConfig.maxTokens,
        stream: true,
      });
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          await callbacks.onToken(content);
          await this.smallDelay();
        }
      }
      
      callbacks.onComplete();
    } catch (error) {
      console.error('流式处理过程中出错:', error);
      callbacks.onError(error instanceof Error ? error : new Error(String(error)));
    }
  }
  
  /**
   * 获取模型列表
   * @returns {Promise<ModelInfo[]>} 模型信息列表
   */
  async fetchModels(): Promise<ModelInfo[]> {
    // 对于DeepSeek提供商返回内置模型列表
    if (this.modelConfig.provider?.toLowerCase() === 'deepseek') {
      return [
        { id: 'deepseek-chat', name: 'DeepSeek Chat' },
        { id: 'deepseek-coder', name: 'DeepSeek Coder' },
        { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner' }
      ];
    }
    
    try {
      const response = await this.openai.models.list();
      return response.data
        .filter(model => model.id.includes('gpt'))
        .map(model => ({
          id: model.id,
          name: model.id
        }));
    } catch (error) {
      console.error('获取模型列表失败，返回默认列表:', error);
      // 请求失败时返回默认模型列表
      return [
        { id: 'gpt-4o', name: 'GPT-4o' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
      ];
    }
  }
  
  /**
   * 测试连接
   * @returns {Promise<void>}
   */
  async testConnection(): Promise<void> {
    try {
      await this.fetchModels();
    } catch (error: any) {
      throw new Error(`无法连接到 ${this.modelConfig.name || 'OpenAI'} API: ${error.message}`);
    }
  }
  
  /**
   * 小延迟，用于流式响应
   * @private
   * @returns {Promise<void>}
   */
  private async smallDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
  }
  
  /**
   * 发送消息并返回包含思考过程的响应
   * @param {Message[]} messages - 消息列表
   * @returns {Promise<ThinkingResponse>} 包含思考过程的响应
   */
  async sendMessageWithThinking(messages: Message[]): Promise<ThinkingResponse> {
    try {
      // 获取适合当前模型的思考策略
      const thinkingStrategy = this.getThinkingStrategy();
      
      // 根据策略准备消息
      const preparedMessages = thinkingStrategy.prepareMessages(messages);
      
      // 如果使用函数调用策略
      if (thinkingStrategy instanceof FunctionCallingStrategy) {
        const response = await this.openai.chat.completions.create({
          model: this.modelConfig.defaultModel,
          messages: preparedMessages,
          temperature: this.modelConfig.temperature ?? 0.7,
          max_tokens: this.modelConfig.maxTokens,
          tools: this.getReasoningTools(),
          tool_choice: "auto"
        });
        
        const result = response.choices[0]?.message;
        if (!result) {
          return { content: '', thinking: null };
        }
        
        return thinkingStrategy.extractThinking(result);
      } else {
        // 如果使用提示词策略
        const response = await this.openai.chat.completions.create({
          model: this.modelConfig.defaultModel,
          messages: preparedMessages,
          temperature: this.modelConfig.temperature ?? 0.7,
          max_tokens: this.modelConfig.maxTokens
        });
        
        const content = response.choices[0]?.message?.content || '';
        return thinkingStrategy.extractThinking(content);
      }
    } catch (error) {
      console.error('获取思考过程失败:', error);
      // 失败时回退到普通响应
      const content = await this.sendMessage(messages);
      return { thinking: null, content };
    }
  }
} 