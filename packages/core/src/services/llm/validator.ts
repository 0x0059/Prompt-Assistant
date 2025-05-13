/**
 * @file validator.ts
 * @description LLM服务输入验证器
 * @module @prompt-assistant/core/services/llm
 */

import { ModelConfig } from '../model/types';
import { Message } from './types';
import { ERROR_MESSAGES, createConfigError } from './errors';
import { ValidationError, createValidationError } from '../common/errors';

/**
 * LLM服务验证器
 * @class Validator
 * @description 提供LLM服务相关输入验证功能
 */
export class Validator {
  /**
   * 验证消息列表
   * @static
   * @param {Message[]} messages - 要验证的消息列表
   * @throws {ValidationError} 当验证失败时抛出
   */
  static validateMessages(messages: Message[]): void {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw createValidationError(ERROR_MESSAGES.EMPTY_MESSAGES);
    }
    
    // 验证每条消息格式
    for (const [index, message] of messages.entries()) {
      if (!message || typeof message !== 'object') {
        throw createValidationError(
          `${ERROR_MESSAGES.INVALID_MESSAGE_FORMAT}: 第${index + 1}条消息无效`,
          { index, message }
        );
      }
      
      // 验证角色
      if (!message.role || !['system', 'user', 'assistant'].includes(message.role)) {
        throw createValidationError(
          `${ERROR_MESSAGES.INVALID_MESSAGE_FORMAT}: 第${index + 1}条消息角色无效`,
          { index, role: message.role }
        );
      }
      
      // 验证内容
      if (typeof message.content !== 'string') {
        throw createValidationError(
          `${ERROR_MESSAGES.INVALID_MESSAGE_FORMAT}: 第${index + 1}条消息内容无效`,
          { index, content: message.content }
        );
      }
    }
  }
  
  /**
   * 验证模型配置
   * @static
   * @param {ModelConfig} config - 要验证的模型配置
   * @throws {ValidationError} 当验证失败时抛出
   */
  static validateModelConfig(config: ModelConfig): void {
    if (!config) {
      throw createConfigError(ERROR_MESSAGES.MODEL_NOT_FOUND);
    }
    
    // 验证必要字段
    if (!config.provider) {
      throw createConfigError('提供商不能为空', { config });
    }
    
    if (!config.apiKey) {
      throw createConfigError(ERROR_MESSAGES.API_KEY_REQUIRED, { provider: config.provider });
    }
    
    if (!config.baseURL) {
      throw createConfigError(ERROR_MESSAGES.BASE_URL_REQUIRED, { provider: config.provider });
    }
    
    if (!config.defaultModel) {
      throw createConfigError('默认模型不能为空', { provider: config.provider });
    }
    
    // 验证模型是否启用
    if (config.enabled === false) {
      throw createConfigError(ERROR_MESSAGES.MODEL_DISABLED, { 
        provider: config.provider,
        model: config.defaultModel
      });
    }
  }
} 