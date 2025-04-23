import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

/**
 * 处理请求函数
 * @param {Request} request
 * @param {*} env
 * @param {*} ctx
 * @returns {Response}
 */
export default {
  async fetch(request, env, ctx) {
    try {
      // 获取页面资源
      return await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST,
        },
      );
    } catch (e) {
      // 如果没有找到资源，返回自定义404页面
      return new Response('Page not found', { status: 404 });
    }
  },
}; 