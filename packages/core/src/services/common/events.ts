/**
 * @file events.ts
 * @description 事件发布-订阅系统
 * @module @prompt-assistant/core/services/common
 */

/**
 * 事件处理器函数类型
 * @type {Function}
 */
export type EventHandler<T = any> = (data: T) => void;

/**
 * 事件选项
 * @interface EventOptions
 */
export interface EventOptions {
  /**
   * 是否只执行一次
   * @type {boolean}
   */
  once?: boolean;
}

/**
 * 事件处理器信息
 * @interface HandlerInfo
 */
interface HandlerInfo<T = any> {
  /**
   * 处理器函数
   * @type {EventHandler<T>}
   */
  handler: EventHandler<T>;
  
  /**
   * 是否只执行一次
   * @type {boolean}
   */
  once: boolean;
}

/**
 * 事件总线
 * @class EventBus
 * @description 提供事件发布-订阅功能的类
 */
export class EventBus {
  /**
   * 事件处理器映射
   * @private
   * @type {Map<string, HandlerInfo[]>}
   */
  private handlers: Map<string, HandlerInfo[]> = new Map();
  
  /**
   * 注册事件处理器
   * @param {string} eventName - 事件名称
   * @param {EventHandler} handler - 事件处理器
   * @param {EventOptions} [options] - 事件选项
   * @returns {() => void} 取消注册的函数
   */
  on<T = any>(
    eventName: string, 
    handler: EventHandler<T>, 
    options: EventOptions = {}
  ): () => void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }
    
    const handlerInfo: HandlerInfo<T> = {
      handler,
      once: options.once || false
    };
    
    this.handlers.get(eventName)!.push(handlerInfo);
    
    // 返回取消注册的函数
    return () => this.off(eventName, handler);
  }
  
  /**
   * 注册只执行一次的事件处理器
   * @param {string} eventName - 事件名称
   * @param {EventHandler} handler - 事件处理器
   * @returns {() => void} 取消注册的函数
   */
  once<T = any>(eventName: string, handler: EventHandler<T>): () => void {
    return this.on(eventName, handler, { once: true });
  }
  
  /**
   * 取消注册事件处理器
   * @param {string} eventName - 事件名称
   * @param {EventHandler} [handler] - 事件处理器，如果不提供则取消该事件的所有处理器
   * @returns {boolean} 是否成功取消
   */
  off(eventName: string, handler?: EventHandler): boolean {
    if (!this.handlers.has(eventName)) {
      return false;
    }
    
    if (!handler) {
      // 移除该事件的所有处理器
      this.handlers.delete(eventName);
      return true;
    }
    
    const handlers = this.handlers.get(eventName)!;
    const initialLength = handlers.length;
    
    // 过滤掉要移除的处理器
    const filteredHandlers = handlers.filter(info => info.handler !== handler);
    
    if (filteredHandlers.length !== initialLength) {
      this.handlers.set(eventName, filteredHandlers);
      return true;
    }
    
    return false;
  }
  
  /**
   * 发布事件
   * @param {string} eventName - 事件名称
   * @param {any} data - 事件数据
   * @returns {boolean} 是否有处理器被触发
   */
  emit<T = any>(eventName: string, data?: T): boolean {
    if (!this.handlers.has(eventName)) {
      return false;
    }
    
    const handlers = this.handlers.get(eventName)!;
    if (handlers.length === 0) {
      return false;
    }
    
    // 执行所有处理器
    for (const info of handlers) {
      info.handler(data);
    }
    
    // 移除只执行一次的处理器
    const remainingHandlers = handlers.filter(info => !info.once);
    
    if (remainingHandlers.length !== handlers.length) {
      this.handlers.set(eventName, remainingHandlers);
    }
    
    return true;
  }
  
  /**
   * 检查是否有事件处理器
   * @param {string} eventName - 事件名称
   * @returns {boolean} 是否有处理器
   */
  hasHandlers(eventName: string): boolean {
    return this.handlers.has(eventName) && this.handlers.get(eventName)!.length > 0;
  }
  
  /**
   * 获取事件处理器数量
   * @param {string} eventName - 事件名称
   * @returns {number} 处理器数量
   */
  getHandlerCount(eventName: string): number {
    if (!this.handlers.has(eventName)) {
      return 0;
    }
    return this.handlers.get(eventName)!.length;
  }
  
  /**
   * 清除所有事件处理器
   */
  clear(): void {
    this.handlers.clear();
  }
}

/**
 * 默认事件总线实例
 * @type {EventBus}
 */
export const globalEventBus = new EventBus(); 