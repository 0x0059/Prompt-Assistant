import { ModelConfig } from '../../model/types';
import { IModelProvider } from './interface';
import { OpenAIProvider } from './openai';
import { GeminiProvider } from './gemini';
import { AnthropicProvider } from './anthropic';

/**
 * 提供商映射表，用于快速查找提供商类
 */
const PROVIDER_MAP: Record<string, new (config: ModelConfig, isStream?: boolean) => IModelProvider> = {
  'gemini': GeminiProvider,
  'anthropic': AnthropicProvider,
  'openai': OpenAIProvider,
  // 使用OpenAI兼容API的其他提供商
  'deepseek': OpenAIProvider,
  'ollama': OpenAIProvider
};

/**
 * 模型提供商工厂
 * @class ModelProviderFactory
 * @description 负责创建不同模型提供商的实例
 */
export class ModelProviderFactory {
  /**
   * 创建模型提供商实例
   * @param {ModelConfig} config - 模型配置
   * @param {boolean} [isStream=false] - 是否为流式请求
   * @returns {IModelProvider} 模型提供商实例
   */
  static createProvider(config: ModelConfig, isStream: boolean = false): IModelProvider {
    const provider = config.provider.toLowerCase();
    
    // 从映射表中获取提供商类，如果未定义则默认使用OpenAI兼容API
    const ProviderClass = PROVIDER_MAP[provider] || OpenAIProvider;
    
    return new ProviderClass(config, isStream);
  }
  
  /**
   * 注册新的模型提供商
   * @param {string} providerName - 提供商名称
   * @param {new (config: ModelConfig, isStream?: boolean) => IModelProvider} ProviderClass - 提供商类
   */
  static registerProvider(
    providerName: string, 
    ProviderClass: new (config: ModelConfig, isStream?: boolean) => IModelProvider
  ): void {
    PROVIDER_MAP[providerName.toLowerCase()] = ProviderClass;
  }
} 