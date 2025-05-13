/**
 * @file utils/extractors.ts
 * @description 提取器向后兼容性导出
 * @deprecated 请使用 services/llm/extractors 中的导出
 */

import { ThoughtExtractor } from '../services/llm/extractors/base/thoughtExtractor';
import { DeepSeekThoughtExtractor } from '../services/llm/extractors/providers/deepseekThoughtExtractor';

export { 
  ThoughtExtractor,
  DeepSeekThoughtExtractor
}; 