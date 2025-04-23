/**
 * @file types.ts
 * @description 模型服务相关类型定义
 * @module @prompt-assistant/core/services/model
 * @author Moyu.la
 */

/**
 * 模型配置接口
 * @interface ModelConfig
 * @description 定义AI模型的配置信息，包括API连接参数、支持的模型列表和启用状态
 */
export interface ModelConfig {
  /** 
   * 模型名称
   * @type {string}
   * @description 用于显示的友好名称
   */
  name: string;
  
  /** 
   * API基础URL
   * @type {string}
   * @description API服务的基础URL，如OpenAI为https://api.openai.com/v1
   */
  baseURL: string;
  
  /** 
   * API密钥
   * @type {string}
   * @description 访问API所需的密钥，存储在本地
   * @optional
   */
  apiKey?: string;
  
  /** 
   * 支持的模型列表
   * @type {string[]}
   * @description 当前提供商支持的模型列表
   */
  models: string[];
  
  /** 
   * 默认模型
   * @type {string}
   * @description 默认使用的模型名称，应是models数组中的一个
   */
  defaultModel: string;
  
  /** 
   * 是否启用
   * @type {boolean}
   * @description 控制模型是否可用
   */
  enabled: boolean;
  
  /** 
   * 提供商
   * @type {string}
   * @description AI服务提供商标识，用于决定使用哪种API调用方式
   */
  provider: 'deepseek' | 'gemini' | 'custom' | string;
  
  /** 
   * 是否使用Vercel代理
   * @type {boolean}
   * @description 是否使用Vercel Edge Functions代理API请求以解决CORS问题
   * @optional
   */
  useVercelProxy?: boolean;
}

/**
 * 模型管理器接口
 * @interface IModelManager
 * @description 定义模型管理器的公共方法，用于管理和操作模型配置
 */
export interface IModelManager {
  /** 
   * 获取所有模型配置
   * @returns {Array<ModelConfig & { key: string }>} 所有模型的配置列表，包含模型的唯一标识符
   */
  getAllModels(): Array<ModelConfig & { key: string }>;
  
  /** 
   * 获取指定模型配置
   * @param {string} key - 模型的唯一标识符
   * @returns {ModelConfig | undefined} 模型配置，如果不存在则返回undefined
   */
  getModel(key: string): ModelConfig | undefined;
  
  /** 
   * 添加模型配置
   * @param {string} key - 模型的唯一标识符
   * @param {ModelConfig} config - 模型配置
   * @throws {Error} 当模型已存在或配置无效时抛出错误
   */
  addModel(key: string, config: ModelConfig): void;
  
  /** 
   * 更新模型配置
   * @param {string} key - 模型的唯一标识符
   * @param {Partial<ModelConfig>} config - 要更新的配置项
   * @throws {Error} 当模型不存在或配置无效时抛出错误
   */
  updateModel(key: string, config: Partial<ModelConfig>): void;
  
  /** 
   * 删除模型配置
   * @param {string} key - 模型的唯一标识符
   * @throws {Error} 当模型不存在时抛出错误
   */
  deleteModel(key: string): void;
  
  /** 
   * 启用模型
   * @param {string} key - 模型的唯一标识符
   * @throws {Error} 当模型不存在或配置无效时抛出错误
   */
  enableModel(key: string): void;
  
  /** 
   * 禁用模型
   * @param {string} key - 模型的唯一标识符
   * @throws {Error} 当模型不存在时抛出错误
   */
  disableModel(key: string): void;
  
  /** 
   * 获取启用的模型
   * @returns {Array<ModelConfig & { key: string }>} 所有启用状态的模型配置列表
   */
  getEnabledModels(): Array<ModelConfig & { key: string }>;
} 