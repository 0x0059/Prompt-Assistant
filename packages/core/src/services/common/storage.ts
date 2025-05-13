/**
 * @file storage.ts
 * @description 存储抽象层接口和本地存储实现
 * @module @prompt-assistant/core/services/common
 */

import { createStorageError } from './errors';

/**
 * 存储提供者接口
 * @interface IStorageProvider
 * @description 定义统一的存储访问接口
 */
export interface IStorageProvider {
  /**
   * 获取存储项
   * @param {string} key - 存储键
   * @returns {Promise<string|null>} 存储值或null
   */
  getItem(key: string): Promise<string | null>;
  
  /**
   * 设置存储项
   * @param {string} key - 存储键
   * @param {string} value - 存储值
   * @returns {Promise<void>}
   */
  setItem(key: string, value: string): Promise<void>;
  
  /**
   * 移除存储项
   * @param {string} key - 存储键
   * @returns {Promise<void>}
   */
  removeItem(key: string): Promise<void>;
  
  /**
   * 清空存储
   * @returns {Promise<void>}
   */
  clear(): Promise<void>;
  
  /**
   * 获取所有存储键
   * @returns {Promise<string[]>} 键列表
   */
  keys(): Promise<string[]>;
}

/**
 * 本地存储实现
 * @class LocalStorageProvider
 * @implements {IStorageProvider}
 * @description 基于浏览器localStorage的存储实现
 */
export class LocalStorageProvider implements IStorageProvider {
  /**
   * 创建本地存储实例
   * @constructor
   * @param {string} [prefix=''] - 键前缀
   * @throws {Error} 当存储不可用时抛出
   */
  constructor(private prefix: string = '') {
    // 验证存储是否可用
    try {
      const testKey = '_storage_test_';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
    } catch (error) {
      throw createStorageError('本地存储不可用', { 
        originalError: error,
        operation: 'initialize'
      });
    }
  }
  
  /**
   * 获取完整键名
   * @private
   * @param {string} key - 原始键
   * @returns {string} 添加前缀后的键
   */
  private getFullKey(key: string): string {
    return this.prefix ? `${this.prefix}:${key}` : key;
  }
  
  /**
   * 获取存储项
   * @param {string} key - 存储键
   * @returns {Promise<string|null>} 存储值或null
   */
  async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(this.getFullKey(key));
    } catch (error) {
      throw createStorageError('获取存储项失败', { 
        key, 
        originalError: error,
        operation: 'get'
      });
    }
  }
  
  /**
   * 设置存储项
   * @param {string} key - 存储键
   * @param {string} value - 存储值
   * @returns {Promise<void>}
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(this.getFullKey(key), value);
    } catch (error) {
      throw createStorageError('设置存储项失败', { 
        key, 
        originalError: error,
        operation: 'set'
      });
    }
  }
  
  /**
   * 移除存储项
   * @param {string} key - 存储键
   * @returns {Promise<void>}
   */
  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(this.getFullKey(key));
    } catch (error) {
      throw createStorageError('移除存储项失败', { 
        key, 
        originalError: error,
        operation: 'remove'
      });
    }
  }
  
  /**
   * 清空存储
   * @returns {Promise<void>}
   */
  async clear(): Promise<void> {
    try {
      if (this.prefix) {
        // 只清除特定前缀的项
        const keysToRemove = Object.keys(localStorage)
          .filter(key => key.startsWith(this.prefix));
        
        for (const key of keysToRemove) {
          localStorage.removeItem(key);
        }
      } else {
        // 清除所有存储
        localStorage.clear();
      }
    } catch (error) {
      throw createStorageError('清空存储失败', { 
        originalError: error,
        operation: 'clear'
      });
    }
  }
  
  /**
   * 获取所有存储键
   * @returns {Promise<string[]>} 键列表
   */
  async keys(): Promise<string[]> {
    try {
      const allKeys = Object.keys(localStorage);
      if (this.prefix) {
        const prefixWithSeparator = `${this.prefix}:`;
        return allKeys
          .filter(key => key.startsWith(prefixWithSeparator))
          .map(key => key.substring(prefixWithSeparator.length));
      }
      return allKeys;
    } catch (error) {
      throw createStorageError('获取存储键列表失败', { 
        originalError: error,
        operation: 'keys'
      });
    }
  }
}

/**
 * 内存存储实现
 * @class MemoryStorageProvider
 * @implements {IStorageProvider}
 * @description 基于内存的存储实现，主要用于测试
 */
export class MemoryStorageProvider implements IStorageProvider {
  private store: Map<string, string> = new Map();
  
  /**
   * 获取存储项
   * @param {string} key - 存储键
   * @returns {Promise<string|null>} 存储值或null
   */
  async getItem(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }
  
  /**
   * 设置存储项
   * @param {string} key - 存储键
   * @param {string} value - 存储值
   * @returns {Promise<void>}
   */
  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }
  
  /**
   * 移除存储项
   * @param {string} key - 存储键
   * @returns {Promise<void>}
   */
  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }
  
  /**
   * 清空存储
   * @returns {Promise<void>}
   */
  async clear(): Promise<void> {
    this.store.clear();
  }
  
  /**
   * 获取所有存储键
   * @returns {Promise<string[]>} 键列表
   */
  async keys(): Promise<string[]> {
    return Array.from(this.store.keys());
  }
} 