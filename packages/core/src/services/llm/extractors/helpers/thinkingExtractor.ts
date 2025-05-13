/**
 * @file extractors/helpers/thinkingExtractor.ts
 * @description 高级思考过程提取助手，协调不同模型的思考提取
 */
import { Message, ThinkingResponse } from '../../types';
import { ThoughtExtractor } from '../base/thoughtExtractor';

/**
 * 思考过程提取助手
 * @class ThinkingExtractor
 * @description 帮助从不同模型响应中提取思考过程
 */
export class ThinkingExtractor {
  private readonly thoughtExtractor: ThoughtExtractor;
  
  /**
   * 创建思考过程提取助手实例
   * @param {ThoughtExtractor} thoughtExtractor - 基础思考提取器
   */
  constructor(thoughtExtractor: ThoughtExtractor) {
    this.thoughtExtractor = thoughtExtractor;
  }
  
  /**
   * 处理包含思考过程的响应
   * @param {any} response - API响应
   * @param {boolean} isDeepSeek - 是否为DeepSeek提供商
   * @param {boolean} supportsTools - 是否支持工具调用
   * @param {boolean} isReasoner - 是否为推理模型
   * @returns {string} 格式化后的响应文本
   */
  public processResponseWithThinking(
    response: any, 
    isDeepSeek: boolean, 
    supportsTools: boolean, 
    isReasoner: boolean
  ): string {
    // 处理思考过程 - 通过Function Calling
    if (isDeepSeek && supportsTools && 
        response.choices[0]?.message?.tool_calls && 
        response.choices[0].message.tool_calls.length > 0) {
      
      const toolCall = response.choices[0].message.tool_calls[0];
      if (toolCall && toolCall.function && toolCall.function.name === "thinking") {
        try {
          const argumentsStr = toolCall.function.arguments || '{}';
          const parsed = JSON.parse(argumentsStr);
          const thoughts = parsed.thoughts;
          
          if (thoughts) {
            return `思考过程:\n${thoughts}\n\n最终回答:\n${response.choices[0].message.content || ''}`;
          }
        } catch (error) {
          console.error('解析思考过程时出错:', error);
        }
      }
    }
    
    // 处理思考过程 - 通过解析推理模型输出
    if (isReasoner) {
      const content = response.choices[0].message.content || '';
      const extractResult = this.thoughtExtractor.extract(content);
      
      if (extractResult.thinking) {
        return `思考过程:\n${extractResult.thinking}\n\n最终回答:\n${extractResult.answer || content}`;
      }
    }
    
    return response.choices[0].message.content || '';
  }
  
  /**
   * 从推理模型获取思考过程
   * @param {any} openai - OpenAI API实例
   * @param {string} model - 模型名称
   * @param {Message[]} messages - 消息列表
   * @param {number} temperature - 温度参数
   * @param {number} maxTokens - 最大令牌数
   * @returns {Promise<ThinkingResponse>} 思考响应
   */
  public async getThinkingFromReasoner(
    openai: any,
    model: string,
    messages: Message[],
    temperature: number = 0.7,
    maxTokens: number = 1024
  ): Promise<ThinkingResponse> {
    const response = await openai.chat.completions.create({
      model: model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: temperature,
      max_tokens: maxTokens,
    });
    
    // 检查API是否直接返回思考过程
    if (response.choices[0].message && 'reasoning_content' in response.choices[0].message) {
      const result: ThinkingResponse = {
        // @ts-ignore - 忽略类型错误，因为API可能返回未在类型定义中的字段
        thinking: response.choices[0].message.reasoning_content || null,
        content: response.choices[0].message.content || ''
      };
      return result;
    }
    
    // 如果API没有直接返回思考过程，使用提取器
    return this.fallbackExtractThinking(response.choices[0].message.content || '');
  }
  
  /**
   * 从工具调用获取思考过程
   * @param {any} openai - OpenAI API实例
   * @param {string} model - 模型名称
   * @param {Message[]} messages - 消息列表
   * @param {any[]} tools - 思考工具定义
   * @param {number} temperature - 温度参数
   * @param {number} maxTokens - 最大令牌数
   * @returns {Promise<ThinkingResponse>} 思考响应
   */
  public async getThinkingFromToolCall(
    openai: any,
    model: string,
    messages: Message[],
    tools: any[],
    temperature: number = 0.7,
    maxTokens: number = 1024
  ): Promise<ThinkingResponse> {
    const response = await openai.chat.completions.create({
      model: model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      tools: tools,
      temperature: temperature,
      max_tokens: maxTokens,
    });
    
    const responseMessage = response.choices[0].message;
    
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      // 模型使用了思考工具
      const thinkingTool = responseMessage.tool_calls.find(
        (tool: any) => tool.function.name === 'thinking'
      );
      
      if (thinkingTool) {
        try {
          const thinkingContent = JSON.parse(thinkingTool.function.arguments);
          return {
            thinking: thinkingContent.thoughts,
            content: responseMessage.content || ''
          };
        } catch (error) {
          console.warn('解析思考内容失败', error);
        }
      }
    }
    
    // 没有找到思考工具调用
    return {
      thinking: null,
      content: responseMessage.content || ''
    };
  }
  
  /**
   * 回退方法：从返回内容中提取思考过程
   * @param {string} content - 内容文本
   * @returns {ThinkingResponse} 包含思考过程的响应
   */
  public fallbackExtractThinking(content: string): ThinkingResponse {
    // 使用思考提取器获取结果
    const extractResult = this.thoughtExtractor.extract(content);
    
    return {
      thinking: extractResult.thinking,
      content: extractResult.answer || content
    };
  }
} 