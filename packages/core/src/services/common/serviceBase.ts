/**
 * @file serviceBase.ts
 * @description 服务基类，提供所有服务共享的基础功能
 * @module @prompt-assistant/core/services/common
 */

import { ILogger, ConsoleLogger, LogLevel } from './logger';
import { ServiceError, createOperationError } from './errors';
import { EventBus, EventHandler, globalEventBus } from './events';

/**
 * 服务事件类型
 * @enum {string}
 */
export enum ServiceEventType {
  // 生命周期事件
  INITIALIZING = 'service:initializing',
  INITIALIZED = 'service:initialized',
  DISPOSING = 'service:disposing',
  DISPOSED = 'service:disposed',
  
  // 操作事件
  OPERATION_START = 'service:operation:start',
  OPERATION_SUCCESS = 'service:operation:success',
  OPERATION_ERROR = 'service:operation:error',
  
  // 状态事件
  STATE_CHANGED = 'service:state:changed'
}

/**
 * 服务基类
 * @class ServiceBase
 * @description 为所有服务提供通用功能的抽象基类
 */
export abstract class ServiceBase<TOptions = unknown> {
  /**
   * 选项配置
   * @protected
   * @type {Required<TOptions>}
   */
  protected readonly options: Required<TOptions>;
  
  /**
   * 日志记录器
   * @protected
   * @type {ILogger}
   */
  protected readonly logger: ILogger;
  
  /**
   * 服务标识符
   * @protected
   * @type {string}
   */
  protected readonly serviceId: string;
  
  /**
   * 事件总线
   * @protected
   * @type {EventBus}
   */
  protected readonly events: EventBus;
  
  /**
   * 是否已初始化
   * @protected
   * @type {boolean}
   */
  protected isInitialized: boolean = false;
  
  /**
   * 是否已销毁
   * @protected
   * @type {boolean}
   */
  protected isDisposed: boolean = false;
  
  /**
   * 创建服务实例
   * @constructor
   * @param {object} params - 构造参数
   * @param {TOptions} [params.options] - 服务选项
   * @param {ILogger} [params.logger] - 日志记录器
   * @param {string} [params.serviceId] - 服务标识符
   * @param {EventBus} [params.events] - 事件总线
   * @param {boolean} [params.autoInit=true] - 是否自动初始化
   */
  constructor(params: {
    options?: TOptions;
    logger?: ILogger;
    serviceId?: string;
    events?: EventBus;
    autoInit?: boolean;
  } = {}) {
    this.options = this.getDefaultOptions(params.options);
    this.logger = params.logger || new ConsoleLogger();
    this.serviceId = params.serviceId || this.constructor.name;
    this.events = params.events || globalEventBus;
    
    // 自动初始化
    if (params.autoInit !== false) {
      this.init().catch(error => {
        this.log('error', `初始化失败: ${error.message}`, {
          error: error instanceof Error ? error.stack : String(error)
        });
      });
    }
  }
  
  /**
   * 获取默认选项
   * @protected
   * @abstract
   * @param {TOptions} [options] - 用户提供的选项
   * @returns {Required<TOptions>} 合并默认值后的完整选项
   */
  protected abstract getDefaultOptions(options?: TOptions): Required<TOptions>;
  
  /**
   * 记录日志
   * @protected
   * @param {LogLevel} level - 日志级别
   * @param {string} message - 日志消息
   * @param {Record<string, any>} [data] - 附加数据
   */
  protected log(level: LogLevel, message: string, data?: Record<string, any>): void {
    this.logger.log(level, `[${this.serviceId}] ${message}`, data);
  }
  
  /**
   * 初始化服务
   * @async
   * @returns {Promise<void>}
   * @throws {ServiceError} 初始化失败时抛出
   */
  async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    try {
      this.log('info', '开始初始化服务');
      this.emit(ServiceEventType.INITIALIZING, { serviceId: this.serviceId });
      
      await this.initialize();
      
      this.isInitialized = true;
      this.log('info', '服务初始化完成');
      this.emit(ServiceEventType.INITIALIZED, { serviceId: this.serviceId });
    } catch (error) {
      this.log('error', '服务初始化失败', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      if (error instanceof ServiceError) {
        throw error;
      }
      
      throw createOperationError(
        `服务初始化失败: ${error instanceof Error ? error.message : String(error)}`,
        { 
          serviceId: this.serviceId,
          operation: 'initialize',
          originalError: error
        }
      );
    }
  }
  
  /**
   * 销毁服务
   * @async
   * @returns {Promise<void>}
   * @throws {ServiceError} 销毁失败时抛出
   */
  async dispose(): Promise<void> {
    if (this.isDisposed) {
      return;
    }
    
    try {
      this.log('info', '开始销毁服务');
      this.emit(ServiceEventType.DISPOSING, { serviceId: this.serviceId });
      
      await this.disposeInternal();
      
      this.isDisposed = true;
      this.log('info', '服务销毁完成');
      this.emit(ServiceEventType.DISPOSED, { serviceId: this.serviceId });
    } catch (error) {
      this.log('error', '服务销毁失败', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      if (error instanceof ServiceError) {
        throw error;
      }
      
      throw createOperationError(
        `服务销毁失败: ${error instanceof Error ? error.message : String(error)}`,
        { 
          serviceId: this.serviceId,
          operation: 'dispose',
          originalError: error
        }
      );
    }
  }
  
  /**
   * 注册事件处理器
   * @param {string} eventName - 事件名称
   * @param {EventHandler} handler - 事件处理器
   * @returns {() => void} 取消注册的函数
   */
  on<T = any>(eventName: string, handler: EventHandler<T>): () => void {
    return this.events.on(eventName, handler);
  }
  
  /**
   * 发布事件
   * @protected
   * @param {string} eventName - 事件名称
   * @param {any} data - 事件数据
   * @returns {boolean} 是否有处理器被触发
   */
  protected emit<T = any>(eventName: string, data?: T): boolean {
    return this.events.emit(eventName, data);
  }
  
  /**
   * 安全执行操作
   * @protected
   * @template T - 操作结果类型
   * @param {() => Promise<T>} operation - 要执行的操作
   * @param {object} options - 执行选项
   * @param {string} options.operationName - 操作名称
   * @param {Record<string, any>} [options.context] - 操作上下文
   * @param {(() => Promise<T>)} [options.fallback] - 失败时的回退操作
   * @returns {Promise<T>} 操作结果
   * @throws {ServiceError} 当操作失败且无回退时抛出
   */
  protected async safeExecute<T>(
    operation: () => Promise<T>,
    options: {
      operationName: string;
      context?: Record<string, any>;
      fallback?: () => Promise<T>;
    }
  ): Promise<T> {
    const { operationName, context, fallback } = options;
    const eventContext = {
      serviceId: this.serviceId,
      operationName,
      ...context
    };
    
    try {
      this.log('debug', `开始执行操作: ${operationName}`, context);
      this.emit(ServiceEventType.OPERATION_START, eventContext);
      
      const result = await operation();
      
      this.log('debug', `操作成功: ${operationName}`);
      this.emit(ServiceEventType.OPERATION_SUCCESS, {
        ...eventContext,
        result
      });
      
      return result;
    } catch (error) {
      this.log('error', `操作失败: ${operationName}`, {
        ...context,
        error: error instanceof Error ? error.message : String(error)
      });
      
      this.emit(ServiceEventType.OPERATION_ERROR, {
        ...eventContext,
        error
      });
      
      if (fallback) {
        this.log('info', `尝试回退操作: ${operationName}`);
        return fallback();
      }
      
      if (error instanceof ServiceError) {
        throw error;
      }
      
      throw createOperationError(
        `操作 ${operationName} 失败: ${error instanceof Error ? error.message : String(error)}`,
        {
          serviceId: this.serviceId,
          operation: operationName,
          params: context,
          originalError: error
        }
      );
    }
  }
  
  /**
   * 初始化实现
   * @protected
   * @virtual
   * @returns {Promise<void>}
   */
  protected async initialize(): Promise<void> {
    // 默认实现为空，子类可覆盖
  }
  
  /**
   * 销毁实现
   * @protected
   * @virtual
   * @returns {Promise<void>}
   */
  protected async disposeInternal(): Promise<void> {
    // 默认实现为空，子类可覆盖
  }
} 