/**
 * @file defaults.ts
 * @description 默认模型配置和环境变量处理，提供预设的模型配置和环境变量获取功能
 * @module @prompt-assistant/core/services/model
 * @author Moyu.la
 */

import { ModelConfig } from './types';

/**
 * 获取环境变量的辅助函数
 * 按优先级从不同来源获取环境变量值
 * 
 * @function getEnvVar
 * @param {string} key - 环境变量名称
 * @returns {string} 环境变量值，如不存在则返回空字符串
 * @description 按照以下优先级获取环境变量: 
 *   1. 运行时配置 (window.runtime_config)
 *   2. Node.js 环境变量 (process.env)
 *   3. Vite 构建时环境变量 (import.meta.env)
 */
const getEnvVar = (key: string): string => {
  // 0. 首先检查运行时配置 (用于容器化部署时的动态配置)
  if (typeof window !== 'undefined' && window.runtime_config) {
    // 移除 VITE_ 前缀以匹配运行时配置中的键名
    const runtimeKey = key.replace('VITE_', '');
    const value = window.runtime_config[runtimeKey];
    if (value !== undefined && value !== null) {
      return String(value);
    }
  }

  // 1. 然后尝试 process.env (用于Node.js环境)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] || '';
  }

  // 2. 然后尝试 import.meta.env (用于Vite开发环境)
  try {
    // @ts-ignore - 在构建时忽略此错误，因为TypeScript无法识别import.meta
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore - 同上
      const value = import.meta.env[key];
      if (value) return value;
    }
  } catch {
    // 忽略可能的错误，继续尝试其他方式
  }

  // 3. 如果都没有找到，返回空字符串
  return '';
};

/**
 * 从环境变量获取各服务商的API密钥
 * @type {string}
 */
const OPENAI_API_KEY = getEnvVar('VITE_OPENAI_API_KEY').trim();
const GEMINI_API_KEY = getEnvVar('VITE_GEMINI_API_KEY').trim();
const DEEPSEEK_API_KEY = getEnvVar('VITE_DEEPSEEK_API_KEY').trim();
const SILICONFLOW_API_KEY = getEnvVar('VITE_SILICONFLOW_API_KEY').trim();
const CUSTOM_API_KEY = getEnvVar('VITE_CUSTOM_API_KEY').trim();
const CUSTOM_API_BASE_URL = getEnvVar('VITE_CUSTOM_API_BASE_URL');
const CUSTOM_API_MODEL = getEnvVar('VITE_CUSTOM_API_MODEL');

/**
 * 默认模型配置对象
 * 包含常用AI服务提供商的预设配置
 * 
 * @type {Record<string, ModelConfig>}
 * @description 预设了以下模型配置:
 *   - OpenAI: 支持gpt-4和gpt-3.5-turbo模型
 *   - Gemini: 支持谷歌的gemini-2.0-flash模型
 *   - DeepSeek: 支持DeepSeek自研模型
 *   - SiliconFlow: 支持硅流云平台的DeepSeek-V3模型
 *   - Custom: 支持自定义OpenAI兼容API
 */
export const defaultModels: Record<string, ModelConfig> = {
  /**
   * OpenAI模型配置
   * @type {ModelConfig}
   */
  openai: {
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    models: ['gpt-4', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-3.5-turbo',
    apiKey: OPENAI_API_KEY,
    enabled: !!OPENAI_API_KEY,
    provider: 'openai'
  },
  
  /**
   * Gemini模型配置
   * @type {ModelConfig}
   */
  gemini: {
    name: 'Gemini',
    baseURL: 'https://generativelanguage.googleapis.com',
    models: ['gemini-2.0-flash'],
    defaultModel: 'gemini-2.0-flash',
    apiKey: GEMINI_API_KEY,
    enabled: !!GEMINI_API_KEY,
    provider: 'gemini'
  },
  
  /**
   * DeepSeek模型配置
   * @type {ModelConfig}
   */
  deepseek: {
    name: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat'],
    defaultModel: 'deepseek-chat',
    apiKey: DEEPSEEK_API_KEY,
    enabled: !!DEEPSEEK_API_KEY,
    provider: 'deepseek'
  },
  
  /**
   * SiliconFlow模型配置
   * @type {ModelConfig}
   */
  siliconflow: {
    name: 'SiliconFlow',
    baseURL: 'https://api.siliconflow.cn/v1',
    models: ['Pro/deepseek-ai/DeepSeek-V3'],
    defaultModel: 'Pro/deepseek-ai/DeepSeek-V3',
    apiKey: SILICONFLOW_API_KEY,
    enabled: !!SILICONFLOW_API_KEY,
    provider: 'siliconflow'
  },
  
  /**
   * 自定义API模型配置
   * @type {ModelConfig}
   */
  custom: {
    name: 'Custom',
    baseURL: CUSTOM_API_BASE_URL,
    models: [CUSTOM_API_MODEL || 'custom-model'],
    defaultModel: CUSTOM_API_MODEL || 'custom-model',
    apiKey: CUSTOM_API_KEY,
    enabled: !!CUSTOM_API_KEY && !!CUSTOM_API_BASE_URL,
    provider: 'custom'
  }
}; 