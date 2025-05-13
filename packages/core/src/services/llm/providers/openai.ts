import OpenAI from 'openai';
import { ModelConfig } from '../../model/types';
import { Message, StreamHandlers, ModelInfo, ThinkingResponse } from '../types';
import { BaseModelProvider } from './baseProvider';
import { isVercel, getProxyUrl } from '../../../utils/environment';
import { ThoughtExtractor } from '../extractors/base/thoughtExtractor';
import { OpenAIHandler } from '../handlers/openaiHandler';
import { ThinkingExtractor } from '../extractors/helpers/thinkingExtractor';

// 定义OpenAI配置接口
interface OpenAIClientConfig {
  apiKey: string | undefined;
  baseURL: string | undefined;
  dangerouslyAllowBrowser: boolean;
  timeout?: number;
  maxRetries?: number;
}

/**
 * OpenAI兼容的模型提供商
 * @class OpenAIProvider
 * @extends {BaseModelProvider}
 * @description 提供OpenAI API支持，同时内置支持DeepSeek和Ollama等兼容OpenAI API的服务
 */
export class OpenAIProvider extends BaseModelProvider {
  private openai: OpenAI;
  private isStream: boolean;
  private streamHandler: OpenAIHandler;
  protected thinkingExtractor: ThinkingExtractor;
  
  /**
   * 创建OpenAI提供商实例
   * @param {ModelConfig} config - 模型配置
   * @param {boolean} isStream - 是否为流式请求
   */
  constructor(config: ModelConfig, isStream: boolean = false) {
    super(config);
    this.isStream = isStream;
    this.openai = new OpenAI(this.createOpenAIConfig(config, isStream));
    this.streamHandler = new OpenAIHandler(this.thoughtExtractor);
    this.thinkingExtractor = new ThinkingExtractor(this.thoughtExtractor);
  }
  
  /**
   * 创建OpenAI客户端配置
   * @private
   * @param {ModelConfig} config - 模型配置
   * @param {boolean} isStream - 是否为流式请求
   * @returns {OpenAIClientConfig} OpenAI客户端配置
   */
  private createOpenAIConfig(config: ModelConfig, isStream: boolean): OpenAIClientConfig {
    // 处理API URL
    let processedBaseURL = config.baseURL;
    if (processedBaseURL?.endsWith('/chat/completions')) {
      processedBaseURL = processedBaseURL.slice(0, -'/chat/completions'.length);
    }
    
    // 处理Vercel代理
    let finalBaseURL = processedBaseURL;
    if (config.useVercelProxy === true && isVercel() && processedBaseURL) {
      finalBaseURL = getProxyUrl(processedBaseURL, isStream);
      console.log(`使用${isStream ? '流式' : ''}API代理:`, finalBaseURL);
    }
    
    // 创建基础配置
    const openaiConfig: OpenAIClientConfig = {
      apiKey: config.apiKey,
      baseURL: finalBaseURL,
      dangerouslyAllowBrowser: true
    };
    
    // 流式请求的特殊配置
    if (isStream) {
      openaiConfig.timeout = 30000;
      openaiConfig.maxRetries = 2;
    }
    
    return openaiConfig;
  }
  
  /**
   * 获取思考工具配置
   * @private
   * @returns {object} 思考工具配置
   */
  private getReasoningTools() {
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
    const isDeepSeek = this.isDeepSeekProvider();
    if (!isDeepSeek) {
      return true; // 非DeepSeek提供商默认支持
    }
    
    const modelName = this.modelConfig.defaultModel?.toLowerCase() || '';
    const unsupportedModels = ['deepseek-reasoner', 'deepseek-chat'];
    
    for (const unsupportedModel of unsupportedModels) {
      if (modelName.includes(unsupportedModel)) {
        console.warn(`模型 ${modelName} 不支持函数调用，将跳过思考过程获取`);
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * 检查是否为DeepSeek提供商
   * @protected
   * @returns {boolean} 是否为DeepSeek提供商
   */
  protected isDeepSeekProvider(): boolean {
    return this.modelConfig.provider?.toLowerCase() === 'deepseek';
  }
  
  /**
   * 检查是否为DeepSeek推理模型
   * @protected
   * @returns {boolean} 是否为推理模型
   */
  protected isDeepSeekReasoner(): boolean {
    const modelName = this.modelConfig.defaultModel?.toLowerCase() || '';
    return modelName.includes('deepseek-reasoner');
  }
  
  /**
   * 为DeepSeek推理模型准备消息
   * @protected
   * @param {Message[]} messages - 原始消息
   * @returns {any[]} 处理后的消息
   */
  protected prepareDeepSeekReasonerMessages(messages: Message[]): any[] {
    const formattedMessages = [...messages].map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    const thinkingPrompt = '\n\n在回答问题时，请先用"```thinking"代码块详细展示你的推理过程，然后再给出最终答案。例如：\n```thinking\n这里是详细的推理和思考过程\n```\n\n最终回答：...';
    
    // 检查是否已有系统消息
    const hasSystemMessage = formattedMessages.some(msg => msg.role === 'system');
    
    if (!hasSystemMessage) {
      // 添加新的系统消息
      formattedMessages.unshift({
        role: 'system',
        content: '请详细分析问题并给出清晰的回答。' + thinkingPrompt
      });
    } else {
      // 修改现有系统消息
      for (let i = 0; i < formattedMessages.length; i++) {
        if (formattedMessages[i].role === 'system') {
          formattedMessages[i].content += thinkingPrompt;
          break;
        }
      }
    }
    
    return formattedMessages;
  }
  
  /**
   * 准备发送到API的消息
   * @protected
   * @param {Message[]} messages - 消息列表
   * @returns {any[]} 处理后的消息
   */
  protected prepareMessages(messages: Message[]): any[] {
    return messages.map(msg => ({ role: msg.role, content: msg.content }));
  }
  
  /**
   * 创建请求参数
   * @private
   * @param {Message[]} messages - 消息列表
   * @param {boolean} stream - 是否为流式请求
   * @returns {object} 请求参数
   */
  private createRequestParams(messages: Message[], stream: boolean = false): any {
    const supportsTools = this.supportsToolCalling();
    
    // 准备消息
    const formattedMessages = this.prepareMessages(messages);
    
    // 基础请求参数
    const requestParams: any = {
      model: this.modelConfig.defaultModel,
      messages: formattedMessages,
      temperature: this.modelConfig.temperature ?? 0.7,
      stream: stream
    };
    
    // 只有在支持函数调用的情况下才添加tools参数
    if (supportsTools && !stream) {
      requestParams.tools = this.getReasoningTools();
    }
    
    // 最大令牌数
    if (this.modelConfig.maxTokens) {
      requestParams.max_tokens = this.modelConfig.maxTokens;
    }
    
    return requestParams;
  }
  
  /**
   * 发送消息并获取响应
   * @param {Message[]} messages - 消息列表
   * @returns {Promise<string>} 模型响应
   */
  async sendMessage(messages: Message[]): Promise<string> {
    try {
      const requestParams = this.createRequestParams(messages);
      
      const response = await this.openai.chat.completions.create(requestParams);
      
      const isDeepSeek = this.isDeepSeekProvider();
      const supportsTools = this.supportsToolCalling();
      const isReasoner = this.isDeepSeekReasoner();
      
      const content = this.thinkingExtractor.processResponseWithThinking(
        response, isDeepSeek, supportsTools, isReasoner
      );
      
      return content;
    } catch (error) {
      console.error('发送消息失败:', error);
      throw error;
    }
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
      
      // 创建流式请求参数
      const requestParams = this.createRequestParams(messages, true);
      const streamResponse = await this.openai.chat.completions.create(requestParams);
      
      // 使用类型断言告诉TypeScript这个对象是可以异步迭代的
      const stream = streamResponse as unknown as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
      console.log('成功获取到流式响应');
      
      // 状态变量
      const toolState = { isThinking: false, thoughts: '' };
      const reasonerState = { 
        reasonerBuffer: '', 
        inThinkingBlock: false, 
        hasOutputThinking: false,
        thoughtsContent: '' 
      };
      
      const isDeepSeek = this.isDeepSeekProvider();
      const supportsTools = this.supportsToolCalling();
      const isReasoner = this.isDeepSeekReasoner();
      
      // 处理流式响应
      for await (const chunk of stream) {
        // 按优先级尝试不同处理器
        const isToolCallHandled = this.streamHandler.handleThinkingToolCall(
          chunk, callbacks, toolState, isDeepSeek, supportsTools
        );
        if (isToolCallHandled) continue;
        
        const isReasonerHandled = this.streamHandler.handleReasonerOutput(
          chunk, callbacks, reasonerState, isReasoner
        );
        if (isReasonerHandled) continue;
        
        // 处理普通内容
        await this.streamHandler.handleRegularContent(chunk, callbacks, toolState);
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
   * 发送消息并返回包含思考过程的响应
   * @param {Message[]} messages - 消息列表
   * @returns {Promise<ThinkingResponse>} 包含思考过程的响应
   */
  async sendMessageWithThinking(messages: Message[]): Promise<ThinkingResponse> {
    const isReasoner = this.isDeepSeekReasoner();
    const isDeepSeek = this.isDeepSeekProvider();
    const supportsTools = this.supportsToolCalling();
    
    // 尝试使用DeepSeek Reasoner API
    if (isReasoner) {
      try {
        return await this.thinkingExtractor.getThinkingFromReasoner(
          this.openai,
          this.modelConfig.defaultModel || '',
          messages,
          this.modelConfig.temperature ?? 0.7,
          this.modelConfig.maxTokens ?? 1024
        );
      } catch (error: any) {
        console.error('使用DeepSeek Reasoner获取思考过程失败:', error);
        // 失败时回退到基础方法
        const content = await this.sendMessage(messages);
        return this.thinkingExtractor.fallbackExtractThinking(content);
      }
    } 
    // 尝试使用工具调用
    else if (isDeepSeek && supportsTools) {
      try {
        return await this.thinkingExtractor.getThinkingFromToolCall(
          this.openai,
          this.modelConfig.defaultModel || '',
          messages,
          this.getReasoningTools(),
          this.modelConfig.temperature ?? 0.7,
          this.modelConfig.maxTokens ?? 1024
        );
      } catch (error: any) {
        console.error('使用工具调用获取思考过程失败:', error);
        // 错误情况下回退到基类的默认行为
        return super.sendMessageWithThinking(messages);
      }
    } 
    // 使用基类的默认实现
    else {
      return super.sendMessageWithThinking(messages);
    }
  }
  
  /**
   * 测试连接
   * @returns {Promise<void>}
   */
  async testConnection(): Promise<void> {
    await super.testConnection();
  }
} 