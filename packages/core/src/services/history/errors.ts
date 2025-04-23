/**
 * @file errors.ts
 * @description 历史记录管理相关的错误类定义
 * @module @prompt-assistant/core/services/history
 * @author Prompt Assistant Team
 * @license MIT
 */

/**
 * 历史记录基础错误
 * @class HistoryError
 * @extends {Error}
 * @description 历史记录模块的基础错误类，其他所有错误类型都继承自此类
 */
export class HistoryError extends Error {
  /**
   * 创建历史记录基础错误实例
   * @constructor
   * @param {string} message - 错误信息
   */
  constructor(message: string) {
    super(message);
    this.name = 'HistoryError';
  }
}

/**
 * 记录不存在错误
 * @class RecordNotFoundError
 * @extends {HistoryError}
 * @description 当尝试访问不存在的记录或记录链时抛出此错误
 */
export class RecordNotFoundError extends HistoryError {
  /**
   * 创建记录不存在错误实例
   * @constructor
   * @param {string} message - 错误信息
   * @param {string} recordId - 相关的记录ID或链ID
   */
  constructor(
    message: string,
    public recordId: string
  ) {
    super(message);
    this.name = 'RecordNotFoundError';
  }
}

/**
 * 存储错误
 * @class StorageError
 * @extends {HistoryError}
 * @description 当存储操作（读取、写入、删除等）失败时抛出此错误
 */
export class StorageError extends HistoryError {
  /**
   * 创建存储错误实例
   * @constructor
   * @param {string} message - 错误信息
   * @param {('read'|'write'|'delete'|'init'|'storage')} operation - 失败的操作类型
   */
  constructor(
    message: string,
    public operation: 'read' | 'write' | 'delete' | 'init' | 'storage'
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * 记录验证错误
 * @class RecordValidationError
 * @extends {HistoryError}
 * @description 当记录数据格式验证失败时抛出此错误，包含具体的验证错误信息
 */
export class RecordValidationError extends HistoryError {
  /**
   * 创建记录验证错误实例
   * @constructor
   * @param {string} message - 错误信息
   * @param {string[]} errors - 详细的验证错误信息列表
   */
  constructor(
    message: string,
    public errors: string[]
  ) {
    super(message);
    this.name = 'RecordValidationError';
  }
} 