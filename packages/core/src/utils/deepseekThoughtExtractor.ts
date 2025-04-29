/**
 * DeepSeek Reasoner模型思考过程提取器
 * 用于从DeepSeek模型的输出中提取思考过程和最终答案
 */
export interface ThoughtExtractionResult {
  thinking: string | null;
  answer: string | null;
}

export class DeepSeekThoughtExtractor {
  private thinkStart = '<think>';
  private thinkEnd = '</think>';
  
  /**
   * 从文本中提取思考过程和最终答案
   * @param text 模型生成的完整文本
   * @returns 包含思考过程和最终答案的对象
   */
  public extract(text: string): ThoughtExtractionResult {
    // 处理空输入
    if (!text || text.trim() === '') {
      return { thinking: null, answer: null };
    }
    
    // 如果没有思考结束标记，则整个文本作为答案返回
    if (!text.includes(this.thinkEnd)) {
      return { thinking: null, answer: text };
    }
    
    // 有时模型可能省略开始标记，添加它以确保正确解析
    if (!text.includes(this.thinkStart)) {
      text = `${this.thinkStart}${text}`;
    }
    
    try {
      // 定位开始和结束标记
      const startIndex = text.indexOf(this.thinkStart) + this.thinkStart.length;
      const endIndex = text.indexOf(this.thinkEnd);
      
      // 提取思考内容
      const thinking = text.substring(startIndex, endIndex).trim();
      
      // 获取结束标记后的文本作为最终答案
      const answerStartIndex = endIndex + this.thinkEnd.length;
      const answerText = text.substring(answerStartIndex).trim();
      
      // 如果最终答案为空，则返回null
      const answer = answerText === '' ? null : answerText;
      
      return { thinking, answer };
    } catch (error) {
      console.error('提取DeepSeek思考过程时出错:', error);
      // 发生错误时返回原始文本作为答案
      return { thinking: null, answer: text };
    }
  }
  
  /**
   * 检查文本是否包含思考过程标记
   * @param text 要检查的文本
   * @returns 是否包含思考过程标记
   */
  public hasThinkingMarkers(text: string): boolean {
    return text.includes(this.thinkEnd);
  }
} 