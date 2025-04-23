/**
 * @file environment.ts
 * @description 环境检测与工具函数模块，提供浏览器环境检测、Vercel部署环境检测和API代理URL生成等功能
 * @module @prompt-assistant/core/utils/environment
 * @author Prompt Assistant Team
 */

/**
 * Vercel环境检测结果的缓存对象
 * @typedef {Object} VercelStatusCache
 * @property {boolean} available - Vercel环境是否可用
 * @property {boolean} checked - 是否已进行过检测
 */

/**
 * 存储Vercel环境检测结果的缓存
 * @type {VercelStatusCache}
 * @private
 */
let vercelStatusCache: { available: boolean; checked: boolean } = {
  available: false, // 默认不可用
  checked: false    // 默认未检测
};

/**
 * 检查是否在浏览器环境中
 * @function isBrowser
 * @returns {boolean} 如果在浏览器环境中返回true，否则返回false
 * @example
 * if (isBrowser()) {
 *   // 浏览器环境相关代码
 * } else {
 *   // 非浏览器环境相关代码
 * }
 */
export const isBrowser = (): boolean => {
  return typeof window !== 'undefined';
};

/**
 * 检测Vercel API是否可用
 * 通过调用/api/vercel-status端点检测当前环境是否为Vercel部署，并支持API代理功能
 * 检测结果会被缓存，避免重复请求
 * 
 * @function checkVercelApiAvailability
 * @async
 * @returns {Promise<boolean>} 如果Vercel API可用则返回true，否则返回false
 * @example
 * const isAvailable = await checkVercelApiAvailability();
 * if (isAvailable) {
 *   // 使用Vercel代理
 * } else {
 *   // 使用直接连接
 * }
 */
export const checkVercelApiAvailability = async (): Promise<boolean> => {
  // 如果已经检查过，直接返回缓存结果，避免重复请求
  if (vercelStatusCache.checked) {
    return vercelStatusCache.available;
  }

  // 在非浏览器环境中直接返回false
  if (!isBrowser()) {
    vercelStatusCache = { available: false, checked: true };
    return false;
  }

  try {
    // 获取当前域名作为基础URL
    const origin = window.location.origin;
    // 设置请求超时为3秒，避免长时间等待
    const response = await fetch(`${origin}/api/vercel-status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000)
    });

    // 检查响应状态，只有200状态码才继续处理
    if (response.status !== 200) {
      vercelStatusCache = { available: false, checked: true };
      console.log('[环境检测] 未检测到Vercel部署环境，代理功能不可用');
      return false;
    }
    
    // 解析JSON响应并验证代理功能是否可用
    const data = await response.json();
    const isAvailable = data.status === 'available' && data.proxySupport === true;
    
    // 更新缓存状态
    vercelStatusCache = { available: isAvailable, checked: true };
    
    // 记录检测结果
    if (isAvailable) {
      console.log('[环境检测] 检测到Vercel部署环境，代理功能可用');
    } else {
      console.log('[环境检测] 未检测到Vercel部署环境，代理功能不可用');
    }
    
    return isAvailable;
  } catch (error) {
    // 请求失败时记录错误并返回false
    console.log('[环境检测] Vercel API检测失败', error);
    vercelStatusCache = { available: false, checked: true };
    return false;
  }
};

/**
 * 重置环境检测缓存
 * 用于在需要重新检测Vercel环境时调用，例如在网络状态变化时
 * 
 * @function resetVercelStatusCache
 * @returns {void}
 * @example
 * // 当网络连接恢复时
 * window.addEventListener('online', () => {
 *   resetVercelStatusCache();
 *   checkVercelApiAvailability();
 * });
 */
export const resetVercelStatusCache = (): void => {
  vercelStatusCache = { available: false, checked: false };
};

/**
 * 检查是否在Vercel环境中（同步版本）
 * 使用缓存的检测结果，避免异步等待
 * 注意：在首次使用前应先调用异步的checkVercelApiAvailability方法
 * 
 * @function isVercel
 * @returns {boolean} 如果在Vercel环境中返回true，否则返回false
 * @example
 * // 应先调用异步检测
 * await checkVercelApiAvailability();
 * 
 * // 之后可以同步使用
 * if (isVercel()) {
 *   // Vercel环境相关代码
 * }
 */
export const isVercel = (): boolean => {
  // 如果未检查过，返回false，应用需要先调用异步检测方法
  return vercelStatusCache.checked && vercelStatusCache.available;
};

/**
 * 获取API代理URL
 * 根据原始API基础URL和请求类型，生成对应的Vercel代理URL
 * 
 * @function getProxyUrl
 * @param {string|undefined} baseURL - 原始API基础URL
 * @param {boolean} [isStream=false] - 是否是流式请求，默认为false
 * @returns {string} 代理URL，如果baseURL为空则返回空字符串
 * @example
 * // 标准请求代理
 * const proxyUrl = getProxyUrl('https://api.openai.com/v1');
 * 
 * // 流式请求代理
 * const streamProxyUrl = getProxyUrl('https://api.openai.com/v1', true);
 */
export const getProxyUrl = (baseURL: string | undefined, isStream: boolean = false): string => {
  // 如果基础URL为空，返回空字符串
  if (!baseURL) {
    return '';
  }
  
  // 获取当前域名作为基础URL，在非浏览器环境中为空字符串
  const origin = isBrowser() ? window.location.origin : '';
  // 根据请求类型选择不同的代理端点
  const proxyEndpoint = isStream ? 'stream' : 'proxy';
  
  // 返回完整的绝对URL，对原始URL进行编码避免特殊字符问题
  return `${origin}/api/${proxyEndpoint}?targetUrl=${encodeURIComponent(baseURL)}`;
}; 