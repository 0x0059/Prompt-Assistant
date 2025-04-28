import OpenAI from 'openai';
import { ModelConfig } from '../../model/types';
import { Message, StreamHandlers, ModelInfo } from '../types';
import { IModelProvider } from './interface';
import { isVercel, getProxyUrl } from '../../../utils/environment';

/**
 * OpenAI兼容的模型提供商
 * @class OpenAIProvider
 * @implements {IModelProvider}
 */
export class OpenAIProvider implements IModelProvider {
  private openai: OpenAI;
  private modelConfig: ModelConfig;
  
  /**
   * 创建OpenAI提供商实例
   * @param {ModelConfig} config - 模型配置
   * @param {boolean} isStream - 是否为流式请求
   */
  constructor(config: ModelConfig, isStream: boolean = false) {
    this.modelConfig = config;
    
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
   * 发送消息并获取响应
   * @param {Message[]} messages - 消息列表
   * @returns {Promise<string>} 模型响应
   */
  async sendMessage(messages: Message[]): Promise<string> {
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    const response = await this.openai.chat.completions.create({
      model: this.modelConfig.defaultModel,
      messages: formattedMessages,
      temperature: 0.7
    });
    
    return response.choices[0].message.content || '';
  }
  
  /**
   * 发送流式消息
   * @param {Message[]} messages - 消息列表
   * @param {StreamHandlers} callbacks - 流式处理回调
   * @returns {Promise<void>}
   */
  async sendMessageStream(messages: Message[], callbacks: StreamHandlers): Promise<void> {
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    try {
      console.log('开始创建流式请求...');
      const stream = await this.openai.chat.completions.create({
        model: this.modelConfig.defaultModel,
        messages: formattedMessages,
        temperature: 0.7,
        stream: true
      });
      
      console.log('成功获取到流式响应');
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          console.log('收到数据块:', {
            contentLength: content.length,
            content: content.substring(0, 50) + (content.length > 50 ? '...' : '')
          });
          
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
} 