#!/bin/bash

# 设置应用URL
APP_URL="https://master.prompt-assistant.pages.dev"
echo "开始对 $APP_URL 进行端到端测试..."

# 检查网站可访问性
echo "测试1: 网站可访问性"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $APP_URL)
if [ $HTTP_STATUS -eq 200 ]; then
  echo "✅ 网站可访问，HTTP状态码: $HTTP_STATUS"
else
  echo "❌ 网站不可访问，HTTP状态码: $HTTP_STATUS"
  exit 1
fi

# 检查关键资源
echo "测试2: 关键资源加载"
ASSETS=(
  "$APP_URL/index.html"
  "$APP_URL/assets/main-uxeR47jv.css"
  "$APP_URL/assets/main-CGuVZ4-C.js"
)

for ASSET in "${ASSETS[@]}"; do
  ASSET_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $ASSET)
  if [ $ASSET_STATUS -eq 200 ]; then
    echo "✅ 资源可访问: $ASSET"
  else
    echo "❌ 资源不可访问: $ASSET, 状态码: $ASSET_STATUS"
    exit 1
  fi
done

# 检查SSL证书
echo "测试3: SSL证书验证"
SSL_EXPIRY=$(openssl s_client -servername master.prompt-assistant.pages.dev -connect master.prompt-assistant.pages.dev:443 </dev/null 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)

if [ ! -z "$SSL_EXPIRY" ]; then
  echo "✅ SSL证书有效，过期时间: $SSL_EXPIRY"
else
  echo "❌ SSL证书验证失败"
  exit 1
fi

# 检查响应时间
echo "测试4: 响应时间检测"
RESPONSE_TIME=$(curl -s -w "%{time_total}\n" -o /dev/null $APP_URL)
echo "⏱️ 响应时间: ${RESPONSE_TIME}s"
if (( $(echo "$RESPONSE_TIME < 3.0" | bc -l) )); then
  echo "✅ 响应时间符合要求（<3秒）"
else
  echo "⚠️ 响应时间过长（>3秒），建议优化"
fi

# 检查HTTP/3支持
echo "测试5: HTTP/3支持检测"
HTTP3_SUPPORT=$(curl -s -I --http3 $APP_URL | grep HTTP/3)
if [ ! -z "$HTTP3_SUPPORT" ]; then
  echo "✅ HTTP/3支持已启用"
else
  echo "⚠️ HTTP/3可能未启用，请在Cloudflare控制台检查"
fi

echo "============================================"
echo "✅ 端到端测试完成！"
echo "应用URL: $APP_URL"
echo "部署时间: $(date)"
echo "============================================" 