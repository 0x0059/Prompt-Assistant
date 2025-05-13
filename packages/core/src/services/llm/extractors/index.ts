/**
 * @file extractors/index.ts
 * @description 提取器模块导出文件
 * @module @prompt-assistant/core/services/llm/extractors
 * 
 * 本模块提供用于从LLM响应中提取思考过程和答案的工具。
 * 包含基础提取器、特定提供商的优化实现以及高级助手类。
 * 
 * 主要组件：
 * - ThoughtExtractor: 基础思考提取器，支持各种标记格式
 * - DeepSeekThoughtExtractor: 针对DeepSeek模型优化的提取器
 * - ThinkingExtractor: 高级思考提取助手，协调不同提取方法
 * 
 * @example
 * // 基本使用
 * import { ThoughtExtractor } from '@prompt-assistant/core/services/llm/extractors';
 * const extractor = new ThoughtExtractor();
 * const { thinking, answer } = extractor.extract(modelOutput);
 */

/**
 * @module Extractors
 * @description 这个模块包含用于从LLM响应中提取思考过程和答案的工具。
 * 
 * 主要组件:
 * - ThoughtExtractor: 基础提取器，用于从文本中提取思考过程和答案
 * - DeepSeekThoughtExtractor: 专门针对DeepSeek模型输出的提取器
 * - ThinkingExtractor: 用于处理完整API响应的高级提取器
 * 
 * 基本用法示例:
 * ```typescript
 * import { ThoughtExtractor } from './extractors';
 * 
 * const extractor = new ThoughtExtractor();
 * const result = extractor.extract(modelOutput);
 * console.log(result.thinking); // 提取的思考过程
 * console.log(result.answer); // 提取的答案
 * ```
 */

// 导出接口/类型
export type { ThoughtExtractionResult } from './base';
export type { ThinkingResponse } from './helpers';

// 从子目录导出修订后的命名导出
export { ThoughtExtractor } from './base/thoughtExtractor';
export { DeepSeekThoughtExtractor } from './providers/deepseekThoughtExtractor';
export { ThinkingExtractor } from './helpers/thinkingExtractor';

// 标记为废弃的导出，保持向后兼容性
/** @deprecated 请使用命名导出 */
export * from './base/thoughtExtractor';
/** @deprecated 请使用命名导出 */
export * from './providers/deepseekThoughtExtractor';
/** @deprecated 请使用命名导出 */
export * from './helpers/thinkingExtractor'; 