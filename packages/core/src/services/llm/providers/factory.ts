import { ModelConfig } from '../../model/types';
import { IModelProvider } from './interface';
import { OpenAIProvider } from './openai';
import { GeminiProvider } from './gemini';
import { AnthropicProvider } from './anthropic';

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
    
    switch (provider) {
      case 'gemini':
        return new GeminiProvider(config);
      case 'anthropic':
        return new AnthropicProvider(config);
      case 'openai':
      case 'deepseek':
      case 'ollama':
      default:
        // 使用OpenAI兼容API提供商
        return new OpenAIProvider(config, isStream);
    }
  }
} 