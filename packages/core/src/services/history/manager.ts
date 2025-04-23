/**
 * @file manager.ts
 * @description 历史记录管理器实现，提供提示词历史记录的存储、查询和链式管理功能
 * @module @prompt-assistant/core/services/history
 * @author Moyu.la
 */

import { IHistoryManager, PromptRecord, PromptRecordChain } from './types';
import { HistoryError, RecordNotFoundError, StorageError, RecordValidationError } from './errors';
import { v4 as uuidv4 } from 'uuid';
import { modelManager } from '../model/manager';

/**
 * 历史记录管理器实现类
 * @class HistoryManager
 * @description 管理提示词历史记录的核心类，提供记录的增删改查、迭代链管理等功能
 * @implements {IHistoryManager}
 * 
 * @example
 * const manager = new HistoryManager();
 * 
 * // 添加记录
 * manager.addRecord({
 *   id: uuidv4(),
 *   prompt: '原始提示词',
 *   optimizedPrompt: '优化后的提示词',
 *   modelKey: 'gpt-4',
 *   timestamp: Date.now()
 * });
 * 
 * // 获取历史记录
 * const records = manager.getRecords();
 */
export class HistoryManager implements IHistoryManager {
  /**
   * 存储键名
   * @private
   * @type {string}
   * @description 用于在localStorage中存储历史记录的键名
   */
  private readonly storageKey = 'prompt_history';
  
  /**
   * 最大记录数量
   * @private
   * @type {number}
   * @description 限制历史记录的最大条数，超出将删除最旧的记录
   */
  private readonly maxRecords = 50; // 最多保存50条记录

  /**
   * 创建历史记录管理器实例
   * @constructor
   * @throws {StorageError} 当存储不可用时抛出
   */
  constructor() {
    try {
      // 验证存储是否可用
      const testKey = '_test_storage_';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
    } catch (error) {
      console.error('存储不可用:', error);
      throw new StorageError('存储不可用', 'storage');
    }
  }

  /**
   * 获取模型名称的辅助函数
   * @private
   * @param {string} modelKey - 模型键值
   * @returns {string | undefined} 模型名称或undefined
   */
  private getModelNameByKey(modelKey: string): string | undefined {
    try {
      if (!modelKey) {
        return undefined;
      }
      const modelConfig = modelManager.getModel(modelKey);
      return modelConfig?.defaultModel;
    } catch (error) {
      console.warn(`获取模型名称失败: ${modelKey}`, error);
      return undefined;
    }
  }

  /**
   * 添加历史记录
   * @param {PromptRecord} record - 要添加的记录
   * @throws {HistoryError} 当记录验证失败时抛出
   * @throws {StorageError} 当存储操作失败时抛出
   */
  addRecord(record: PromptRecord): void {
    try {
      this.validateRecord(record);

      // 如果记录中有modelKey但没有modelName，尝试获取模型名称
      if (record.modelKey && !record.modelName) {
        record.modelName = this.getModelNameByKey(record.modelKey);
      }

      const history = this.getRecords();
      history.unshift(record);
      this.saveToStorage(history.slice(0, this.maxRecords));
    } catch (error) {
      if (error instanceof HistoryError) {
        throw error;
      }
      throw new StorageError('添加记录失败', 'write');
    }
  }

  /**
   * 获取所有历史记录
   * @returns {PromptRecord[]} 历史记录列表
   * @throws {StorageError} 当读取存储失败时抛出
   */
  getRecords(): PromptRecord[] {
    try {
      const historyStr = localStorage.getItem(this.storageKey);
      return historyStr ? JSON.parse(historyStr) : [];
    } catch (error) {
      console.error('获取历史记录失败:', error);
      throw new StorageError('获取历史记录失败', 'read');
    }
  }

  /**
   * 获取指定ID的历史记录
   * @param {string} id - 记录ID
   * @returns {PromptRecord} 历史记录
   * @throws {RecordNotFoundError} 当记录不存在时抛出
   */
  getRecord(id: string): PromptRecord {
    const history = this.getRecords();
    const record = history.find(r => r.id === id);
    if (!record) {
      throw new RecordNotFoundError('记录不存在', id);
    }
    return record;
  }

  /**
   * 删除指定ID的历史记录
   * @param {string} id - 记录ID
   * @throws {RecordNotFoundError} 当记录不存在时抛出
   * @throws {StorageError} 当存储操作失败时抛出
   */
  deleteRecord(id: string): void {
    const records = this.getRecords();
    const index = records.findIndex(record => record.id === id);
    if (index === -1) {
      throw new RecordNotFoundError('记录不存在', id);
    }
    records.splice(index, 1);
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(records));
    } catch (error) {
      throw new StorageError('删除记录失败', 'delete');
    }
  }

  /**
   * 获取迭代链
   * @param {string} recordId - 记录ID
   * @returns {PromptRecord[]} 迭代链记录列表
   * @throws {RecordNotFoundError} 当记录不存在时抛出
   */
  getIterationChain(recordId: string): PromptRecord[] {
    const history = this.getRecords();
    const chain: PromptRecord[] = [];
    let currentId = recordId;

    while (currentId) {
      const record = history.find(r => r.id === currentId);
      if (!record) break;
      
      chain.unshift(record);
      currentId = record.previousId ?? '';
    }

    return chain;
  }

  /**
   * 清空所有历史记录
   * @throws {StorageError} 当存储操作失败时抛出
   */
  clearHistory(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('清除历史记录失败:', error);
      throw new StorageError('清除历史记录失败', 'delete');
    }
  }

  /**
   * 验证记录格式
   * @private
   * @param {PromptRecord} record - 要验证的记录
   * @throws {RecordValidationError} 当记录格式无效时抛出
   */
  private validateRecord(record: PromptRecord): void {
    const errors: string[] = [];

    if (!record.id) errors.push('缺少记录ID');
    if (!record.originalPrompt) errors.push('缺少原始提示词');
    if (!record.optimizedPrompt) errors.push('缺少优化后的提示词');
    if (!record.type) errors.push('缺少记录类型');
    if (!record.chainId) errors.push('缺少记录链ID');
    if (!record.version) errors.push('缺少版本号');
    if (!record.timestamp) errors.push('缺少时间戳');
    if (!record.modelKey) errors.push('缺少模型标识');
    if (!record.templateId) errors.push('缺少提示词标识');

    if (errors.length > 0) {
      throw new RecordValidationError('记录验证失败', errors);
    }
  }

  /**
   * 将记录保存到存储
   * @private
   * @param {PromptRecord[]} records - 要保存的记录列表
   * @throws {StorageError} 当存储操作失败时抛出
   * @description 序列化并保存记录列表到localStorage
   */
  private saveToStorage(records: PromptRecord[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(records));
    } catch (error) {
      console.error('保存记录失败:', error);
      throw new StorageError('保存记录失败', 'write');
    }
  }

  /**
   * 创建新的记录链
   * @param {Omit<PromptRecord, 'chainId' | 'version' | 'previousId'>} record - 记录数据
   * @returns {PromptRecordChain} 新创建的记录链
   * @throws {StorageError} 当存储操作失败时抛出
   * @description 使用给定的记录创建一个新的记录链，并将其作为链的第一个记录
   */
  createNewChain(record: Omit<PromptRecord, 'chainId' | 'version' | 'previousId'>): PromptRecordChain {
    const chainId = `chain-${uuidv4()}`;
    const completeRecord: PromptRecord = {
      ...record,
      chainId,
      version: 1,
      timestamp: record.timestamp || Date.now()
    };

    try {
      this.addRecord(completeRecord);

      return {
        chainId,
        rootRecord: completeRecord,
        currentRecord: completeRecord,
        versions: [completeRecord]
      };
    } catch (error) {
      console.error('创建记录链失败:', error);
      throw new StorageError('创建记录链失败', 'write');
    }
  }

  /**
   * 添加迭代记录
   * @param {Object} params - 迭代参数
   * @param {string} params.chainId - 链ID
   * @param {string} params.originalPrompt - 原始提示词
   * @param {string} params.optimizedPrompt - 优化后的提示词
   * @param {string} params.iterationNote - 迭代说明
   * @param {string} params.modelKey - 使用的模型标识
   * @param {string} params.templateId - 使用的模板ID
   * @returns {PromptRecordChain} 更新后的记录链
   * @throws {RecordNotFoundError} 当链不存在时抛出
   * @throws {StorageError} 当存储操作失败时抛出
   * @description 向现有链中添加一个新的迭代记录
   */
  addIteration(params: {
    chainId: string;
    originalPrompt: string;
    optimizedPrompt: string;
    iterationNote?: string;
    modelKey: string;
    templateId: string;
  }): PromptRecordChain {
    const { chainId, originalPrompt, optimizedPrompt, iterationNote, modelKey, templateId } = params;
    
    // 获取链的当前状态
    const chain = this.getChain(chainId);
    const previousId = chain.currentRecord.id;
    const newVersion = chain.versions.length + 1;
    
    // 创建新记录
    const newRecord: PromptRecord = {
      id: `${chainId}-v${newVersion}`,
      originalPrompt,
      optimizedPrompt,
      type: 'iterate',
      chainId,
      version: newVersion,
      previousId,
      timestamp: Date.now(),
      modelKey,
      templateId,
      iterationNote
    };
    
    // 添加并保存记录
    this.addRecord(newRecord);
    
    // 更新链
    const updatedChain: PromptRecordChain = {
      ...chain,
      currentRecord: newRecord,
      versions: [...chain.versions, newRecord]
    };
    
    return updatedChain;
  }

  /**
   * 获取指定ID的记录链
   * @param {string} chainId - 链ID
   * @returns {PromptRecordChain} 记录链
   * @throws {RecordNotFoundError} 当链不存在时抛出
   * @description 根据链ID获取完整的记录链数据
   */
  getChain(chainId: string): PromptRecordChain {
    const records = this.getRecords().filter(r => r.chainId === chainId);
    
    if (records.length === 0) {
      throw new RecordNotFoundError('记录链不存在', chainId);
    }
    
    // 按版本号排序
    const sortedRecords = records.sort((a, b) => a.version - b.version);
    const rootRecord = sortedRecords[0];
    const currentRecord = sortedRecords[sortedRecords.length - 1];
    
    return {
      chainId,
      rootRecord,
      currentRecord,
      versions: sortedRecords
    };
  }

  /**
   * 获取所有记录链
   * @returns {PromptRecordChain[]} 所有记录链列表
   * @description 获取存储中的所有记录链，按时间戳降序排序
   */
  getAllChains(): PromptRecordChain[] {
    const records = this.getRecords();
    
    // 提取所有链ID
    const chainIds = new Set<string>();
    records.forEach(record => chainIds.add(record.chainId));
    
    // 为每个链ID创建链对象
    const chains: PromptRecordChain[] = [];
    chainIds.forEach(chainId => {
      try {
        const chain = this.getChain(chainId);
        chains.push(chain);
      } catch (error) {
        console.error(`获取链 ${chainId} 失败:`, error);
        // 忽略无法获取的链
      }
    });
    
    // 按根记录时间戳降序排序
    return chains.sort((a, b) => b.rootRecord.timestamp - a.rootRecord.timestamp);
  }
}

/**
 * 历史记录管理器单例
 * @type {HistoryManager}
 * @description 提供全局共享的历史记录管理器实例
 */
export const historyManager = new HistoryManager(); 