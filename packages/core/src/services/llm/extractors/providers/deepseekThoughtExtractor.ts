/**
 * @file providers/deepseekThoughtExtractor.ts
 * @description DeepSeek特定的思考提取器，专门用于从DeepSeek模型输出中提取思考过程和最终答案
 */
import { ThoughtExtractor, ThoughtExtractionResult } from '../base/thoughtExtractor';

/**
 * DeepSeek思考过程提取器
 * 针对DeepSeek模型的思考过程提取进行了优化
 */
export class DeepSeekThoughtExtractor extends ThoughtExtractor {
  // DeepSeek特有的思考开始标记
  private readonly deepseekStartMarkers = [
    '<thinking>',
    '思考：',
    'Let me think:',
    'Here is my thought process:'
  ];
  
  // DeepSeek特有的思考结束标记
  private readonly deepseekEndMarkers = [
    '</thinking>',
    '\n\n结论：',
    '\n\n因此，',
    '\n\nIn conclusion,'
  ];
  
  // DeepSeek特有的答案标记
  private readonly deepseekAnswerMarkers = [
    '结论：',
    '最终结论：',
    'Conclusion:'
  ];
  
  /**
   * 构造函数
   * 初始化DeepSeek特有的标记
   */
  constructor() {
    super();
    // 由于基类中的标记列表是protected，子类可以访问
  }
  
  /**
   * 从DeepSeek模型输出中提取思考过程和最终答案
   * 重写基类的extract方法，添加DeepSeek模型特定的处理逻辑
   * @param text DeepSeek模型生成的完整文本
   * @returns 包含思考过程和最终答案的对象
   */
  public extract(text: string): ThoughtExtractionResult {
    if (!text || text.trim() === '') {
      return { thinking: null, answer: null };
    }
    
    // 首先尝试使用基类的提取方法
    const baseResult = super.extract(text);
    
    // 如果基类能够提取出思考过程，直接返回结果
    if (baseResult.thinking) {
      return baseResult;
    }
    
    // 如果基类无法提取，尝试使用DeepSeek特有的处理逻辑
    try {
      // 检查是否包含DeepSeek特有的标记
      const startMarker = this.findFirstDeepSeekMarker(text, this.deepseekStartMarkers);
      
      if (!startMarker) {
        return baseResult; // 没有找到DeepSeek特有的开始标记
      }
      
      const startIndex = text.indexOf(startMarker) + startMarker.length;
      
      // 寻找结束标记
      let endIndex = text.length;
      let endMarker = null;
      
      for (const marker of this.deepseekEndMarkers) {
        const markerIndex = text.indexOf(marker, startIndex);
        if (markerIndex !== -1 && markerIndex < endIndex) {
          endIndex = markerIndex;
          endMarker = marker;
        }
      }
      
      // 提取思考过程
      const thinking = text.substring(startIndex, endIndex).trim();
      
      // 提取答案（结束标记之后的内容或者找到答案标记的内容）
      let answer = null;
      
      if (endMarker) {
        const answerStartIndex = this.findDeepSeekAnswerStartIndex(text, endIndex + endMarker.length);
        const answerText = text.substring(answerStartIndex).trim();
        answer = answerText || null;
      }
      
      return { thinking, answer };
    } catch (error) {
      console.error('从DeepSeek输出中提取思考过程时出错:', error);
      return baseResult;
    }
  }
  
  /**
   * 在文本中查找第一个匹配的DeepSeek标记
   * @private
   * @param text 要检查的文本
   * @param markers 标记列表
   * @returns 找到的标记或null
   */
  private findFirstDeepSeekMarker(text: string, markers: string[]): string | null {
    for (const marker of markers) {
      if (text.includes(marker)) {
        return marker;
      }
    }
    return null;
  }
  
  /**
   * 找到DeepSeek答案开始的位置
   * @private
   * @param text 原文本
   * @param defaultStartIndex 默认开始位置
   * @returns 答案开始的索引
   */
  private findDeepSeekAnswerStartIndex(text: string, defaultStartIndex: number): number {
    let answerStartIndex = defaultStartIndex;
    
    // 查找DeepSeek特有的答案标记
    for (const marker of this.deepseekAnswerMarkers) {
      const markerIndex = text.indexOf(marker, defaultStartIndex);
      if (markerIndex !== -1 && markerIndex < defaultStartIndex + 100) {
        return markerIndex + marker.length;
      }
    }
    
    return answerStartIndex;
  }
  
  /**
   * 检查文本是否包含DeepSeek特有的思考过程标记
   * @param text 要检查的文本
   * @returns 是否包含DeepSeek特有的思考过程标记
   */
  public hasDeepSeekMarkers(text: string): boolean {
    // 检查是否包含DeepSeek特有的开始标记
    for (const marker of this.deepseekStartMarkers) {
      if (text.includes(marker)) {
        return true;
      }
    }
    
    // 检查是否包含DeepSeek特有的结束标记
    for (const marker of this.deepseekEndMarkers) {
      if (text.includes(marker)) {
        return true;
      }
    }
    
    return false;
  }
} 