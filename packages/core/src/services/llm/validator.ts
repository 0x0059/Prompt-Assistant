import { Message } from './types';
import { ModelConfig } from '../model/types';
import { RequestConfigError, ERROR_MESSAGES } from './errors';

/**
 * 验证工具类
 * @class Validator
 * @description 提供各种验证方法
 */
export class Validator {
  /**
   * 验证消息格式
   * @param {Message[]} messages - 要验证的消息列表
   * @throws {RequestConfigError} 当消息格式无效时抛出
   */
  static validateMessages(messages: Message[]): void {
    if (!Array.isArray(messages)) {
      throw new RequestConfigError('消息必须是数组格式');
    }
    if (messages.length === 0) {
      throw new RequestConfigError('消息列表不能为空');
    }
    messages.forEach(msg => {
      if (!msg.role || !msg.content) {
        throw new RequestConfigError('消息格式无效: 缺少必要字段');
      }
      if (!['system', 'user', 'assistant'].includes(msg.role)) {
        throw new RequestConfigError(`不支持的消息类型: ${msg.role}`);
      }
      if (typeof msg.content !== 'string') {
        throw new RequestConfigError('消息内容必须是字符串');
      }
    });
  }
  
  /**
   * 验证模型配置
   * @param {ModelConfig} modelConfig - 要验证的模型配置
   * @throws {RequestConfigError} 当配置无效时抛出
   */
  static validateModelConfig(modelConfig: ModelConfig): void {
    if (!modelConfig) {
      throw new RequestConfigError('模型配置不能为空');
    }
    if (!modelConfig.provider) {
      throw new RequestConfigError('模型提供商不能为空');
    }
    if (!modelConfig.apiKey) {
      throw new RequestConfigError(ERROR_MESSAGES.API_KEY_REQUIRED);
    }
    if (!modelConfig.defaultModel) {
      throw new RequestConfigError('默认模型不能为空');
    }
    if (!modelConfig.enabled) {
      throw new RequestConfigError('模型未启用');
    }
  }
} 