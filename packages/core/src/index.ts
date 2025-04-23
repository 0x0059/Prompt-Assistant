/**
 * @file index.ts
 * @description 核心模块导出文件，集中导出所有服务和实用工具
 * @module @prompt-assistant/core
 * @author Moyu.la
 */

/**
 * 模板服务相关导出
 * @namespace Template
 * @description 提供模板管理功能，包括模板的增删改查、分类和版本控制
 */
export { TemplateManager, templateManager } from './services/template/manager'
export * from './services/template/types'
export * from './services/template/defaults'
export * from './services/template/errors'

/**
 * 历史记录服务相关导出
 * @namespace History
 * @description 提供历史记录管理功能，包括记录的存储、检索和链式查询
 */
export { HistoryManager, historyManager } from './services/history/manager'
export * from './services/history/types'
export * from './services/history/errors'

/**
 * 大语言模型服务相关导出
 * @namespace LLM
 * @description 提供与各种大语言模型的交互功能，支持OpenAI、Gemini等主流模型
 */
export { LLMService, createLLMService } from './services/llm/service'
export * from './services/llm/types'
export * from './services/llm/errors'

/**
 * 模型管理相关导出
 * @namespace Model
 * @description 提供AI模型配置管理功能，包括API密钥、默认参数和模型选择
 */
export { ModelManager, modelManager } from './services/model/manager'
export * from './services/model/types'
export * from './services/model/defaults'

/**
 * 提示词服务相关导出
 * @namespace Prompt
 * @description 提供提示词优化、测试和迭代功能的核心服务
 */
export { PromptService, createPromptService } from './services/prompt/service'
export * from './services/prompt/types'
export * from './services/prompt/errors'

/**
 * 环境工具函数导出
 * @namespace Environment
 * @description 提供环境检测和工具函数，用于处理不同运行环境下的差异
 */
export {
  isBrowser,          // 检测是否在浏览器环境
  isVercel,           // 检测是否在Vercel部署环境
  getProxyUrl,        // 获取API代理URL
  checkVercelApiAvailability,  // 异步检测Vercel API可用性
  resetVercelStatusCache       // 重置Vercel环境检测缓存
} from './utils/environment';