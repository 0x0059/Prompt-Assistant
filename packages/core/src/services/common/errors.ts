/**
 * @file errors.ts
 * @description 统一错误管理系统
 * @module @prompt-assistant/core/services/common
 */

/**
 * 错误上下文类型，允许扩展特定错误类型的上下文
 */
export type ErrorContext<T = Record<string, any>> = T & {
  /**
   * 原始错误对象（可选）
   */
  originalError?: Error | unknown;
};

/**
 * 基础服务错误类
 * @class ServiceError
 * @extends {Error}
 * @description 所有服务错误的基类
 * @template T - 错误上下文类型
 */
export class ServiceError<T extends Record<string, any> = Record<string, any>> extends Error {
  /**
   * 创建服务错误实例
   * @param {string} message - 错误消息
   * @param {string} code - 错误代码
   * @param {ErrorContext<T>} [context] - 错误上下文
   */
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: ErrorContext<T>
  ) {
    super(message);
    this.name = this.constructor.name;
    
    // 确保Error.captureStackTrace在当前环境可用
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  /**
   * 序列化错误对象
   * @returns {object} 序列化后的错误对象
   */
  toJSON(): object {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      stack: this.stack
    };
  }
}

/**
 * 验证错误上下文类型
 */
export interface ValidationErrorContext {
  /**
   * 验证失败的字段
   */
  field?: string;
  
  /**
   * 验证失败的值
   */
  value?: any;
  
  /**
   * 验证规则
   */
  rule?: string;
}

/**
 * 验证错误
 * @class ValidationError
 * @extends {ServiceError<ValidationErrorContext>}
 * @description 表示验证失败的错误
 */
export class ValidationError extends ServiceError<ValidationErrorContext> {
  constructor(message: string, context?: ErrorContext<ValidationErrorContext>) {
    super(message, 'VALIDATION_ERROR', context);
  }
}

/**
 * 配置错误上下文类型
 */
export interface ConfigurationErrorContext {
  /**
   * 配置键
   */
  key?: string;
  
  /**
   * 配置路径
   */
  path?: string;
}

/**
 * 配置错误
 * @class ConfigurationError
 * @extends {ServiceError<ConfigurationErrorContext>}
 * @description 表示配置无效或缺失的错误
 */
export class ConfigurationError extends ServiceError<ConfigurationErrorContext> {
  constructor(message: string, context?: ErrorContext<ConfigurationErrorContext>) {
    super(message, 'CONFIGURATION_ERROR', context);
  }
}

/**
 * 操作错误上下文类型
 */
export interface OperationErrorContext {
  /**
   * 操作名称
   */
  operation?: string;
  
  /**
   * 操作参数
   */
  params?: Record<string, any>;
  
  /**
   * 服务ID
   */
  serviceId?: string;
}

/**
 * 操作错误
 * @class OperationError
 * @extends {ServiceError<OperationErrorContext>}
 * @description 表示操作执行失败的错误
 */
export class OperationError extends ServiceError<OperationErrorContext> {
  constructor(message: string, context?: ErrorContext<OperationErrorContext>) {
    super(message, 'OPERATION_ERROR', context);
  }
}

/**
 * 存储错误上下文类型
 */
export interface StorageErrorContext {
  /**
   * 存储键
   */
  key?: string;
  
  /**
   * 存储操作类型
   */
  operation?: 'get' | 'set' | 'remove' | 'clear' | 'keys' | 'initialize';
}

/**
 * 存储错误
 * @class StorageError
 * @extends {ServiceError<StorageErrorContext>}
 * @description 表示存储操作失败的错误
 */
export class StorageError extends ServiceError<StorageErrorContext> {
  constructor(message: string, context?: ErrorContext<StorageErrorContext>) {
    super(message, 'STORAGE_ERROR', context);
  }
}

/**
 * 依赖错误上下文类型
 */
export interface DependencyErrorContext {
  /**
   * 服务名称
   */
  serviceName?: string;
  
  /**
   * 依赖类型
   */
  dependencyType?: string;
}

/**
 * 依赖错误
 * @class DependencyError
 * @extends {ServiceError<DependencyErrorContext>}
 * @description 表示依赖服务不可用或故障的错误
 */
export class DependencyError extends ServiceError<DependencyErrorContext> {
  constructor(message: string, context?: ErrorContext<DependencyErrorContext>) {
    super(message, 'DEPENDENCY_ERROR', context);
  }
}

/**
 * 预定义错误工厂
 */
export const createValidationError = (message: string, context?: ErrorContext<ValidationErrorContext>) => 
  new ValidationError(message, context);

export const createConfigError = (message: string, context?: ErrorContext<ConfigurationErrorContext>) => 
  new ConfigurationError(message, context);

export const createOperationError = (message: string, context?: ErrorContext<OperationErrorContext>) => 
  new OperationError(message, context);

export const createStorageError = (message: string, context?: ErrorContext<StorageErrorContext>) => 
  new StorageError(message, context);

export const createDependencyError = (message: string, context?: ErrorContext<DependencyErrorContext>) => 
  new DependencyError(message, context);