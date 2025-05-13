/**
 * @file types.ts
 * @description LLM服务相关类型定义
 * @module @prompt-assistant/core/services/llm
 */

/**
 * LLM消息角色
 * @type {string}
 */
export type MessageRole = 'system' | 'user' | 'assistant';

/**
 * LLM消息
 * @interface Message
 */
export interface Message {
  /**
   * 消息角色
   * @type {MessageRole}
   */
  role: MessageRole;
  
  /**
   * 消息内容
   * @type {string}
   */
  content: string;
}

/**
 * 流式处理回调
 * @interface StreamHandlers
 */
export interface StreamHandlers {
  /**
   * 接收单个令牌时的回调
   * @param {string} token - 单个令牌文本
   * @returns {Promise<void>}
   */
  onToken: (token: string) => void | Promise<void>;
  
  /**
   * 流处理完成时的回调
   * @returns {void}
   */
  onComplete: () => void;
  
  /**
   * 出现错误时的回调
   * @param {Error} error - 错误对象
   * @returns {void}
   */
  onError: (error: Error) => void;
}

/**
 * 思考响应
 * @interface ThinkingResponse
 */
export interface ThinkingResponse {
  /**
   * 思考过程
   * @type {string | null}
   */
  thinking: string | null;
  
  /**
   * 最终内容
   * @type {string}
   */
  content: string;
}

/**
 * 模型信息
 * @interface ModelInfo
 */
export interface ModelInfo {
  /**
   * 模型ID
   * @type {string}
   */
  id: string;
  
  /**
   * 模型名称
   * @type {string}
   */
  name: string;
}

/**
 * 模型选项
 * @interface ModelOption
 */
export interface ModelOption {
  /**
   * 选项值
   * @type {string}
   */
  value: string;
  
  /**
   * 显示标签
   * @type {string}
   */
  label: string;
}

/**
 * LLM服务事件类型
 * @enum {string}
 */
export enum LLMServiceEventType {
  // 消息事件
  MESSAGE_SENDING = 'llm:message:sending',
  MESSAGE_SENT = 'llm:message:sent',
  MESSAGE_ERROR = 'llm:message:error',
  
  // 流式消息事件
  STREAM_STARTED = 'llm:stream:started',
  STREAM_TOKEN = 'llm:stream:token',
  STREAM_COMPLETED = 'llm:stream:completed',
  STREAM_ERROR = 'llm:stream:error',
  
  // 模型事件
  MODELS_FETCHED = 'llm:models:fetched',
  
  // 连接事件
  CONNECTION_TESTED = 'llm:connection:tested',
  
  // 思考事件
  THINKING_STARTED = 'llm:thinking:started',
  THINKING_COMPLETED = 'llm:thinking:completed'
}

/**
 * LLM服务接口
 * @interface ILLMService
 * @description 定义LLM服务的标准接口
 */
export interface ILLMService {
  /**
   * 发送消息并获取响应
   * @param {Message[]} messages - 消息列表
   * @param {string} provider - 提供商名称
   * @returns {Promise<string>} 模型响应
   */
  sendMessage(messages: Message[], provider: string): Promise<string>;
  
  /**
   * 发送流式消息
   * @param {Message[]} messages - 消息列表
   * @param {string} provider - 提供商名称
   * @param {StreamHandlers} callbacks - 流式处理回调
   * @returns {Promise<void>}
   */
  sendMessageStream(messages: Message[], provider: string, callbacks: StreamHandlers): Promise<void>;
  
  /**
   * 测试与提供商的连接
   * @param {string} provider - 提供商名称
   * @returns {Promise<void>}
   */
  testConnection(provider: string): Promise<void>;
  
  /**
   * 获取模型列表
   * @param {string} provider - 提供商名称
   * @param {object} [customConfig] - 自定义配置
   * @returns {Promise<ModelOption[]>} 模型选项列表
   */
  fetchModelList(provider: string, customConfig?: Record<string, any>): Promise<ModelOption[]>;
  
  /**
   * 发送消息并获取包含思考过程的响应
   * @param {Message[]} messages - 消息列表
   * @param {string} provider - 提供商名称
   * @returns {Promise<ThinkingResponse>} 思考响应
   */
  sendMessageWithThinking(messages: Message[], provider: string): Promise<ThinkingResponse>;
  
  /**
   * 注册事件处理器
   * @param {string} eventName - 事件名称
   * @param {Function} handler - 事件处理器
   * @returns {Function} 取消注册的函数
   */
  on<T = any>(eventName: string, handler: (data: T) => void): () => void;
}