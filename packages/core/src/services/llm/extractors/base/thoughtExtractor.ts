/**
 * @file base/thoughtExtractor.ts
 * @description 基础思考提取器，用于从模型输出中提取思考过程和最终答案
 */

/**
 * 定义思考提取结果接口
 */
export interface ThoughtExtractionResult {
  /**
   * 提取出的思考过程，如果没有找到则为null
   */
  thinking: string | null;
  
  /**
   * 提取出的最终答案，如果没有找到则为null
   */
  answer: string | null;
}

/**
 * 标记对类型定义
 */
interface Markers {
  startMarker: string | null;
  endMarker: string | null;
}

/**
 * 思考过程提取器
 * 用于从模型输出中提取思考过程和最终答案
 */
export class ThoughtExtractor {
  // 支持的思考块开始标记
  protected readonly thinkStartMarkers = [
    '<think>', 
    '```thinking', 
    '```thought',
    '```reasoning',
    'Thinking:',
    '思考过程:'
  ];
  
  // 支持的思考块结束标记
  protected readonly thinkEndMarkers = [
    '</think>', 
    '```',
    '\n\n'  // 针对无明确结束标记但有空行分隔的情况
  ];
  
  // 支持的答案标记
  protected readonly answerMarkers = [
    '最终答案:', 
    '最终回答:', 
    'Answer:', 
    '回答:'
  ];
  
  /**
   * 从文本中提取思考过程和最终答案
   * @param text 模型生成的完整文本
   * @returns 包含思考过程和最终答案的对象
   */
  public extract(text: string): ThoughtExtractionResult {
    if (!text || text.trim() === '') {
      return { thinking: null, answer: null };
    }
    
    try {
      // 尝试识别使用的标记
      const { startMarker, endMarker } = this.detectMarkers(text);
      
      // 未找到任何标记，将整个文本作为答案返回
      if (!startMarker && !endMarker) {
        return { thinking: null, answer: text };
      }
      
      // 处理只有结束标记没有开始标记的情况
      let processedText = text;
      if (endMarker && !startMarker) {
        processedText = `${this.thinkStartMarkers[0]}${text}`;
        const { startMarker: newStartMarker } = this.detectMarkers(processedText);
        
        // 处理添加开始标记后仍无法找到的情况
        if (!newStartMarker) {
          return { thinking: null, answer: text };
        }
      }
      
      // 提取思考过程和答案
      return this.extractThinkingAndAnswer(processedText);
    } catch (error) {
      console.error('提取思考过程时出错:', error);
      // 发生错误时返回原始文本作为答案
      return { thinking: null, answer: text };
    }
  }
  
  /**
   * 从文本中提取思考过程和最终答案
   * @protected
   * @param text 处理后的文本
   * @returns 包含思考过程和最终答案的对象
   */
  protected extractThinkingAndAnswer(text: string): ThoughtExtractionResult {
    const { startMarker, endMarker } = this.detectMarkers(text);
    
    // 再次检查标记有效性
    if (!startMarker || !endMarker) {
      return { thinking: null, answer: text };
    }
    
    // 提取思考内容
    const startIndex = text.indexOf(startMarker) + startMarker.length;
    const endMarkIndex = text.indexOf(endMarker, startIndex);
    
    // 处理未找到结束标记的情况
    if (endMarkIndex === -1) {
      const thinking = text.substring(startIndex).trim();
      return { thinking, answer: null };
    }
    
    const thinking = text.substring(startIndex, endMarkIndex).trim();
    
    // 提取最终答案
    const answerStartIndex = this.findAnswerStartIndex(text, endMarkIndex + endMarker.length);
    const answerText = text.substring(answerStartIndex).trim();
    const answer = answerText === '' ? null : answerText;
    
    return { thinking, answer };
  }
  
  /**
   * 找到答案开始的位置
   * @protected
   * @param text 原文本
   * @param defaultStartIndex 默认开始位置
   * @returns 答案开始的索引
   */
  protected findAnswerStartIndex(text: string, defaultStartIndex: number): number {
    let answerStartIndex = defaultStartIndex;
    
    // 查找答案标记
    for (const marker of this.answerMarkers) {
      const markerIndex = text.indexOf(marker, defaultStartIndex);
      if (markerIndex !== -1 && markerIndex < defaultStartIndex + 100) {
        return markerIndex + marker.length;
      }
    }
    
    return answerStartIndex;
  }
  
  /**
   * 检测文本中使用的思考标记
   * @protected
   * @param text 要检查的文本
   * @returns 找到的开始和结束标记
   */
  protected detectMarkers(text: string): Markers {
    // 寻找开始标记
    const startMarker = this.findFirstMarker(text, this.thinkStartMarkers);
    
    // 寻找结束标记
    let endMarker = null;
    if (startMarker) {
      // 如果找到了开始标记，确保结束标记在开始标记之后
      const startIndex = text.indexOf(startMarker) + startMarker.length;
      endMarker = this.findFirstMarkerAfter(text, this.thinkEndMarkers, startIndex);
    } else {
      // 如果没有找到开始标记，检查是否有结束标记
      endMarker = this.findFirstMarker(text, this.thinkEndMarkers);
    }
    
    return { startMarker, endMarker };
  }
  
  /**
   * 在文本中查找第一个匹配的标记
   * @protected
   * @param text 要检查的文本
   * @param markers 标记列表
   * @returns 找到的标记或null
   */
  protected findFirstMarker(text: string, markers: string[]): string | null {
    for (const marker of markers) {
      if (text.includes(marker)) {
        return marker;
      }
    }
    return null;
  }
  
  /**
   * 在文本中指定位置后查找第一个匹配的标记
   * @protected
   * @param text 要检查的文本
   * @param markers 标记列表
   * @param startIndex 开始查找的位置
   * @returns 找到的标记或null
   */
  protected findFirstMarkerAfter(text: string, markers: string[], startIndex: number): string | null {
    for (const marker of markers) {
      if (text.indexOf(marker, startIndex) !== -1) {
        return marker;
      }
    }
    return null;
  }
  
  /**
   * 检查文本是否包含思考过程标记
   * @param text 要检查的文本
   * @returns 是否包含思考过程标记
   */
  public hasThinkingMarkers(text: string): boolean {
    const { startMarker, endMarker } = this.detectMarkers(text);
    return startMarker !== null || endMarker !== null;
  }
} 