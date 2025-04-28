import { Message, StreamHandlers, ModelInfo } from '../types';

/**
 * 模型提供商接口
 * @interface IModelProvider
 * @description 定义所有模型提供商的通用接口
 */
export interface IModelProvider {
  /**
   * 发送消息并获取响应
   * @param {Message[]} messages - 消息列表
   * @returns {Promise<string>} 模型响应
   */
  sendMessage(messages: Message[]): Promise<string>;
  
  /**
   * 发送流式消息
   * @param {Message[]} messages - 消息列表
   * @param {StreamHandlers} callbacks - 流式处理回调
   * @returns {Promise<void>}
   */
  sendMessageStream(messages: Message[], callbacks: StreamHandlers): Promise<void>;
  
  /**
   * 获取模型列表
   * @returns {Promise<ModelInfo[]>} 模型信息列表
   */
  fetchModels(): Promise<ModelInfo[]>;
  
  /**
   * 测试连接
   * @returns {Promise<void>}
   */
  testConnection(): Promise<void>;
} 