#!/usr/bin/env node

/**
 * i18n 检查工具命令行脚本
 * 用于检测组件中的硬编码文本，帮助开发者发现未国际化的文本
 * 
 * 使用方法:
 * node scripts/i18n-check.js [目录路径]
 * 
 * 例如:
 * node scripts/i18n-check.js packages/ui/src/components
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 默认目录
const DEFAULT_DIR = 'packages/ui/src/components';

// 获取命令行参数
const args = process.argv.slice(2);
const targetDir = args[0] || DEFAULT_DIR;
const fullPath = path.resolve(process.cwd(), targetDir);

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// 打印标题
console.log(`${colors.bright}${colors.blue}===== i18n 硬编码文本检查工具 =====${colors.reset}\n`);
console.log(`扫描目录: ${colors.cyan}${fullPath}${colors.reset}\n`);

// 检查目录是否存在
if (!fs.existsSync(fullPath)) {
  console.error(`${colors.red}错误: 目录 "${fullPath}" 不存在${colors.reset}`);
  process.exit(1);
}

// 扫描Vue文件
function findVueFiles(dir, exclude = ['node_modules', 'dist']) {
  let files = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // 检查是否应该排除
      if (exclude.some(pattern => fullPath.includes(pattern))) {
        continue;
      }
      
      if (entry.isDirectory()) {
        // 递归扫描子目录
        files = files.concat(findVueFiles(fullPath, exclude));
      } else if (entry.isFile() && entry.name.endsWith('.vue')) {
        // 添加Vue文件
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`${colors.red}读取目录 ${dir} 出错:${colors.reset}`, error);
  }
  
  return files;
}

// 在文件中查找硬编码文本
function findHardcodedTexts(filePath) {
  const hardcodedTexts = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // 提取template部分
    const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/);
    if (!templateMatch) return hardcodedTexts;
    
    const templateContent = templateMatch[1];
    const templateStartLine = content.substring(0, templateMatch.index).split('\n').length;
    const templateLines = templateContent.split('\n');
    
    // 检查每一行
    for (let i = 0; i < templateLines.length; i++) {
      const line = templateLines[i];
      const lineNumber = templateStartLine + i;
      
      // 跳过注释行
      if (line.trim().startsWith('<!--')) continue;
      
      // 检查内容中的文本
      const textMatches = line.match(/>([^<>{}$]+)</g);
      if (textMatches) {
        for (const match of textMatches) {
          const text = match.substring(1, match.length - 1).trim();
          
          // 跳过空白文本和只有特殊字符的文本
          if (!text || /^[\s\d.,;:!?()[\]{}\/\-+*=<>|&%$#@^~`"']+$/.test(text)) continue;
          
          // 检测中文文本
          if (/[\u4e00-\u9fa5]/.test(text)) {
            hardcodedTexts.push({
              line: lineNumber,
              text,
              type: 'content'
            });
            continue;
          }
          
          // 检测英文单词（至少4个字母）
          if (/[a-zA-Z]{4,}/.test(text)) {
            hardcodedTexts.push({
              line: lineNumber,
              text,
              type: 'content'
            });
          }
        }
      }
      
      // 检查属性值
      const attrMatches = line.match(/(\w+)=["']([^"'{}$]+)["']/g);
      if (attrMatches) {
        for (const match of attrMatches) {
          const parts = match.split(/[='"]/);
          const attrName = parts[0];
          const attrValue = match.match(/["']([^"']+)["']/)?.[1]?.trim();
          
          // 跳过不需要国际化的属性
          if (!attrValue || ['class', 'id', 'type', 'name', 'src', 'href', 'alt', 'width', 'height'].includes(attrName)) {
            continue;
          }
          
          // 中文属性值
          if (/[\u4e00-\u9fa5]/.test(attrValue)) {
            hardcodedTexts.push({
              line: lineNumber,
              text: `${attrName}="${attrValue}"`,
              type: 'attribute'
            });
            continue;
          }
          
          // 英文单词属性值（排除一些常见值）
          if (/[a-zA-Z]{4,}/.test(attrValue) && 
              !['true', 'false', 'null', 'undefined'].includes(attrValue)) {
            hardcodedTexts.push({
              line: lineNumber,
              text: `${attrName}="${attrValue}"`,
              type: 'attribute'
            });
          }
        }
      }
    }
  } catch (error) {
    console.error(`${colors.red}读取文件 ${filePath} 出错:${colors.reset}`, error);
  }
  
  return hardcodedTexts;
}

// 开始扫描
console.log(`${colors.bright}正在扫描Vue文件...${colors.reset}`);
const vueFiles = findVueFiles(fullPath);
console.log(`找到 ${colors.cyan}${vueFiles.length}${colors.reset} 个Vue文件\n`);

// 分析结果
const results = {};
let totalHardcodedTexts = 0;

for (const file of vueFiles) {
  const relativePath = path.relative(process.cwd(), file);
  const hardcodedTexts = findHardcodedTexts(file);
  
  if (hardcodedTexts.length > 0) {
    results[relativePath] = hardcodedTexts;
    totalHardcodedTexts += hardcodedTexts.length;
  }
}

// 打印结果
console.log(`${colors.bright}${colors.blue}===== 扫描结果 =====${colors.reset}\n`);

if (totalHardcodedTexts === 0) {
  console.log(`${colors.green}恭喜！未发现硬编码文本。${colors.reset}`);
} else {
  console.log(`发现 ${colors.yellow}${totalHardcodedTexts}${colors.reset} 处可能的硬编码文本:\n`);
  
  // 打印每个文件的结果
  for (const file in results) {
    console.log(`${colors.bright}文件: ${colors.cyan}${file}${colors.reset}`);
    
    for (const { line, text, type } of results[file]) {
      const typeColor = type === 'attribute' ? colors.magenta : colors.yellow;
      console.log(`  [${colors.green}行 ${line}${colors.reset}] ${typeColor}${text}${colors.reset}`);
    }
    
    console.log('');
  }
  
  // 打印建议
  console.log(`${colors.bright}${colors.blue}建议:${colors.reset}`);
  console.log(`1. 使用 ${colors.green}$t('key')${colors.reset} 函数替换硬编码文本`);
  console.log(`2. 在语言文件中添加对应的翻译键值`);
  console.log(`3. 对于属性值，使用 ${colors.green}:attr="$t('key')"${colors.reset} 的方式绑定国际化文本`);
  
  // 打印示例
  console.log(`\n${colors.bright}${colors.blue}示例:${colors.reset}`);
  console.log(`${colors.red}<button title="确认">提交</button>${colors.reset}`);
  console.log(`更改为：`);
  console.log(`${colors.green}<button :title="$t('common.confirm')">{{ $t('common.submit') }}</button>${colors.reset}`);
}

console.log(`\n${colors.bright}${colors.blue}===== 检查完成 =====${colors.reset}`); 