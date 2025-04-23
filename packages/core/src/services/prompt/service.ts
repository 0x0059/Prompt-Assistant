/**
 * @file service.ts
 * @description 提示词服务实现，提供提示词优化、迭代和测试等核心功能
 * @module @prompt-assistant/core/services/prompt
 * @author Moyu.la
 */

import { IPromptService } from './types';
import { Message, StreamHandlers } from '../llm/types';
import { PromptRecord } from '../history/types';
import { ModelManager, modelManager as defaultModelManager } from '../model/manager';
import { LLMService, createLLMService } from '../llm/service';
import { TemplateManager, templateManager as defaultTemplateManager } from '../template/manager';
import { HistoryManager, historyManager as defaultHistoryManager } from '../history/manager';
import { OptimizationError, IterationError, TestError, ServiceDependencyError } from './errors';
import { ERROR_MESSAGES } from '../llm/errors';

/**
 * 提示词服务实现类
 * @class PromptService
 * @description 提供提示词优化、迭代和测试等核心功能的服务类
 * @implements {IPromptService}
 * 
 * @example
 * const service = createPromptService();
 * 
 * // 优化提示词
 * const optimizedPrompt = await service.optimizePrompt(
 *   '原始提示词',
 *   'gpt-4'
 * );
 * 
 * // 迭代提示词
 * const iteratedPrompt = await service.iteratePrompt(
 *   '原始提示词',
 *   '迭代输入',
 *   'gpt-4'
 * );
 */
export class PromptService implements IPromptService {
  /**
   * 创建提示词服务实例
   * @constructor
   * @param {ModelManager} modelManager - 模型管理器实例
   * @param {LLMService} llmService - LLM服务实例
   * @param {TemplateManager} templateManager - 模板管理器实例
   * @param {HistoryManager} historyManager - 历史记录管理器实例
   * @throws {ServiceDependencyError} 当依赖服务未初始化时抛出
   */
  constructor(
    private modelManager: ModelManager,
    private llmService: LLMService,
    private templateManager: TemplateManager,
    private historyManager: HistoryManager
  ) {
    this.checkDependencies();
  }

  /**
   * 检查依赖服务是否已初始化
   * @private
   * @throws {ServiceDependencyError} 当任何依赖服务未初始化时抛出
   */
  private checkDependencies() {
    if (!this.modelManager) {
      throw new ServiceDependencyError('模型管理器未初始化', 'ModelManager');
    }
    if (!this.llmService) {
      throw new ServiceDependencyError('LLM服务未初始化', 'LLMService');
    }
    if (!this.templateManager) {
      throw new ServiceDependencyError('提示词管理器未初始化', 'TemplateManager');
    }
    if (!this.historyManager) {
      throw new ServiceDependencyError('历史记录管理器未初始化', 'HistoryManager');
    }
  }

  /**
   * 验证输入参数
   * @private
   * @param {string} prompt - 提示词内容
   * @param {string} modelKey - 模型标识
   * @throws {OptimizationError} 当输入参数无效时抛出
   */
  private validateInput(prompt: string, modelKey: string) {
    if (!prompt?.trim()) {
      throw new OptimizationError(
        `${ERROR_MESSAGES.OPTIMIZATION_FAILED}: ${ERROR_MESSAGES.EMPTY_INPUT}`,
        prompt
      );
    }

    if (!modelKey?.trim()) {
      throw new OptimizationError(
        `${ERROR_MESSAGES.OPTIMIZATION_FAILED}: ${ERROR_MESSAGES.MODEL_KEY_REQUIRED}`,
        prompt
      );
    }
  }

  /**
   * 验证LLM响应
   * @private
   * @param {string} response - LLM响应内容
   * @param {string} prompt - 原始提示词
   * @throws {OptimizationError} 当响应无效时抛出
   */
  private validateResponse(response: string, prompt: string) {
    if (!response?.trim()) {
      throw new OptimizationError('优化失败: LLM服务返回结果为空', prompt);
    }
  }

  /**
   * 优化提示词
   * @param {string} prompt - 要优化的提示词
   * @param {string} modelKey - 使用的模型标识
   * @returns {Promise<string>} 优化后的提示词
   * @throws {OptimizationError} 当优化失败时抛出
   */
  async optimizePrompt(prompt: string, modelKey: string): Promise<string> {
    try {
      this.validateInput(prompt, modelKey);
      
      // 获取模型配置（使用统一错误）
      const modelConfig = this.modelManager.getModel(modelKey);
      if (!modelConfig) {
        throw new OptimizationError(
          `${ERROR_MESSAGES.OPTIMIZATION_FAILED}: ${ERROR_MESSAGES.MODEL_NOT_FOUND}`,
          prompt
        );
      }

      // 获取优化提示词
      let template;
      try {
        template = this.templateManager.getTemplate('general-optimize');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new OptimizationError(`优化失败: ${errorMessage}`, prompt);
      }

      if (!template?.content) {
        throw new OptimizationError('优化失败: 提示词不存在或无效', prompt);
      }

      // 构建消息
      const messages: Message[] = [
        { role: 'system', content: template.content },
        { role: 'user', content: prompt }
      ];

      // 发送请求
      const result = await this.llmService.sendMessage(messages, modelKey);

      // 验证响应
      this.validateResponse(result, prompt);

      // 保存历史记录
      this.historyManager.addRecord({
        id: Date.now().toString(),
        originalPrompt: prompt,
        optimizedPrompt: result,
        type: 'optimize',
        chainId: Date.now().toString(),
        version: 1,
        timestamp: Date.now(),
        modelKey,
        templateId: 'optimize'
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new OptimizationError(`优化失败: ${errorMessage}`, prompt);
    }
  }

  /**
   * 迭代提示词
   * @param {string} originalPrompt - 原始提示词
   * @param {string} iterateInput - 迭代输入
   * @param {string} modelKey - 使用的模型标识
   * @returns {Promise<string>} 迭代后的提示词
   * @throws {IterationError} 当迭代失败时抛出
   */
  async iteratePrompt(
    originalPrompt: string,
    iterateInput: string,
    modelKey: string
  ): Promise<string> {
    try {
      this.validateInput(originalPrompt, modelKey);
      this.validateInput(iterateInput, modelKey);
      
      // 获取模型配置
      const modelConfig = this.modelManager.getModel(modelKey);
      if (!modelConfig) {
        throw new ServiceDependencyError('模型不存在', 'ModelManager');
      }

      // 获取迭代提示词
      let template;
      try {
        template = await this.templateManager.getTemplate('iterate');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new IterationError(`迭代失败: ${errorMessage}`, originalPrompt, iterateInput);
      }

      if (!template?.content) {
        throw new IterationError('迭代失败: 提示词不存在或无效', originalPrompt, iterateInput);
      }

      // 构建消息
      const messages: Message[] = [
        { role: 'system', content: template.content },
        { role: 'user', content: `原始提示词：${originalPrompt}\n\n优化需求：${iterateInput}` }
      ];

      // 发送请求
      const result = await this.llmService.sendMessage(messages, modelKey);

      // 保存历史记录
      this.historyManager.addRecord({
        id: Date.now().toString(),
        originalPrompt: iterateInput,
        optimizedPrompt: result,
        type: 'iterate',
        chainId: originalPrompt,
        version: 1,
        previousId: originalPrompt,
        timestamp: Date.now(),
        modelKey,
        templateId: 'iterate'
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new IterationError(`迭代失败: ${errorMessage}`, originalPrompt, iterateInput);
    }
  }

  /**
   * 测试提示词
   * @param {string} prompt - 要测试的提示词
   * @param {string} testInput - 测试输入
   * @param {string} modelKey - 使用的模型标识
   * @returns {Promise<string>} 测试结果
   * @throws {TestError} 当测试失败时抛出
   */
  async testPrompt(prompt: string, testInput: string, modelKey: string): Promise<string> {
    try {
      this.validateInput(prompt, modelKey);
      this.validateInput(testInput, modelKey);

      // 获取模型配置
      const modelConfig = this.modelManager.getModel(modelKey);
      if (!modelConfig) {
        throw new ServiceDependencyError('模型不存在', 'ModelManager');
      }

      // 构建消息
      const messages: Message[] = [
        { role: 'system', content: prompt },
        { role: 'user', content: testInput }
      ];

      // 发送请求
      const result = await this.llmService.sendMessage(messages, modelKey);

      // 保存历史记录
      this.historyManager.addRecord({
        id: Date.now().toString(),
        originalPrompt: prompt,
        optimizedPrompt: result,
        type: 'optimize',
        chainId: prompt,
        version: 1,
        timestamp: Date.now(),
        modelKey,
        templateId: 'test'
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new TestError(`测试失败: ${errorMessage}`, prompt, testInput);
    }
  }

  /**
   * 获取历史记录
   * @returns {PromptRecord[]} 提示词历史记录列表
   */
  getHistory(): PromptRecord[] {
    return this.historyManager.getRecords();
  }

  /**
   * 获取迭代链
   * @param {string} recordId - 记录ID
   * @returns {PromptRecord[]} 迭代链记录列表
   */
  getIterationChain(recordId: string): PromptRecord[] {
    return this.historyManager.getIterationChain(recordId);
  }

  /**
   * 流式测试提示词
   * @param {string} prompt - 要测试的提示词
   * @param {string} testInput - 测试输入
   * @param {string} modelKey - 使用的模型标识
   * @param {Object} callbacks - 回调函数
   * @param {Function} callbacks.onToken - 收到token时的回调
   * @param {Function} callbacks.onComplete - 完成时的回调
   * @param {Function} callbacks.onError - 发生错误时的回调
   * @returns {Promise<void>}
   * @throws {TestError} 当测试失败时抛出
   */
  async testPromptStream(
    prompt: string,
    testInput: string,
    modelKey: string,
    callbacks: {
      onToken: (token: string) => void;
      onComplete: () => void;
      onError: (error: Error) => void;
    }
  ): Promise<void> {
    try {
      this.validateInput(prompt, modelKey);
      this.validateInput(testInput, modelKey);

      const modelConfig = this.modelManager.getModel(modelKey);
      if (!modelConfig) {
        throw new ServiceDependencyError('模型不存在', 'ModelManager');
      }

      const messages: Message[] = [
        { role: 'system', content: prompt },
        { role: 'user', content: testInput }
      ];

      await this.llmService.sendMessageStream(messages, modelKey, callbacks);
      
      // 移除历史记录相关操作
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new TestError(`测试失败: ${errorMessage}`, prompt, testInput);
    }
  }

  /**
   * 流式优化提示词
   * @param {string} prompt - 要优化的提示词
   * @param {string} modelKey - 使用的模型标识
   * @param {string} template - 优化模板
   * @param {Object} callbacks - 回调函数
   * @param {Function} callbacks.onToken - 收到token时的回调
   * @param {Function} callbacks.onComplete - 完成时的回调
   * @param {Function} callbacks.onError - 发生错误时的回调
   * @returns {Promise<void>}
   * @throws {OptimizationError} 当优化失败时抛出
   */
  async optimizePromptStream(
    prompt: string,
    modelKey: string,
    template: string,
    callbacks: {
      onToken: (token: string) => void;
      onComplete: () => void;
      onError: (error: Error) => void;
    }
  ): Promise<void> {
    try {
      this.validateInput(prompt, modelKey);
      
      // 获取模型配置
      const modelConfig = this.modelManager.getModel(modelKey);
      if (!modelConfig) {
        throw new OptimizationError(
          `${ERROR_MESSAGES.OPTIMIZATION_FAILED}: ${ERROR_MESSAGES.MODEL_NOT_FOUND}`,
          prompt
        );
      }

      // 构建消息
      const messages: Message[] = [
        { role: 'system', content: template },
        { role: 'user', content: prompt }
      ];

      // 使用流式调用
      let result = '';
      await this.llmService.sendMessageStream(
        messages,
        modelKey,
        {
          onToken: (token) => {
            result += token;
            callbacks.onToken(token);
          },
          onComplete: () => {
            // 验证响应
            this.validateResponse(result, prompt);
            callbacks.onComplete();
          },
          onError: callbacks.onError
        }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new OptimizationError(`优化失败: ${errorMessage}`, prompt);
    }
  }

  /**
   * 流式迭代提示词
   * @param {string} originalPrompt - 原始提示词
   * @param {string} iterateInput - 迭代输入
   * @param {string} modelKey - 使用的模型标识
   * @param {StreamHandlers} handlers - 流式处理回调
   * @param {Object | string} template - 迭代模板
   * @returns {Promise<void>}
   * @throws {IterationError} 当迭代失败时抛出
   */
  async iteratePromptStream(
    originalPrompt: string,
    iterateInput: string,
    modelKey: string,
    handlers: StreamHandlers,
    template: { content: string } | string
  ): Promise<void> {
    try {
      this.validateInput(originalPrompt, modelKey);
      this.validateInput(iterateInput, modelKey);
      
      // 获取模型配置
      const modelConfig = this.modelManager.getModel(modelKey);
      if (!modelConfig) {
        throw new ServiceDependencyError('模型不存在', 'ModelManager');
      }

      // 获取迭代提示词
      let templateContent: string;
      if (typeof template === 'string') {
        templateContent = template;
      } else if (template && typeof template.content === 'string') {
        templateContent = template.content;
      } else {
        throw new IterationError('迭代失败: 未提供有效的提示词模板', originalPrompt, iterateInput);
      }

      // 构建消息
      const messages: Message[] = [
        {
          role: 'system',
          content: templateContent
        },
        { role: 'user', content: `原始提示词：${originalPrompt}\n\n优化需求：${iterateInput}` }
      ];

      // 使用流式调用
      let result = '';
      await this.llmService.sendMessageStream(
        messages,
        modelKey,
        {
          onToken: (token) => {
            result += token;
            handlers.onToken(token);
          },
          onComplete: () => {
            handlers.onComplete();
          },
          onError: handlers.onError
        }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new IterationError(`迭代失败: ${errorMessage}`, originalPrompt, iterateInput);
    }
  }
}

/**
 * 创建提示词服务实例的工厂函数
 * 
 * @function createPromptService
 * @description 创建一个新的提示词服务实例，自动处理依赖注入，若未指定参数则使用默认实例
 * 
 * @param {ModelManager} [modelManager=defaultModelManager] - 模型管理器实例，默认使用全局单例
 * @param {LLMService} [llmService=createLLMService(modelManager)] - LLM服务实例，默认创建新实例
 * @param {TemplateManager} [templateManager=defaultTemplateManager] - 模板管理器实例，默认使用全局单例
 * @param {HistoryManager} [historyManager=defaultHistoryManager] - 历史记录管理器实例，默认使用全局单例
 * @returns {PromptService} 新创建的提示词服务实例
 * 
 * @example
 * // 使用所有默认依赖创建
 * const service = createPromptService();
 * 
 * // 使用自定义模型管理器
 * const customModelManager = new ModelManager();
 * const service = createPromptService(customModelManager);
 * 
 * // 完全自定义所有依赖
 * const service = createPromptService(
 *   customModelManager,
 *   customLLMService,
 *   customTemplateManager,
 *   customHistoryManager
 * );
 */
export function createPromptService(
  modelManager: ModelManager = defaultModelManager,
  llmService: LLMService = createLLMService(modelManager),
  templateManager: TemplateManager = defaultTemplateManager,
  historyManager: HistoryManager = defaultHistoryManager
): PromptService {
  return new PromptService(
    modelManager,
    llmService,
    templateManager,
    historyManager
  );
} 
