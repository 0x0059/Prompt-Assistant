/**
 * @file errors.ts
 * @description LLM服务相关错误定义
 * @module @prompt-assistant/core/services/llm
 */

import { ServiceError, ErrorContext } from '../common/errors';

/**
 * 错误消息常量
 */
export const ERROR_MESSAGES = {
  // 配置相关错误
  API_KEY_REQUIRED: 'API密钥不能为空',
  BASE_URL_REQUIRED: 'API URL不能为空',
  MODEL_NOT_FOUND: '模型不存在',
  MODEL_KEY_REQUIRED: '模型标识不能为空',
  MODEL_DISABLED: '模型已禁用',
  
  // 请求相关错误
  REQUEST_FAILED: '请求失败',
  RESPONSE_ERROR: '响应错误',
  TIMEOUT: '请求超时',
  
  // 消息相关错误
  EMPTY_MESSAGES: '消息列表不能为空',
  INVALID_MESSAGE_FORMAT: '消息格式无效',
  
  // 优化相关错误
  OPTIMIZATION_FAILED: '优化失败',
  EMPTY_INPUT: '输入内容不能为空',
  
  // 测试相关错误
  TEST_FAILED: '测试失败',
  
  // 迭代相关错误
  ITERATION_FAILED: '迭代失败'
};

/**
 * LLM服务错误基础上下文
 */
export interface LLMErrorContext {
  /**
   * 模型提供商
   */
  provider?: string;
  
  /**
   * 模型名称
   */
  model?: string;
  
  /**
   * 请求ID
   */
  requestId?: string;
}

/**
 * LLM服务错误基类
 * @class LLMServiceError
 * @extends {ServiceError<LLMErrorContext>}
 */
export class LLMServiceError extends ServiceError<LLMErrorContext> {
  constructor(message: string, code: string = 'LLM_SERVICE_ERROR', context?: ErrorContext<LLMErrorContext>) {
    super(message, code, context);
  }
}

/**
 * API错误上下文
 */
export interface APIErrorContext extends LLMErrorContext {
  /**
   * HTTP状态码
   */
  statusCode?: number;
  
  /**
   * API响应体
   */
  response?: any;
  
  /**
   * 请求URL
   */
  url?: string;
}

/**
 * API错误
 * @class APIError
 * @extends {LLMServiceError}
 * @description 表示调用LLM API时发生的错误
 */
export class APIError extends LLMServiceError {
  constructor(message: string, context?: ErrorContext<APIErrorContext>) {
    super(message, 'LLM_API_ERROR', context);
  }
}

/**
 * 请求配置错误上下文
 */
export interface RequestConfigErrorContext extends LLMErrorContext {
  /**
   * 缺失的配置项
   */
  missingConfig?: string[];
  
  /**
   * 无效的配置项
   */
  invalidConfig?: Record<string, any>;
}

/**
 * 请求配置错误
 * @class RequestConfigError
 * @extends {LLMServiceError}
 * @description 表示请求配置无效的错误
 */
export class RequestConfigError extends LLMServiceError {
  constructor(message: string, context?: ErrorContext<RequestConfigErrorContext>) {
    super(message, 'LLM_CONFIG_ERROR', context);
  }
}

/**
 * 模型配置错误上下文
 */
export interface ModelConfigErrorContext extends LLMErrorContext {
  /**
   * 配置键
   */
  configKey?: string;
  
  /**
   * 期望的值类型
   */
  expectedType?: string;
  
  /**
   * 模型能力
   */
  capability?: string;
}

/**
 * 模型配置错误
 * @class ModelConfigError
 * @extends {LLMServiceError}
 * @description 表示模型配置无效的错误
 */
export class ModelConfigError extends LLMServiceError {
  constructor(message: string, context?: ErrorContext<ModelConfigErrorContext>) {
    super(message, 'MODEL_CONFIG_ERROR', context);
  }
}

/**
 * 创建LLM服务错误的工厂函数
 */
export const createLLMError = (message: string, context?: ErrorContext<LLMErrorContext>) => 
  new LLMServiceError(message, 'LLM_SERVICE_ERROR', context);

export const createAPIError = (message: string, context?: ErrorContext<APIErrorContext>) => 
  new APIError(message, context);

export const createConfigError = (message: string, context?: ErrorContext<RequestConfigErrorContext>) => 
  new RequestConfigError(message, context);

/**
 * 创建模型配置错误的工厂函数
 */
export const createModelConfigError = (message: string, context?: ErrorContext<ModelConfigErrorContext>) => 
  new ModelConfigError(message, context); 