#!/bin/bash

echo "扫描包名使用情况..."
echo "================="

echo "查找 JS/TS/Vue/JSON 文件中的包名引用..."
grep -r --include="*.js" --include="*.ts" --include="*.vue" --include="*.json" "@prompt-assistant" ./packages | grep -v "/node_modules/"

echo -e "\n查找 HTML/CSS 文件中的名称引用..."
grep -r --include="*.html" --include="*.css" --include="*.scss" "prompt-assistant" ./packages | grep -v "/node_modules/"

echo -e "\n扫描完成！"