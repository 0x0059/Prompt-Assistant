import { Template, TemplateMetadata } from './types';
import {
  GENERAL_OPTIMIZE_TEMPLATE,
  OUTPUT_FORMAT_OPTIMIZE_TEMPLATE,
  ADVANCED_OPTIMIZE_TEMPLATE,
  ITERATE_TEMPLATE,
  STRUCTURED_FORMAT_TEMPLATE,
  KEN_TEMPLATE, 
} from './templates';

/**
 * 模板类型常量
 */
export const TEMPLATE_TYPES = {
  OPTIMIZE: 'optimize' as const,
  ITERATE: 'iterate' as const
};

/**
 * 作者常量
 */
export const AUTHORS = {
  SYSTEM: 'System' as const,
  MOYU: 'Moyu.la' as const
};

/**
 * 创建模板元数据
 */
const createMetadata = (
  version: string,
  author: string,
  description: string,
  templateType: 'optimize' | 'iterate'
): TemplateMetadata => ({
  version,
  lastModified: Date.now(),
  author,
  description,
  templateType
});

/**
 * 创建模板
 */
const createTemplate = (
  id: string,
  name: string,
  content: string,
  metadata: TemplateMetadata,
  isBuiltin: boolean = true
): Template => ({
  id,
  name,
  content,
  metadata,
  isBuiltin
});

/**
 * 默认提示词配置
 */
export const DEFAULT_TEMPLATES: Record<string, Template> = {
  'general-optimize': createTemplate(
    'general-optimize',
    '通用优化',
    GENERAL_OPTIMIZE_TEMPLATE,
    createMetadata('1.3.0', AUTHORS.SYSTEM, '通用优化提示词，适用于大多数场景', TEMPLATE_TYPES.OPTIMIZE)
  ),
  'output-format-optimize': createTemplate(
    'output-format-optimize',
    '通用优化-带输出格式要求',
    OUTPUT_FORMAT_OPTIMIZE_TEMPLATE,
    createMetadata('1.3.0', AUTHORS.SYSTEM, '适用于带格式要求的大多数场景', TEMPLATE_TYPES.OPTIMIZE)
  ),
  'advanced-optimize': createTemplate(
    'advanced-optimize',
    '带建议的优化',
    ADVANCED_OPTIMIZE_TEMPLATE,
    createMetadata('2.1.0', AUTHORS.SYSTEM, '带建议的优化提示词，依赖高智能的优化模型', TEMPLATE_TYPES.OPTIMIZE)
  ),
  'iterate': createTemplate(
    'iterate',
    '通用迭代',
    ITERATE_TEMPLATE,
    createMetadata('1.0.0', AUTHORS.SYSTEM, '定向优化的通用提示词', TEMPLATE_TYPES.ITERATE)
  ),
  'structured-format': createTemplate(
    'structured-format',
    '指令型优化',
    STRUCTURED_FORMAT_TEMPLATE,
    createMetadata('1.0', AUTHORS.MOYU, '适用于指令型提示词的优化，优化的同时遵循原指令', TEMPLATE_TYPES.OPTIMIZE)
  ),

  'Ken': createTemplate(
    'Ken',
    '肯尼迪',
    KEN_TEMPLATE,
    createMetadata('1.0', AUTHORS.MOYU, '优化资料', TEMPLATE_TYPES.OPTIMIZE)
  )
}; 
