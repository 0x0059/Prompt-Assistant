/**
 * DeepSeek思考过程提取示例
 * 此示例展示如何使用LLMService获取DeepSeek Reasoner模型的思考过程
 */
import { createLLMService } from '../services/llm/service';
import { Message, ThinkingResponse } from '../services/llm/types';
import { DeepSeekThoughtExtractor } from '../utils/deepseekThoughtExtractor';

/**
 * 示例1：使用新的API方法获取思考过程
 * 此方法适用于支持思考过程的所有模型提供商
 */
async function getThinkingWithAPI() {
  // 创建LLM服务实例
  const llmService = createLLMService();
  
  // 定义要发送的消息
  const messages: Message[] = [
    { role: 'user', content: '9.11和9.8，哪个更大？请解释原因。' }
  ];
  
  try {
    // 使用sendMessageWithThinking方法获取包含思考过程的响应
    const response: ThinkingResponse = await llmService.sendMessageWithThinking(messages, 'deepseek');
    
    console.log('=== 思考过程 ===');
    console.log(response.thinking || '没有获取到思考过程');
    
    console.log('\n=== 最终答案 ===');
    console.log(response.content);
  } catch (error) {
    console.error('获取思考过程失败:', error);
  }
}

/**
 * 示例2：使用传统API方法并手动提取思考过程
 * 此方法适用于任何模型，但需要手动处理思考过程提取
 */
async function getThinkingManually() {
  // 创建LLM服务实例
  const llmService = createLLMService();
  
  // 定义要发送的消息
  const messages: Message[] = [
    { role: 'user', content: '9.11和9.8，哪个更大？请解释原因。' }
  ];
  
  try {
    // 使用传统方法发送消息
    const content = await llmService.sendMessage(messages, 'deepseek');
    
    // 使用思考提取器提取思考过程
    const thoughtExtractor = new DeepSeekThoughtExtractor();
    const { thinking, answer } = thoughtExtractor.extract(content);
    
    console.log('=== 思考过程 (手动提取) ===');
    console.log(thinking || '没有获取到思考过程');
    
    console.log('\n=== 最终答案 (手动提取) ===');
    console.log(answer || content);
  } catch (error) {
    console.error('获取思考过程失败:', error);
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('示例1：使用新的API方法获取思考过程');
  await getThinkingWithAPI();
  
  console.log('\n\n示例2：使用传统API方法并手动提取思考过程');
  await getThinkingManually();
}

// 运行示例
if (require.main === module) {
  main().catch(error => {
    console.error('运行示例时出错:', error);
  });
}

export { getThinkingWithAPI, getThinkingManually }; 