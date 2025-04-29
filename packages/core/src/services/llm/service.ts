import { ILLMService, Message, StreamHandlers, ModelOption, ThinkingResponse } from './types';
import { ModelConfig } from '../model/types';
import { ModelManager, modelManager as defaultModelManager } from '../model/manager';
import { APIError, RequestConfigError, ERROR_MESSAGES } from './errors';
import { ModelProviderFactory } from './providers/factory';
import { Validator } from './validator';
import { IModelProvider } from './providers/interface';

/**
 * LLM服务实现类
 * @class LLMService
 * @description 提供与各种大语言模型服务交互的核心功能，支持OpenAI、Gemini等主流模型
 * @implements {ILLMService}
 */
export class LLMService implements ILLMService {
  /**
   * 创建LLM服务实例
   * @constructor
   * @param {ModelManager} modelManager - 模型管理器实例
   */
  constructor(private modelManager: ModelManager) { }

  /**
   * 获取并验证模型配置
   * @private
   * @param {string} provider - 提供商名称
   * @param {Partial<ModelConfig>} [customConfig] - 自定义配置
   * @param {boolean} [validateFull=true] - 是否进行完整验证
   * @returns {ModelConfig} 验证后的模型配置
   * @throws {RequestConfigError} 当验证失败时抛出
   */
  private getValidatedModelConfig(
    provider: string,
    customConfig?: Partial<ModelConfig>,
    validateFull: boolean = true
  ): ModelConfig {
    if (!provider) {
      throw new RequestConfigError('模型提供商不能为空');
    }
    
    // 获取基础配置
    let modelConfig = this.modelManager.getModel(provider);
    
    // 如果提供了自定义配置，则合并到基础配置
    if (customConfig) {
      modelConfig = {
        ...modelConfig,
        ...(customConfig as ModelConfig),
      };
    }
    
    if (!modelConfig) {
      console.warn(`模型 ${provider} 不存在，使用自定义配置`);
      if (!customConfig) {
        throw new RequestConfigError(`模型 ${provider} 不存在`);
      }
      modelConfig = customConfig as ModelConfig;
    }
    
    // 根据需要进行完整验证或部分验证
    if (validateFull) {
      Validator.validateModelConfig(modelConfig);
    } else {
      // 仅验证必要的配置（API URL和密钥）
      if (!modelConfig.baseURL) {
        throw new RequestConfigError('API URL不能为空');
      }
      if (!modelConfig.apiKey) {
        throw new RequestConfigError(ERROR_MESSAGES.API_KEY_REQUIRED);
      }
    }
    
    return modelConfig;
  }
  
  /**
   * 创建模型提供商实例
   * @private
   * @param {ModelConfig} modelConfig - 模型配置
   * @param {boolean} [isStream=false] - 是否为流式请求
   * @returns {IModelProvider} 模型提供商实例
   */
  private createModelProvider(modelConfig: ModelConfig, isStream: boolean = false): IModelProvider {
    return ModelProviderFactory.createProvider(modelConfig, isStream);
  }
  
  /**
   * 包装API调用并统一错误处理
   * @private
   * @template T
   * @param {string} operationName - 操作名称（用于日志）
   * @param {() => Promise<T>} operation - 要执行的异步操作
   * @returns {Promise<T>} 操作结果
   * @throws {APIError | RequestConfigError} 当操作失败时抛出
   */
  private async executeWithErrorHandling<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      console.error(`${operationName}失败:`, error);
      if (error instanceof RequestConfigError || error instanceof APIError) {
        throw error;
      }
      throw new APIError(`${operationName}失败: ${error.message}`);
    }
  }
  
  /**
   * 发送消息到指定提供商
   * @param {Message[]} messages - 消息列表
   * @param {string} provider - 提供商名称
   * @returns {Promise<string>} 模型响应
   * @throws {APIError} 当API调用失败时抛出
   * @throws {RequestConfigError} 当配置无效时抛出
   */
  async sendMessage(messages: Message[], provider: string): Promise<string> {
    return this.executeWithErrorHandling('发送消息', async () => {
      Validator.validateMessages(messages);
      const modelConfig = this.getValidatedModelConfig(provider);
      
      console.log('发送消息:', {
        provider: modelConfig.provider,
        model: modelConfig.defaultModel,
        messagesCount: messages.length
      });
      
      const modelProvider = this.createModelProvider(modelConfig);
      return await modelProvider.sendMessage(messages);
    });
  }
  
  /**
   * 发送流式消息
   * @param {Message[]} messages - 消息列表
   * @param {string} provider - 提供商名称
   * @param {StreamHandlers} callbacks - 流式处理回调
   * @returns {Promise<void>}
   * @throws {APIError} 当API调用失败时抛出
   * @throws {RequestConfigError} 当配置无效时抛出
   */
  async sendMessageStream(
    messages: Message[],
    provider: string,
    callbacks: StreamHandlers
  ): Promise<void> {
    try {
      console.log('开始流式请求:', { provider, messagesCount: messages.length });
      Validator.validateMessages(messages);
      
      const modelConfig = this.getValidatedModelConfig(provider);
      
      console.log('获取到模型实例:', {
        provider: modelConfig.provider,
        model: modelConfig.defaultModel
      });
      
      const modelProvider = this.createModelProvider(modelConfig, true);
      await modelProvider.sendMessageStream(messages, callbacks);
    } catch (error) {
      console.error('流式请求失败:', error);
      callbacks.onError(error instanceof Error ? error : new Error(String(error)));
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
    return this.executeWithErrorHandling('连接测试', async () => {
      const modelConfig = this.getValidatedModelConfig(provider);
      
      console.log('测试连接provider:', { 
        provider,
        baseURL: modelConfig.baseURL
      });
      
      const modelProvider = this.createModelProvider(modelConfig);
      await modelProvider.testConnection();
    });
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
    return this.executeWithErrorHandling('获取模型列表', async () => {
      const modelConfig = this.getValidatedModelConfig(provider, customConfig, false);
      
      console.log(`获取 ${modelConfig.name || provider} 的模型列表`);
      
      const modelProvider = this.createModelProvider(modelConfig);
      const models = await modelProvider.fetchModels();
      
      // 转换为选项格式
      return models.map(model => ({
        value: model.id,
        label: model.name
      }));
    });
  }
  
  /**
   * 发送消息到指定提供商并获取带有思考过程的响应
   * @param {Message[]} messages - 消息列表
   * @param {string} provider - 提供商名称
   * @returns {Promise<ThinkingResponse>} 包含思考过程的响应
   * @throws {APIError} 当API调用失败时抛出
   * @throws {RequestConfigError} 当配置无效时抛出
   */
  async sendMessageWithThinking(messages: Message[], provider: string): Promise<ThinkingResponse> {
    return this.executeWithErrorHandling('发送带思考过程的消息', async () => {
      Validator.validateMessages(messages);
      const modelConfig = this.getValidatedModelConfig(provider);
      
      console.log('发送带思考过程的消息:', {
        provider: modelConfig.provider,
        model: modelConfig.defaultModel,
        messagesCount: messages.length
      });
      
      const modelProvider = this.createModelProvider(modelConfig);
      return await modelProvider.sendMessageWithThinking(messages);
    });
  }
}

/**
 * 创建LLM服务实例
 * @param {ModelManager} [modelManager=defaultModelManager] - 模型管理器实例
 * @returns {LLMService} LLM服务实例
 */
export function createLLMService(modelManager: ModelManager = defaultModelManager): LLMService {
  return new LLMService(modelManager);
}
