/**
 * @file manager.ts
 * @description 模型管理器实现，提供AI模型配置的存储、验证和管理功能
 * @module @prompt-assistant/core/services/model
 * @author Moyu.la
 */

import { ModelConfig, IModelManager } from './types';
import { ModelConfigError } from '../llm/errors';
import { defaultModels } from './defaults';

/**
 * 模型管理器实现类
 * @class ModelManager
 * @description 管理AI模型配置的核心类，提供模型的增删改查、启用禁用等功能
 * @implements {IModelManager}
 * 
 * @example
 * const manager = new ModelManager();
 * 
 * // 获取所有模型
 * const models = manager.getAllModels();
 * 
 * // 添加新模型
 * manager.addModel('gpt-4', {
 *   provider: 'openai',
 *   apiKey: 'your-api-key',
 *   defaultModel: 'gpt-4',
 *   enabled: true
 * });
 */
export class ModelManager implements IModelManager {
  /**
   * 存储所有模型配置的对象
   * @private
   * @type {Record<string, ModelConfig>}
   */
  private models: Record<string, ModelConfig>;

  /**
   * 创建模型管理器实例
   * @constructor
   * @description 初始化模型管理器，加载本地存储的模型配置和内置模型
   */
  constructor() {
    this.models = {};
    this.init();
  }

  /**
   * 初始化模型管理器
   * @private
   * @description 从本地存储加载模型配置，并确保内置模型存在
   * @throws {Error} 当初始化失败时抛出
   */
  private init(): void {
    try {
      // 1. 先从本地存储加载所有模型配置
      const storedData = localStorage.getItem('models');
      if (storedData) {
        this.models = JSON.parse(storedData);
      }

      // 2. 检查内置模型是否存在，不存在则添加到本地存储
      let hasChanges = false;
      Object.entries(defaultModels).forEach(([key, config]) => {
        if (!this.models[key]) {
          this.models[key] = {
            ...config
          };
          hasChanges = true;
        }
      });

      // 3. 如果有新增的内置模型，保存到本地存储
      if (hasChanges) {
        this.saveToStorage();
      }
    } catch (error) {
      console.error('初始化模型管理器失败:', error);
    }
  }

  /**
   * 获取所有模型配置
   * @returns {Array<ModelConfig & { key: string }>} 所有模型的配置列表
   * @description 从本地存储重新加载最新数据并返回所有模型配置
   */
  getAllModels(): Array<ModelConfig & { key: string }> {
    // 每次获取都从存储重新加载最新数据
    const storedData = localStorage.getItem('models');
    if (storedData) {
      try {
        this.models = JSON.parse(storedData);
      } catch (error) {
        console.error('解析模型配置失败:', error);
      }
    }

    const returnValue = Object.entries(this.models).map(([key, config]) => ({
      ...config,
      key
    }));
    return returnValue;
  }

  /**
   * 获取指定模型配置
   * @param {string} key - 模型标识
   * @returns {ModelConfig | undefined} 模型配置，如果不存在则返回undefined
   */
  getModel(key: string): ModelConfig | undefined {
    return this.models[key];
  }

  /**
   * 添加模型配置
   * @param {string} key - 模型标识
   * @param {ModelConfig} config - 模型配置
   * @throws {ModelConfigError} 当模型已存在或配置无效时抛出
   */
  addModel(key: string, config: ModelConfig): void {
    if (this.models[key]) {
      throw new ModelConfigError(`模型 ${key} 已存在`);
    }
    this.validateConfig(config);
    this.models[key] = { ...config };
    this.saveToStorage();
  }

  /**
   * 更新模型配置
   * @param {string} key - 模型标识
   * @param {Partial<ModelConfig>} config - 要更新的配置项
   * @throws {ModelConfigError} 当模型不存在或配置无效时抛出
   */
  updateModel(key: string, config: Partial<ModelConfig>): void {
    if (!this.models[key]) {
      throw new ModelConfigError(`模型 ${key} 不存在`);
    }

    // 合并配置时保留原有 enabled 状态
    const updatedConfig = {
      ...this.models[key],
      ...config,
      // 确保 enabled 属性存在
      enabled: config.enabled !== undefined ? config.enabled : this.models[key].enabled
    };

    // 如果更新了关键字段或尝试启用模型，需要验证配置
    if (
      config.name !== undefined ||
      config.baseURL !== undefined ||
      config.models !== undefined ||
      config.defaultModel !== undefined ||
      config.apiKey !== undefined ||
      config.enabled
    ) {
      this.validateConfig(updatedConfig);
    }

    this.models[key] = updatedConfig;
    this.saveToStorage();
  }

  /**
   * 删除模型配置
   * @param {string} key - 模型标识
   * @throws {ModelConfigError} 当模型不存在时抛出
   */
  deleteModel(key: string): void {
    if (!this.models[key]) {
      throw new ModelConfigError(`模型 ${key} 不存在`);
    }
    delete this.models[key];
    this.saveToStorage();
  }

  /**
   * 启用模型
   * @param {string} key - 模型标识
   * @throws {ModelConfigError} 当模型不存在或配置无效时抛出
   */
  enableModel(key: string): void {
    if (!this.models[key]) {
      throw new ModelConfigError(`未知的模型: ${key}`);
    }

    // 使用完整验证
    this.validateEnableConfig(this.models[key]);

    this.models[key].enabled = true;
    this.saveToStorage();
  }

  /**
   * 禁用模型
   * @param {string} key - 模型标识
   * @throws {ModelConfigError} 当模型不存在时抛出
   */
  disableModel(key: string): void {
    if (!this.models[key]) {
      throw new ModelConfigError(`未知的模型: ${key}`);
    }

    this.models[key].enabled = false;
    this.saveToStorage();
  }

  /**
   * 验证模型配置
   * @private
   * @param {ModelConfig} config - 要验证的模型配置
   * @throws {ModelConfigError} 当配置无效时抛出
   * @description 验证模型配置的必要字段，包括名称、提供商、URL和默认模型
   */
  private validateConfig(config: ModelConfig): void {
    if (!config) {
      throw new ModelConfigError('模型配置不能为空');
    }

    if (!config.name) {
      throw new ModelConfigError('模型名称不能为空');
    }

    if (!config.provider) {
      throw new ModelConfigError('模型提供商不能为空');
    }

    if (!config.baseURL) {
      throw new ModelConfigError('API基础URL不能为空');
    }

    if (!config.defaultModel) {
      throw new ModelConfigError('默认模型不能为空');
    }

    if (!Array.isArray(config.models) || config.models.length === 0) {
      throw new ModelConfigError('模型列表不能为空');
    }

    if (!config.models.includes(config.defaultModel)) {
      throw new ModelConfigError(`默认模型 ${config.defaultModel} 不在模型列表中`);
    }
  }

  /**
   * 验证启用模型的配置
   * @private
   * @param {ModelConfig} config - 要验证的模型配置
   * @throws {ModelConfigError} 当启用配置无效时抛出
   * @description 验证启用模型所需的额外字段，主要检查API密钥是否存在
   */
  private validateEnableConfig(config: ModelConfig): void {
    this.validateConfig(config);

    // 启用模型时必须有API密钥
    if (!config.apiKey) {
      throw new ModelConfigError('启用模型需要提供API密钥');
    }
  }

  /**
   * 保存配置到本地存储
   * @private
   * @description 将当前模型配置序列化后保存到localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem('models', JSON.stringify(this.models));
    } catch (error) {
      console.error('保存模型配置失败:', error);
    }
  }

  /**
   * 获取所有启用的模型
   * @returns {Array<ModelConfig & { key: string }>} 所有启用状态的模型配置列表
   */
  getEnabledModels(): Array<ModelConfig & { key: string }> {
    return this.getAllModels().filter(model => model.enabled);
  }
}

/**
 * 模型管理器单例
 * @type {ModelManager}
 * @description 提供全局共享的模型管理器实例
 */
export const modelManager = new ModelManager();