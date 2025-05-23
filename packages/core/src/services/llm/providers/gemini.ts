import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { ModelConfig } from '../../model/types';
import { Message, StreamHandlers, ModelInfo, ThinkingResponse } from '../types';
import { BaseModelProvider } from './baseProvider';
import { isVercel, getProxyUrl } from '../../../utils/environment';
import { ThoughtExtractor } from '../extractors/base/thoughtExtractor';

/**
 * Gemini模型提供商
 * @class GeminiProvider
 * @extends {BaseModelProvider}
 */
export class GeminiProvider extends BaseModelProvider {
  /**
   * 创建Gemini提供商实例
   * @param {ModelConfig} config - 模型配置
   */
  constructor(config: ModelConfig) {
    super(config);
  }
  
  /**
   * 获取Gemini模型实例
   * @private
   * @param {string} [systemInstruction] - 系统指令
   * @param {boolean} [isStream=false] - 是否为流式请求
   * @returns {GenerativeModel} Gemini模型实例
   */
  private getModel(systemInstruction?: string, isStream: boolean = false): GenerativeModel {
    const apiKey = this.modelConfig.apiKey || '';
    const genAI = new GoogleGenerativeAI(apiKey);
    
    const modelOptions: any = {
      model: this.modelConfig.defaultModel
    };
    
    if (systemInstruction) {
      modelOptions.systemInstruction = systemInstruction;
    }
    
    let processedBaseURL = this.modelConfig.baseURL;
    if (processedBaseURL?.endsWith('/v1beta')) {
      processedBaseURL = processedBaseURL.slice(0, -'/v1beta'.length);
    }
    
    let finalBaseURL = processedBaseURL;
    if (this.modelConfig.useVercelProxy === true && isVercel() && processedBaseURL) {
      finalBaseURL = getProxyUrl(processedBaseURL, isStream);
      console.log(`使用${isStream ? '流式' : ''}API代理:`, finalBaseURL);
    }
    
    return genAI.getGenerativeModel(modelOptions, { "baseUrl": finalBaseURL });
  }
  
  /**
   * 格式化Gemini历史记录
   * @private
   * @param {Message[]} messages - 消息列表
   * @returns {any[]} 格式化后的历史记录
   */
  private formatHistory(messages: Message[]): any[] {
    if (messages.length <= 1) {
      return [];
    }
    
    // 排除最后一条消息（将由sendMessage单独发送）
    const historyMessages = messages.slice(0, -1);
    const formattedHistory = [];
    
    for (let i = 0; i < historyMessages.length; i++) {
      const msg = historyMessages[i];
      if (msg.role === 'user') {
        formattedHistory.push({
          role: 'user',
          parts: [{ text: msg.content }]
        });
      } else if (msg.role === 'assistant') {
        formattedHistory.push({
          role: 'model',
          parts: [{ text: msg.content }]
        });
      }
    }
    
    return formattedHistory;
  }
  
  /**
   * 发送消息并获取响应
   * @param {Message[]} messages - 消息列表
   * @returns {Promise<string>} 模型响应
   */
  async sendMessage(messages: Message[]): Promise<string> {
    // 提取系统消息
    const systemMessages = messages.filter(msg => msg.role === 'system');
    const systemInstruction = systemMessages.length > 0
      ? systemMessages.map(msg => msg.content).join('\n')
      : '';
    
    // 获取带有系统指令的模型实例
    const model = this.getModel(systemInstruction, false);
    
    // 过滤出用户和助手消息
    const conversationMessages = messages.filter(msg => msg.role !== 'system');
    
    // 创建聊天会话
    const chat = model.startChat({
      history: this.formatHistory(conversationMessages)
    });
    
    // 获取最后一条用户消息
    const lastUserMessage = conversationMessages.length > 0 &&
      conversationMessages[conversationMessages.length - 1].role === 'user'
      ? conversationMessages[conversationMessages.length - 1].content
      : '';
    
    // 如果没有用户消息，返回空字符串
    if (!lastUserMessage) {
      return '';
    }
    
    // 发送消息并获取响应
    const result = await chat.sendMessage(lastUserMessage);
    return result.response.text();
  }
  
  /**
   * 发送流式消息
   * @param {Message[]} messages - 消息列表
   * @param {StreamHandlers} callbacks - 流式处理回调
   * @returns {Promise<void>}
   */
  async sendMessageStream(messages: Message[], callbacks: StreamHandlers): Promise<void> {
    // 提取系统消息
    const systemMessages = messages.filter(msg => msg.role === 'system');
    const systemInstruction = systemMessages.length > 0
      ? systemMessages.map(msg => msg.content).join('\n')
      : '';
    
    // 获取带有系统指令的模型实例
    const model = this.getModel(systemInstruction, true);
    
    // 过滤出用户和助手消息
    const conversationMessages = messages.filter(msg => msg.role !== 'system');
    
    // 创建聊天会话
    const chat = model.startChat({
      history: this.formatHistory(conversationMessages)
    });
    
    // 获取最后一条用户消息
    const lastUserMessage = conversationMessages.length > 0 &&
      conversationMessages[conversationMessages.length - 1].role === 'user'
      ? conversationMessages[conversationMessages.length - 1].content
      : '';
    
    // 如果没有用户消息，返回空字符串
    if (!lastUserMessage) {
      callbacks.onComplete();
      return;
    }
    
    try {
      console.log('开始创建Gemini流式请求...');
      const result = await chat.sendMessageStream(lastUserMessage);
      
      console.log('成功获取到流式响应');
      
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          console.log('收到数据块:', {
            contentLength: text.length,
            content: text.substring(0, 50) + (text.length > 50 ? '...' : '')
          });
          
          await callbacks.onToken(text);
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
    console.log(`获取${this.modelConfig.name || 'Gemini'}的模型列表`);
    
    // Gemini API没有直接获取模型列表的接口，返回预定义列表
    return [
      { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro' },
      { id: 'gemini-1.0-pro-vision', name: 'Gemini 1.0 Pro Vision' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' }
    ];
  }
  
  /**
   * 发送消息并返回包含思考过程的响应
   * @param {Message[]} messages - 消息列表
   * @returns {Promise<ThinkingResponse>} 包含思考过程的响应
   */
  async sendMessageWithThinking(messages: Message[]): Promise<ThinkingResponse> {
    try {
      // 尝试通过修改提示引导模型提供思考过程
      const messagesWithPrompt = [...messages];
      
      // 如果最后一条消息是用户消息，添加思考指导
      if (messagesWithPrompt.length > 0 && messagesWithPrompt[messagesWithPrompt.length - 1].role === 'user') {
        const lastMsg = messagesWithPrompt[messagesWithPrompt.length - 1];
        messagesWithPrompt[messagesWithPrompt.length - 1] = {
          ...lastMsg,
          content: `${lastMsg.content}\n\n请先用"<think>...</think>"格式展示你的思考过程，然后给出最终答案。`
        };
      }
      
      // 获取响应并使用基类提取器
      const content = await this.sendMessage(messagesWithPrompt);
      return {
        thinking: this.thoughtExtractor.extract(content).thinking,
        content: this.thoughtExtractor.extract(content).answer || content
      };
    } catch (error) {
      return super.sendMessageWithThinking(messages); // 失败时使用基类方法
    }
  }
} 