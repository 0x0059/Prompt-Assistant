/**
 * @file logger.ts
 * @description 日志系统接口和基本实现
 * @module @prompt-assistant/core/services/common
 */

/**
 * 日志级别
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * 日志接口
 * @interface ILogger
 * @description 定义日志系统的标准接口
 */
export interface ILogger {
  /**
   * 记录日志
   * @param {LogLevel} level - 日志级别
   * @param {string} message - 日志消息
   * @param {Record<string, any>} [data] - 附加数据
   */
  log(level: LogLevel, message: string, data?: Record<string, any>): void;
  
  /**
   * 记录调试级别日志
   * @param {string} message - 日志消息
   * @param {Record<string, any>} [data] - 附加数据
   */
  debug(message: string, data?: Record<string, any>): void;
  
  /**
   * 记录信息级别日志
   * @param {string} message - 日志消息
   * @param {Record<string, any>} [data] - 附加数据
   */
  info(message: string, data?: Record<string, any>): void;
  
  /**
   * 记录警告级别日志
   * @param {string} message - 日志消息
   * @param {Record<string, any>} [data] - 附加数据
   */
  warn(message: string, data?: Record<string, any>): void;
  
  /**
   * 记录错误级别日志
   * @param {string} message - 日志消息
   * @param {Record<string, any>} [data] - 附加数据
   */
  error(message: string, data?: Record<string, any>): void;
}

/**
 * 控制台日志实现
 * @class ConsoleLogger
 * @description 使用控制台实现的日志系统
 * @implements {ILogger}
 */
export class ConsoleLogger implements ILogger {
  /**
   * 创建日志实例
   * @param {object} options - 日志选项
   * @param {LogLevel} [options.minLevel='debug'] - 最小记录级别
   * @param {boolean} [options.includeTimestamp=true] - 是否包含时间戳
   */
  constructor(private options: {
    minLevel?: LogLevel;
    includeTimestamp?: boolean;
  } = {}) {
    this.options = {
      minLevel: 'debug',
      includeTimestamp: true,
      ...options
    };
  }

  /**
   * 记录日志
   * @param {LogLevel} level - 日志级别
   * @param {string} message - 日志消息
   * @param {Record<string, any>} [data] - 附加数据
   */
  log(level: LogLevel, message: string, data?: Record<string, any>): void {
    const levelOrder: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    if (levelOrder[level] < levelOrder[this.options.minLevel || 'debug']) {
      return;
    }
    
    const timestamp = this.options.includeTimestamp 
      ? `[${new Date().toISOString()}] `
      : '';
    
    const logMessage = `${timestamp}[${level.toUpperCase()}] ${message}`;
    
    switch (level) {
      case 'debug':
        console.debug(logMessage, data || '');
        break;
      case 'info':
        console.info(logMessage, data || '');
        break;
      case 'warn':
        console.warn(logMessage, data || '');
        break;
      case 'error':
        console.error(logMessage, data || '');
        break;
    }
  }
  
  /**
   * 记录调试级别日志
   * @param {string} message - 日志消息
   * @param {Record<string, any>} [data] - 附加数据
   */
  debug(message: string, data?: Record<string, any>): void {
    this.log('debug', message, data);
  }
  
  /**
   * 记录信息级别日志
   * @param {string} message - 日志消息
   * @param {Record<string, any>} [data] - 附加数据
   */
  info(message: string, data?: Record<string, any>): void {
    this.log('info', message, data);
  }
  
  /**
   * 记录警告级别日志
   * @param {string} message - 日志消息
   * @param {Record<string, any>} [data] - 附加数据
   */
  warn(message: string, data?: Record<string, any>): void {
    this.log('warn', message, data);
  }
  
  /**
   * 记录错误级别日志
   * @param {string} message - 日志消息
   * @param {Record<string, any>} [data] - 附加数据
   */
  error(message: string, data?: Record<string, any>): void {
    this.log('error', message, data);
  }
} 