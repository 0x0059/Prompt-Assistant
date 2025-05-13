/**
 * @file handlers/openaiHandler.ts
 * @description OpenAI流式响应处理器，处理OpenAI及兼容API的流式响应数据
 */
import { StreamHandlers } from '../types';
import { ThoughtExtractor } from '../extractors/base/thoughtExtractor';

/**
 * OpenAI流式响应处理器
 * @class OpenAIHandler
 * @description 处理OpenAI及兼容API的流式响应数据
 */
export class OpenAIHandler {
  private readonly thoughtExtractor: ThoughtExtractor;
  
  /**
   * 创建流式处理器实例
   * @param {ThoughtExtractor} thoughtExtractor - 思考过程提取器
   */
  constructor(thoughtExtractor: ThoughtExtractor) {
    this.thoughtExtractor = thoughtExtractor;
  }
  
  /**
   * 处理流式响应中的思考工具调用
   * @param {any} chunk - 响应数据块
   * @param {StreamHandlers} callbacks - 回调函数
   * @param {object} state - 状态对象
   * @param {boolean} isDeepSeekProvider - 是否为DeepSeek提供商
   * @param {boolean} supportsToolCalling - 是否支持工具调用
   * @returns {boolean} 是否已处理
   */
  public handleThinkingToolCall(
    chunk: any, 
    callbacks: StreamHandlers, 
    state: { isThinking: boolean, thoughts: string },
    isDeepSeekProvider: boolean,
    supportsToolCalling: boolean
  ): boolean {
    if (!isDeepSeekProvider || !supportsToolCalling) {
      return false;
    }
    
    if (chunk.choices[0]?.delta?.tool_calls && 
        chunk.choices[0].delta.tool_calls.length > 0) {
      
      state.isThinking = true;
      const toolCallChunk = chunk.choices[0].delta.tool_calls[0];
      
      if (toolCallChunk && toolCallChunk.function && toolCallChunk.function.arguments) {
        state.thoughts += toolCallChunk.function.arguments;
        
        try {
          const parsedThoughts = JSON.parse(state.thoughts);
          if (parsedThoughts.thoughts) {
            callbacks.onToken(`思考中: ${parsedThoughts.thoughts}\n`);
          }
        } catch (e) {
          // 忽略不完整的JSON解析错误
        }
      }
      
      return true;
    }
    
    return false;
  }
  
  /**
   * 处理流式响应中的推理模型输出
   * @param {any} chunk - 响应数据块
   * @param {StreamHandlers} callbacks - 回调函数
   * @param {object} state - 状态对象
   * @param {boolean} isReasonerModel - 是否为推理模型
   * @returns {boolean} 是否已处理
   */
  public handleReasonerOutput(
    chunk: any, 
    callbacks: StreamHandlers, 
    state: { 
      reasonerBuffer: string, 
      inThinkingBlock: boolean, 
      hasOutputThinking: boolean,
      thoughtsContent: string 
    },
    isReasonerModel: boolean
  ): boolean {
    if (!isReasonerModel) {
      return false;
    }
    
    const content = chunk.choices[0]?.delta?.content || '';
    if (!content) {
      return false;
    }
    
    state.reasonerBuffer += content;
    
    // 检测思考代码块开始
    if (!state.inThinkingBlock && state.reasonerBuffer.includes('```thinking')) {
      state.inThinkingBlock = true;
      const thinkingStart = state.reasonerBuffer.indexOf('```thinking') + '```thinking'.length;
      state.reasonerBuffer = state.reasonerBuffer.substring(thinkingStart);
      
      if (!state.hasOutputThinking) {
        callbacks.onToken('思考过程:\n');
        state.hasOutputThinking = true;
      }
      return true;
    }
    
    // 检测思考代码块结束
    if (state.inThinkingBlock && state.reasonerBuffer.includes('```')) {
      state.inThinkingBlock = false;
      
      const thinkingEnd = state.reasonerBuffer.indexOf('```');
      state.thoughtsContent = state.reasonerBuffer.substring(0, thinkingEnd);
      
      state.reasonerBuffer = state.reasonerBuffer.substring(thinkingEnd + 3);
      
      callbacks.onToken('\n\n最终回答:\n');
      
      if (state.reasonerBuffer.trim()) {
        callbacks.onToken(state.reasonerBuffer);
        state.reasonerBuffer = '';
      }
      return true;
    }
    
    // 处理思考块内的内容
    if (state.inThinkingBlock) {
      callbacks.onToken(content);
      return true;
    }
    
    // 处理思考块前的内容(不输出)
    if (!state.hasOutputThinking && !state.inThinkingBlock) {
      return true;
    }
    
    // 处理最终答案
    callbacks.onToken(content);
    return true;
  }
  
  /**
   * 处理普通流式响应内容
   * @param {any} chunk - 响应数据块
   * @param {StreamHandlers} callbacks - 回调函数
   * @param {object} state - 状态对象
   */
  public async handleRegularContent(
    chunk: any, 
    callbacks: StreamHandlers, 
    state: { isThinking: boolean, thoughts: string }
  ): Promise<void> {
    const content = chunk.choices[0]?.delta?.content || '';
    if (!content) {
      return;
    }
    
    // 如果之前有思考过程，在第一个内容块前加上分隔符
    if (state.isThinking && state.thoughts && !content.trim().startsWith('思考过程:')) {
      callbacks.onToken('\n最终回答:\n');
      state.isThinking = false;
    }
    
    callbacks.onToken(content);
    await this.smallDelay();
  }
  
  /**
   * 小延迟，用于流式响应时让UI有时间更新
   * @private
   * @returns {Promise<void>}
   */
  private async smallDelay(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
} 