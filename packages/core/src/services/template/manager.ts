/**
 * @file manager.ts
 * @description 提示词模板管理器实现，提供模板的增删改查、导入导出和持久化存储功能
 * @module @prompt-assistant/core/services/template
 * @author Prompt Assistant Team
 */

import { ITemplateManager, Template, TemplateManagerConfig, templateSchema } from './types';
import { DEFAULT_TEMPLATES } from './defaults';
import { TemplateError, TemplateValidationError } from './errors';

/**
 * 提示词模板管理器
 * @class TemplateManager
 * @description 管理提示词模板的核心类，提供模板的增删改查、导入导出等功能
 * @implements {ITemplateManager}
 * 
 * @example
 * const manager = new TemplateManager({
 *   storageKey: 'custom:templates',
 *   cacheTimeout: 10 * 60 * 1000
 * });
 * 
 * // 获取模板
 * const template = manager.getTemplate('template-id');
 * 
 * // 保存模板
 * manager.saveTemplate({
 *   id: 'new-template',
 *   content: '模板内容',
 *   metadata: {
 *     templateType: 'optimize',
 *     description: '模板描述'
 *   }
 * });
 */
export class TemplateManager implements ITemplateManager {
  /**
   * 内置模板集合
   * @private
   * @type {Map<string, Template>}
   */
  private readonly builtinTemplates: Map<string, Template>;
  
  /**
   * 用户自定义模板集合
   * @private
   * @type {Map<string, Template>}
   */
  private readonly userTemplates: Map<string, Template>;
  
  /**
   * 模板管理器配置
   * @private
   * @type {Required<TemplateManagerConfig>}
   */
  private readonly config: Required<TemplateManagerConfig>;

  /**
   * 创建模板管理器实例
   * @constructor
   * @param {TemplateManagerConfig} [config] - 配置选项
   * @throws {TemplateError} 初始化失败时抛出
   */
  constructor(config?: TemplateManagerConfig) {
    this.builtinTemplates = new Map();
    this.userTemplates = new Map();
    this.config = {
      storageKey: 'app:templates',
      cacheTimeout: 5 * 60 * 1000,
      ...config
    };

    // 在构造函数中执行初始化
    this.init();
  }

  /**
   * 初始化模板管理器
   * @private
   * @description 加载内置模板和用户模板，并进行必要的验证
   * @throws {TemplateError} 初始化失败时抛出
   */
  private init(): void {
    try {
      // 需要先清空已有提示词避免重复加载
      this.builtinTemplates.clear();
      this.userTemplates.clear();

      // 加载内置提示词需要深拷贝避免引用问题
      for (const [id, template] of Object.entries(DEFAULT_TEMPLATES)) {
        this.builtinTemplates.set(id, JSON.parse(JSON.stringify({
          ...template,
          isBuiltin: true
        })));
      }

      // 增加加载后的验证
      if (this.builtinTemplates.size === 0) {
        throw new TemplateError('内置提示词加载失败');
      }

      this.loadUserTemplates();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('模板管理器初始化失败:', errorMessage);
      throw new TemplateError(`初始化失败: ${errorMessage}`);
    }
  }

  /**
   * 获取指定ID的模板
   * @param {string} templateId - 模板ID
   * @returns {Template} 模板对象
   * @throws {TemplateError} 模板不存在或ID无效时抛出
   */
  getTemplate(templateId: string): Template {
    // 增加空值校验
    if (!templateId || typeof templateId !== 'string') {
      throw new TemplateError('无效的提示词ID');
    }

    // 优先检查用户提示词
    const template = this.userTemplates.get(templateId) || 
                    this.builtinTemplates.get(templateId);
    
    if (!template) {
      // 增加调试信息
      console.error(`提示词 ${templateId} 不存在， 可用提示词:`, [...this.builtinTemplates.keys(), ...this.userTemplates.keys()]);
      throw new TemplateError(`提示词 ${templateId} 不存在`);
    }
    
    // 返回深拷贝避免外部修改
    return JSON.parse(JSON.stringify(template));
  }

  /**
   * 保存用户模板
   * @param {Template} template - 要保存的模板对象
   * @throws {TemplateValidationError} 模板验证失败时抛出
   * @throws {TemplateError} 保存失败时抛出
   */
  saveTemplate(template: Template): void {
    // 增加类型校验
    if (!['optimize', 'iterate'].includes(template.metadata.templateType)) {
      throw new TemplateValidationError('无效的提示词类型');
    }

    // 增加ID格式校验
    if (!/^[a-zA-Z0-9_-]{3,50}$/.test(template.id)) {
      throw new TemplateValidationError('提示词ID格式无效（3-50位字母数字）');
    }

    // 保留原始提示词的不可变属性
    if (this.userTemplates.has(template.id)) {
      const original = this.userTemplates.get(template.id)!;
      template = {
        ...original,
        ...template,
        metadata: {
          ...original.metadata,
          ...template.metadata,
          lastModified: Date.now()
        }
      };
    }

    // 验证提示词
    const result = templateSchema.safeParse(template);
    if (!result.success) {
      throw new TemplateValidationError(`提示词验证失败: ${result.error.message}`);
    }
      
    // 不允许覆盖内置提示词
    if (this.builtinTemplates.has(template.id)) {
      throw new TemplateError(`不能覆盖内置提示词: ${template.id}`);
    }

    // 只在没有时间戳时设置
    if (!template.metadata.lastModified) {
      template.metadata.lastModified = Date.now();
    }
    
    // 保存提示词
    this.userTemplates.set(template.id, { ...template, isBuiltin: false });
    this.persistUserTemplates();
  }

  /**
   * 删除用户模板
   * @param {string} templateId - 要删除的模板ID
   * @throws {TemplateError} 模板不存在或删除失败时抛出
   */
  deleteTemplate(templateId: string): void {
    if (this.builtinTemplates.has(templateId)) {
      throw new TemplateError(`不能删除内置提示词: ${templateId}`);
    }

    if (!this.userTemplates.has(templateId)) {
      throw new TemplateError(`提示词不存在: ${templateId}`);
    }

    this.userTemplates.delete(templateId);
    this.persistUserTemplates();
  }

  /**
   * 获取所有模板列表
   * @returns {Template[]} 模板列表
   */
  listTemplates(): Template[] {
    const templates = [
      ...Array.from(this.builtinTemplates.values()),
      ...Array.from(this.userTemplates.values())
    ];
    return templates.sort((a, b) => {
      // 内置提示词排在前面
      if (a.isBuiltin !== b.isBuiltin) {
        return a.isBuiltin ? -1 : 1;
      }
      
      // 非内置提示词按时间戳倒序
      if (!a.isBuiltin && !b.isBuiltin) {
        const timeA = a.metadata.lastModified || 0;
        const timeB = b.metadata.lastModified || 0;
        return timeB - timeA;
      }
      
      // 相同类型按名称排序
      return a.id.localeCompare(b.id);
    });
  }

  /**
   * 将模板导出为JSON字符串
   * @param {string} templateId - 要导出的模板ID
   * @returns {string} 模板的JSON字符串
   * @throws {TemplateError} 模板不存在或导出失败时抛出
   * @description 将指定模板导出为可共享的JSON字符串格式，可用于模板分享
   */
  exportTemplate(templateId: string): string {
    const template = this.getTemplate(templateId);
    try {
      // 移除isBuiltin标记，避免导入时混淆
      const { isBuiltin, ...exportTemplate } = template;
      return JSON.stringify(exportTemplate, null, 2);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new TemplateError(`导出失败: ${errorMessage}`);
    }
  }

  /**
   * 从JSON字符串导入模板
   * @param {string} templateJson - 模板的JSON字符串
   * @throws {TemplateValidationError} JSON解析失败或模板验证失败时抛出
   * @throws {TemplateError} 导入过程中发生其他错误时抛出
   * @description 从JSON字符串导入模板，并保存为用户模板
   */
  importTemplate(templateJson: string): void {
    try {
      const template = JSON.parse(templateJson);
      
      // 增加类型验证
      if (!template || typeof template !== 'object') {
        throw new TemplateValidationError('无效的提示词格式');
      }
      
      // 直接使用saveTemplate来验证和保存
      this.saveTemplate(template as Template);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new TemplateValidationError('JSON解析失败: ' + error.message);
      }
      throw error; // 重新抛出已经是TemplateError的错误
    }
  }

  /**
   * 清除模板缓存
   * @param {string} [templateId] - 要清除缓存的模板ID，不指定则清除所有
   * @description 清除内存中的模板缓存，强制从存储重新加载
   */
  clearCache(templateId?: string): void {
    if (templateId) {
      // 清除单个缓存
      this.userTemplates.delete(templateId);
      this.loadUserTemplates();
    } else {
      // 清除所有缓存
      this.userTemplates.clear();
      this.loadUserTemplates();
    }
  }

  /**
   * 将用户模板持久化到本地存储
   * @private
   * @description 将用户模板序列化并保存到localStorage
   */
  private persistUserTemplates(): void {
    try {
      const templates = Array.from(this.userTemplates.values());
      localStorage.setItem(this.config.storageKey, JSON.stringify(templates));
    } catch (error) {
      console.error('保存用户模板失败:', error);
      // 不抛出错误，避免影响正常流程
    }
  }

  /**
   * 从本地存储加载用户模板
   * @private
   * @description 从localStorage读取用户模板并反序列化
   */
  private loadUserTemplates(): void {
    try {
      const data = localStorage.getItem(this.config.storageKey);
      if (data) {
        const templates = JSON.parse(data) as Template[];
        for (const template of templates) {
          // 标记为非内置模板并保存到Map
          this.userTemplates.set(template.id, {
            ...template,
            isBuiltin: false
          });
        }
      }
    } catch (error) {
      console.error('加载用户模板失败:', error);
      // 不抛出错误，避免影响正常流程
    }
  }

  /**
   * 获取指定类型的模板列表
   * @param {('optimize'|'iterate')} type - 模板类型
   * @returns {Template[]} 指定类型的模板列表
   * @deprecated 使用listTemplatesByType代替
   */
  getTemplatesByType(type: 'optimize' | 'iterate'): Template[] {
    console.warn('getTemplatesByType方法已废弃，请使用listTemplatesByType');
    return this.listTemplatesByType(type);
  }

  /**
   * 获取指定类型的模板列表
   * @param {('optimize'|'iterate')} type - 模板类型
   * @returns {Template[]} 指定类型的模板列表
   * @description 返回所有指定类型的模板，按内置优先、最近修改排序
   */
  listTemplatesByType(type: 'optimize' | 'iterate'): Template[] {
    return this.listTemplates().filter(
      template => template.metadata.templateType === type
    );
  }
}

/**
 * 模板管理器单例
 * @type {TemplateManager}
 * @description 提供全局共享的模板管理器实例
 */
export const templateManager = new TemplateManager(); 