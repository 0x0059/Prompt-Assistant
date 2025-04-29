import { Message, StreamHandlers, ModelInfo, ThinkingResponse } from '../types';

/**
 * 模型提供商接口
 * @interface IModelProvider
 * @description 定义所有模型提供商的通用接口
 */
export interface IModelProvider {
  /**
   * 发送消息
   * @param messages 消息列表
   * @returns 模型响应文本
   */
  sendMessage(messages: Message[]): Promise<string>;
  
  /**
   * 发送消息并返回带有思考过程的响应
   * @param messages 消息列表
   * @returns 包含思考过程的响应结果
   */
  sendMessageWithThinking(messages: Message[]): Promise<ThinkingResponse>;
  
  /**
   * 发送流式消息
   * @param messages 消息列表
   * @param callbacks 回调处理函数
   */
  sendMessageStream(messages: Message[], callbacks: StreamHandlers): Promise<void>;
  
  /**
   * 获取模型列表
   * @returns 模型信息列表
   */
  fetchModels(): Promise<ModelInfo[]>;
  
  /**
   * 测试连接
   */
  testConnection(): Promise<void>;
} 