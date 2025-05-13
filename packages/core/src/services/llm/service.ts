/**
 * @file service.ts
 * @description LLM服务实现
 * @module @prompt-assistant/core/services/llm
 */

import { ILLMService, Message, StreamHandlers, ModelOption, ThinkingResponse } from './types';
import { ModelConfig } from '../model/types';
import { ModelManager, modelManager as defaultModelManager } from '../model/manager';
import { createConfigError, ERROR_MESSAGES } from './errors';
import { ModelProviderFactory } from './providers/factory';
import { Validator } from './validator';
import { IModelProvider } from './providers/interface';
import { ServiceBase, ILogger } from '../common';

/**
 * LLM服务选项接口
 * @interface LLMServiceOptions
 */
export interface LLMServiceOptions {
  /**
   * 日志记录器
   * @type {ILogger}
   */
  logger?: ILogger;
  
  /**
   * 默认请求超时时间(毫秒)
   * @type {number}
   */
  defaultTimeout?: number;
  
  /**
   * 重试选项
   * @type {object}
   */
  retryOptions?: {
    /**
     * 最大重试次数
     * @type {number}
     */
    maxRetries: number;
    
    /**
     * 重试延迟(毫秒)
     * @type {number}
     */
    retryDelay: number;
  };
}

/**
 * LLM服务实现类
 * @class LLMService
 * @extends {ServiceBase<LLMServiceOptions>}
 * @implements {ILLMService}
 * @description 提供与各种大语言模型服务交互的核心功能，支持OpenAI、Gemini等主流模型
 */
export class LLMService extends ServiceBase<LLMServiceOptions> implements ILLMService {
  /**
   * 创建LLM服务实例
   * @constructor
   * @param {ModelManager} modelManager - 模型管理器实例
   * @param {LLMServiceOptions} [options] - 服务选项
   */
  constructor(
    private readonly modelManager: ModelManager,
    options?: LLMServiceOptions
  ) {
    super({
      options,
      serviceId: 'LLMService',
      logger: options?.logger
    });
  }
  
  /**
   * 获取默认选项
   * @protected
   * @param {LLMServiceOptions} [options] - 用户提供的选项
   * @returns {Required<LLMServiceOptions>} 合并默认值后的完整选项
   */
  protected getDefaultOptions(options?: LLMServiceOptions): Required<LLMServiceOptions> {
    return {
      logger: options?.logger || undefined,
      defaultTimeout: options?.defaultTimeout || 30000,
      retryOptions: options?.retryOptions || {
        maxRetries: 2,
        retryDelay: 1000
      }
    } as Required<LLMServiceOptions>;
  }
  
  /**
   * 获取并验证模型配置
   * @private
   * @param {string} provider - 提供商名称
   * @param {boolean} [validateEnabled=true] - 是否验证模型启用状态
   * @param {Partial<ModelConfig>} [customConfig] - 自定义配置(可选)
   * @returns {ModelConfig} 验证后的模型配置
   * @throws {ConfigError} 当配置无效时抛出
   */
  private getValidatedConfig(
    provider: string, 
    validateEnabled: boolean = true,
    customConfig?: Partial<ModelConfig>
  ): ModelConfig {
    if (!provider) {
      throw createConfigError('模型提供商不能为空');
    }
    
    // 获取基础配置
    let modelConfig = this.modelManager.getModel(provider);
    
    // 如果提供了自定义配置，则合并到基础配置
    if (customConfig && modelConfig) {
      modelConfig = {
        ...modelConfig,
        ...customConfig,
      };
    } else if (customConfig && !modelConfig) {
      // 没有找到模型但提供了自定义配置
      modelConfig = customConfig as ModelConfig;
      this.log('warn', `模型 ${provider} 不存在，使用自定义配置`);
    } else if (!modelConfig) {
      throw createConfigError(`模型 ${provider} 不存在`);
    }

    // 根据验证级别执行不同的验证
    if (validateEnabled) {
      Validator.validateModelConfig(modelConfig);
    } else {
      // 最低级别的验证
      if (!modelConfig.provider) {
        throw createConfigError('模型提供商不能为空');
      }
      if (!modelConfig.apiKey) {
        throw createConfigError(ERROR_MESSAGES.API_KEY_REQUIRED);
      }
      if (!modelConfig.baseURL) {
        throw createConfigError(ERROR_MESSAGES.BASE_URL_REQUIRED);
      }
    }
    
    return modelConfig;
  }
  
  /**
   * 创建模型提供商实例
   * @private
   * @param {ModelConfig} config - 模型配置
   * @param {boolean} [isStream=false] - 是否为流式请求
   * @returns {IModelProvider} 模型提供商实例
   */
  private createProvider(config: ModelConfig, isStream: boolean = false): IModelProvider {
    return ModelProviderFactory.createProvider(config, isStream);
  }
  
  /**
   * 执行提供商操作
   * @private
   * @template T - 操作结果类型
   * @param {string} actionName - 操作名称
   * @param {string} providerKey - 提供商键名
   * @param {(provider: IModelProvider) => Promise<T>} action - 操作函数
   * @param {object} [options] - 执行选项
   * @returns {Promise<T>} 操作结果
   */
  private async executeProviderAction<T>(
    actionName: string,
    providerKey: string,
    action: (provider: IModelProvider) => Promise<T>,
    options: {
      validateEnabled?: boolean;
      customConfig?: Partial<ModelConfig>;
    } = {}
  ): Promise<T> {
    return this.safeExecute(
      async () => {
        const modelConfig = this.getValidatedConfig(
          providerKey,
          options.validateEnabled ?? true,
          options.customConfig
        );
        
        this.log('info', `执行${actionName}操作`, {
          provider: modelConfig.provider,
          model: modelConfig.defaultModel
        });
        
        const provider = this.createProvider(modelConfig, actionName.includes('流式'));
        return await action(provider);
      },
      {
        operationName: actionName,
        context: { provider: providerKey }
      }
    );
  }
  
  /**
   * 发送消息到指定提供商
   * @param {Message[]} messages - 消息列表
   * @param {string} provider - 提供商名称
   * @returns {Promise<string>} 模型响应
   * @throws {APIError} 当API调用失败时抛出
   * @throws {ConfigError} 当配置无效时抛出
   */
  async sendMessage(messages: Message[], provider: string): Promise<string> {
    Validator.validateMessages(messages);
    
    return this.executeProviderAction(
      '发送消息',
      provider,
      (modelProvider) => modelProvider.sendMessage(messages)
    );
  }
  
  /**
   * 发送流式消息
   * @param {Message[]} messages - 消息列表
   * @param {string} provider - 提供商名称
   * @param {StreamHandlers} callbacks - 流式处理回调
   * @returns {Promise<void>}
   * @throws {APIError} 当API调用失败时抛出
   * @throws {ConfigError} 当配置无效时抛出
   */
  async sendMessageStream(
    messages: Message[],
    provider: string,
    callbacks: StreamHandlers
  ): Promise<void> {
    Validator.validateMessages(messages);
    
    // 创建带错误处理的回调
    const wrappedCallbacks: StreamHandlers = {
      onToken: callbacks.onToken,
      onComplete: callbacks.onComplete,
      onError: (error) => {
        this.log('error', '流式响应错误', {
          provider,
          error: error.message
        });
        callbacks.onError(error);
      }
    };
    
    try {
      await this.executeProviderAction(
        '流式消息',
        provider,
        (modelProvider) => modelProvider.sendMessageStream(messages, wrappedCallbacks)
      );
    } catch (error) {
      // 确保错误已通过回调处理
      wrappedCallbacks.onError(
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }
  
  /**
   * 测试与提供商的连接
   * @param {string} provider - 提供商名称
   * @returns {Promise<void>}
   * @throws {APIError} 当连接测试失败时抛出
   */
  async testConnection(provider: string): Promise<void> {
    return this.executeProviderAction(
      '测试连接',
      provider,
      (modelProvider) => modelProvider.testConnection()
    );
  }
  
  /**
   * 获取模型列表
   * @param {string} provider - 提供商名称
   * @param {Partial<ModelConfig>} [customConfig] - 自定义配置
   * @returns {Promise<ModelOption[]>} 模型选项列表
   * @throws {APIError} 当获取失败时抛出
   */
  async fetchModelList(
    provider: string,
    customConfig?: Partial<ModelConfig>
  ): Promise<ModelOption[]> {
    return this.executeProviderAction(
      '获取模型列表',
      provider,
      async (modelProvider) => {
        const models = await modelProvider.fetchModels();
        
        // 转换为选项格式
        return models.map(model => ({
          value: model.id,
          label: model.name
        }));
      },
      {
        validateEnabled: false,
        customConfig
      }
    );
  }
  
  /**
   * 发送消息到指定提供商并获取带有思考过程的响应
   * @param {Message[]} messages - 消息列表
   * @param {string} provider - 提供商名称
   * @returns {Promise<ThinkingResponse>} 包含思考过程的响应
   * @throws {APIError} 当API调用失败时抛出
   * @throws {ConfigError} 当配置无效时抛出
   */
  async sendMessageWithThinking(messages: Message[], provider: string): Promise<ThinkingResponse> {
    Validator.validateMessages(messages);
    
    return this.executeProviderAction(
      '带思考过程的消息',
      provider,
      (modelProvider) => modelProvider.sendMessageWithThinking(messages)
    );
  }
}

/**
 * 创建LLM服务实例
 * @param {ModelManager} [modelManager=defaultModelManager] - 模型管理器实例
 * @param {LLMServiceOptions} [options] - 服务选项
 * @returns {LLMService} LLM服务实例
 */
export function createLLMService(
  modelManager: ModelManager = defaultModelManager,
  options?: LLMServiceOptions
): LLMService {
  return new LLMService(modelManager, options);
}
