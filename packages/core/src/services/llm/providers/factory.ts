import { ModelConfig } from '../../model/types';
import { IModelProvider } from './interface';
import { OpenAIProvider } from './openai';
import { GeminiProvider } from './gemini';
import { AnthropicProvider } from './anthropic';

type ProviderConstructor = new (config: ModelConfig, isStream?: boolean) => IModelProvider;

/**
 * 模型提供商类型
 * @enum
 */
export enum ProviderType {
  OPENAI = 'openai',
  GEMINI = 'gemini',
  ANTHROPIC = 'anthropic',
  DEEPSEEK = 'deepseek',  // DeepSeek兼容OpenAI接口，使用OpenAIProvider
  OLLAMA = 'ollama',      // Ollama兼容OpenAI接口，使用OpenAIProvider
  CUSTOM = 'custom'
}

/**
 * 模型提供商工厂
 * @class ModelProviderFactory
 * @description 负责创建不同模型提供商的实例
 */
export class ModelProviderFactory {
  /**
   * 提供商映射表
   * @private
   * @static
   * @description 
   * - OpenAI提供商：处理OpenAI API
   * - Gemini提供商：处理Google Gemini API
   * - Anthropic提供商：处理Anthropic Claude API
   * - DeepSeek：兼容OpenAI接口，使用OpenAIProvider
   * - Ollama：兼容OpenAI接口，使用OpenAIProvider
   */
  private static readonly providers: Record<string, ProviderConstructor> = {
    [ProviderType.GEMINI]: GeminiProvider,
    [ProviderType.ANTHROPIC]: AnthropicProvider,
    [ProviderType.OPENAI]: OpenAIProvider,
    [ProviderType.DEEPSEEK]: OpenAIProvider, // DeepSeek使用OpenAI提供商，因为API兼容
    [ProviderType.OLLAMA]: OpenAIProvider    // Ollama使用OpenAI提供商，因为API兼容
  };
  
  /**
   * 获取所有已注册的提供商
   * @returns {string[]} 提供商名称列表
   */
  public static getRegisteredProviders(): string[] {
    return Object.keys(this.providers);
  }
  
  /**
   * 检查提供商是否已注册
   * @param {string} name - 提供商名称
   * @returns {boolean} 是否已注册
   */
  public static isProviderRegistered(name: string): boolean {
    return !!this.providers[name.toLowerCase()];
  }
  
  /**
   * 注册新的提供商
   * @param {string} name - 提供商名称
   * @param {ProviderConstructor} constructor - 提供商构造函数
   * @throws {Error} 当提供商名称为空或构造函数无效时抛出
   */
  public static registerProvider(name: string, constructor: ProviderConstructor): void {
    if (!name || name.trim() === '') {
      throw new Error('提供商名称不能为空');
    }
    
    if (!constructor) {
      throw new Error('提供商构造函数不能为空');
    }
    
    const lowerName = name.toLowerCase();
    if (this.providers[lowerName]) {
      console.warn(`提供商 ${name} 已存在，将被覆盖`);
    }
    
    this.providers[lowerName] = constructor;
  }
  
  /**
   * 创建模型提供商实例
   * @param {ModelConfig} config - 模型配置
   * @param {boolean} [isStream=false] - 是否为流式请求
   * @returns {IModelProvider} 模型提供商实例
   * @throws {Error} 当提供商未注册且未提供默认值时抛出
   */
  public static createProvider(config: ModelConfig, isStream: boolean = false): IModelProvider {
    if (!config) {
      throw new Error('模型配置不能为空');
    }
    
    const provider = config.provider?.toLowerCase() || '';
    
    if (!provider) {
      throw new Error('提供商名称不能为空');
    }
    
    const ProviderClass = this.providers[provider] || this.providers[ProviderType.OPENAI];
    
    if (!ProviderClass) {
      throw new Error(`提供商 ${provider} 未注册，且未提供默认提供商`);
    }
    
    try {
      return new ProviderClass(config, isStream);
    } catch (e) {
      const error = e as Error;
      throw new Error(`创建提供商 ${provider} 实例失败: ${error.message}`);
    }
  }
} 