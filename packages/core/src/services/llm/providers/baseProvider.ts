import { ModelConfig } from '../../model/types';
import { Message, StreamHandlers, ModelInfo, ThinkingResponse } from '../types';
import { IModelProvider } from './interface';
import { ThoughtExtractor } from '../extractors/base/thoughtExtractor';
import { ThinkingExtractor } from '../extractors/helpers/thinkingExtractor';

/**
 * 模型提供商基类
 * @class BaseModelProvider
 * @implements {IModelProvider}
 * @description 提供所有模型提供商共用的基础功能
 */
export abstract class BaseModelProvider implements IModelProvider {
  protected modelConfig: ModelConfig;
  protected thoughtExtractor: ThoughtExtractor;
  protected thinkingExtractor: ThinkingExtractor;
  
  /**
   * 创建基础提供商实例
   * @param {ModelConfig} config - 模型配置
   */
  constructor(config: ModelConfig) {
    this.modelConfig = config;
    this.thoughtExtractor = new ThoughtExtractor();
    this.thinkingExtractor = new ThinkingExtractor(this.thoughtExtractor);
  }

  /**
   * 发送消息
   * @param messages 消息列表
   * @returns 模型响应文本
   */
  abstract sendMessage(messages: Message[]): Promise<string>;
  
  /**
   * 发送流式消息
   * @param messages 消息列表
   * @param callbacks 回调处理函数
   */
  abstract sendMessageStream(messages: Message[], callbacks: StreamHandlers): Promise<void>;
  
  /**
   * 获取模型列表
   * @returns 模型信息列表
   */
  abstract fetchModels(): Promise<ModelInfo[]>;

  /**
   * 测试连接
   * 默认实现使用sendMessage发送简单测试消息
   */
  async testConnection(): Promise<void> {
    const testMessages: Message[] = [
      { role: 'user', content: '请回答ok' }
    ];
    
    await this.sendMessage(testMessages);
  }
  
  /**
   * 发送消息并返回带有思考过程的响应
   * 默认实现尝试从普通响应中提取思考过程
   * 子类可以覆盖此方法提供更高效的实现
   */
  async sendMessageWithThinking(messages: Message[]): Promise<ThinkingResponse> {
    try {
      const content = await this.sendMessage(messages);
      return this.thinkingExtractor.fallbackExtractThinking(content);
    } catch (error) {
      console.error('获取思考过程失败:', error);
      // 错误情况下回退到普通响应
      const content = await this.sendMessage(messages);
      return {
        thinking: null,
        content
      };
    }
  }
  
  /**
   * 小延迟，用于流式响应时让UI有时间更新
   * @public
   * @returns {Promise<void>}
   */
  public async smallDelay(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
} 