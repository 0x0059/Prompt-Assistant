/**
 * @file types.ts
 * @description 历史记录管理相关的类型定义，包括提示词记录、记录链和管理器接口
 * @module @prompt-assistant/core/services/history
 * @author Prompt Assistant Team
 */

/**
 * 提示词记录类型
 * @typedef {string} PromptRecordType
 * @description 定义提示词记录的类型，包括优化和迭代两种操作
 */
export type PromptRecordType = 'optimize' | 'iterate';

/**
 * 提示词记录接口
 * @interface PromptRecord
 * @description 定义单个提示词记录的数据结构，包含原始提示词、优化结果和元数据
 */
export interface PromptRecord {
  /** 
   * 记录ID
   * @type {string}
   * @description 记录的唯一标识符，通常使用时间戳或UUID
   */
  id: string;
  
  /** 
   * 原始提示词
   * @type {string}
   * @description 用户输入的原始提示词文本
   */
  originalPrompt: string;
  
  /** 
   * 优化/迭代后的提示词
   * @type {string}
   * @description 经过AI优化或迭代后的提示词文本
   */
  optimizedPrompt: string;
  
  /** 
   * 记录类型
   * @type {PromptRecordType}
   * @description 记录的操作类型，可以是'optimize'或'iterate'
   */
  type: PromptRecordType;
  
  /** 
   * 所属的提示词链ID
   * @type {string}
   * @description 记录所属的链ID，用于将多个迭代版本组织在一起
   */
  chainId: string;
  
  /** 
   * 在链中的版本号
   * @type {number}
   * @description 记录在所属链中的版本号，从1开始递增
   */
  version: number;
  
  /** 
   * 前一个版本ID
   * @type {string}
   * @optional
   * @description 链中前一个版本的记录ID，首个版本无此值
   */
  previousId?: string;
  
  /** 
   * 时间戳
   * @type {number}
   * @description 记录创建的时间戳，通常使用Date.now()
   */
  timestamp: number;
  
  /** 
   * 使用的模型key
   * @type {string}
   * @description 创建此记录时使用的AI模型标识符
   */
  modelKey: string;
  
  /** 
   * 使用的模型显示名称 
   * @type {string}
   * @optional
   * @description 通过modelKey从modelManager中获取，用于UI展示
   * 不存储时使用modelKey作为后备显示
   */
  modelName?: string;
  
  /** 
   * 使用的提示词模板ID
   * @type {string}
   * @description 创建此记录时使用的提示词模板ID
   */
  templateId: string;
  
  /** 
   * 迭代时的修改说明
   * @type {string}
   * @optional
   * @description 迭代操作时用户提供的修改需求或说明
   */
  iterationNote?: string;
  
  /** 
   * 元数据
   * @type {Record<string, any>}
   * @optional
   * @description 额外的元数据信息，用于存储与记录相关的其他数据
   */
  metadata?: Record<string, any>;
}

/**
 * 历史记录链类型
 * @interface PromptRecordChain
 * @description 定义提示词记录链的数据结构，组织多个相关联的提示词记录
 */
export interface PromptRecordChain {
  /**
   * 链ID
   * @type {string}
   * @description 记录链的唯一标识符
   */
  chainId: string;
  
  /**
   * 根记录
   * @type {PromptRecord}
   * @description 链中的第一个记录，通常是初始优化记录
   */
  rootRecord: PromptRecord;
  
  /**
   * 当前记录
   * @type {PromptRecord}
   * @description 链中的当前活跃记录，通常是最新版本
   */
  currentRecord: PromptRecord;
  
  /**
   * 版本列表
   * @type {PromptRecord[]}
   * @description 链中所有版本的记录列表，按版本号排序
   */
  versions: PromptRecord[];
}

/**
 * 历史记录管理器接口
 * @interface IHistoryManager
 * @description 定义历史记录管理器的公共方法，用于管理和操作提示词记录
 */
export interface IHistoryManager {
  /** 
   * 添加记录
   * @param {PromptRecord} record - 要添加的提示词记录
   * @returns {void}
   * @description 将新的提示词记录添加到历史中
   */
  addRecord(record: PromptRecord): void;
  
  /** 
   * 获取所有记录
   * @returns {PromptRecord[]} 所有提示词记录列表
   * @description 获取所有存储的提示词记录
   */
  getRecords(): PromptRecord[];
  
  /** 
   * 获取指定记录
   * @param {string} id - 记录ID
   * @returns {PromptRecord} 指定ID的提示词记录
   * @throws {Error} 当记录不存在时抛出错误
   * @description 根据ID获取特定的提示词记录
   */
  getRecord(id: string): PromptRecord;
  
  /** 
   * 删除记录
   * @param {string} id - 要删除的记录ID
   * @returns {void}
   * @throws {Error} 当记录不存在时抛出错误
   * @description 删除指定ID的提示词记录
   */
  deleteRecord(id: string): void;
  
  /** 
   * 获取迭代链
   * @param {string} recordId - 记录ID
   * @returns {PromptRecord[]} 相关联的记录列表，组成迭代链
   * @description 获取包含指定记录的整个迭代链
   */
  getIterationChain(recordId: string): PromptRecord[];
  
  /** 
   * 清除所有记录
   * @returns {void}
   * @description 清除所有存储的提示词记录
   */
  clearHistory(): void;
  
  /** 
   * 获取所有记录链
   * @returns {PromptRecordChain[]} 所有记录链列表
   * @description 获取所有存储的提示词记录链
   */
  getAllChains(): PromptRecordChain[];
  
  /** 
   * 创建新的记录链
   * @param {Omit<PromptRecord, 'chainId' | 'version' | 'previousId'>} record - 记录数据，不需要包含链相关字段
   * @returns {PromptRecordChain} 新创建的记录链
   * @description 使用提供的记录数据创建一个新的记录链
   */
  createNewChain(record: Omit<PromptRecord, 'chainId' | 'version' | 'previousId'>): PromptRecordChain;
  
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
   * @description 向指定链中添加新的迭代记录
   */
  addIteration(params: {
    chainId: string;
    originalPrompt: string;
    optimizedPrompt: string;
    iterationNote: string;
    modelKey: string;
    templateId: string;
  }): PromptRecordChain;
} 