/**
 * @file providers/index.ts
 * @description 提供商特定思考提取器导出文件
 * @module @prompt-assistant/core/services/llm/extractors/providers
 * 
 * 本模块包含针对特定LLM提供商优化的思考提取器实现。
 * 这些提取器扩展了基础提取器，添加了特定提供商的标记和处理逻辑。
 */

// 导出DeepSeek特定提取器
export { DeepSeekThoughtExtractor } from './deepseekThoughtExtractor'; 