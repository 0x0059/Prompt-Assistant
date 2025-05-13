import { ModelConfig } from '../../model/types';
import { Message, StreamHandlers, ModelInfo } from '../types';
import { BaseModelProvider } from './baseProvider';
import { OpenAIProvider } from './openai';

/**
 * Anthropic模型提供商
 * @class AnthropicProvider
 * @extends {BaseModelProvider}
 */
export class AnthropicProvider extends BaseModelProvider {
  /**
   * 创建Anthropic提供商实例
   * @param {ModelConfig} config - 模型配置
   */
  constructor(config: ModelConfig) {
    super(config);
  }
  
  /**
   * 发送消息并获取响应
   * @param {Message[]} messages - 消息列表
   * @returns {Promise<string>} 模型响应
   */
  async sendMessage(messages: Message[]): Promise<string> {
    // Anthropic API调用方式与OpenAI不同，这里使用OpenAI兼容模式代替
    // 实际使用时应替换为Anthropic官方API
    const openaiProvider = new OpenAIProvider(this.modelConfig);
    return openaiProvider.sendMessage(messages);
  }
  
  /**
   * 发送流式消息
   * @param {Message[]} messages - 消息列表
   * @param {StreamHandlers} callbacks - 流式处理回调
   * @returns {Promise<void>}
   */
  async sendMessageStream(messages: Message[], callbacks: StreamHandlers): Promise<void> {
    // 同上，使用OpenAI兼容模式
    const openaiProvider = new OpenAIProvider(this.modelConfig, true);
    return openaiProvider.sendMessageStream(messages, callbacks);
  }
  
  /**
   * 获取模型列表
   * @returns {Promise<ModelInfo[]>} 模型信息列表
   */
  async fetchModels(): Promise<ModelInfo[]> {
    console.log(`获取${this.modelConfig.name || 'Anthropic'}的模型列表`);
    
    // Anthropic API没有公开的模型列表接口
    return [
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
      { id: 'claude-2.1', name: 'Claude 2.1' }
    ];
  }
} 