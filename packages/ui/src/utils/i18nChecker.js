/**
 * i18n检查工具
 * 用于扫描组件中的硬编码文本，帮助开发者发现未国际化的文本
 */

const fs = require('fs');
const path = require('path');

/**
 * 递归查找Vue文件
 * @param {string} dir 目录路径
 * @param {string[]} exclude 排除的目录或文件
 * @returns {string[]} Vue文件路径列表
 */
function findVueFiles(dir, exclude) {
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
      } else if (entry.name.endsWith('.vue')) {
        // 添加Vue文件
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`读取目录 ${dir} 出错:`, error);
  }
  
  return files;
}

/**
 * 在Vue文件中查找硬编码文本
 * @param {string} content 文件内容
 * @param {string} filePath 文件路径
 * @returns {Array<{file: string, line: number, text: string}>} 硬编码文本列表
 */
function findHardcodedTextsInFile(content, filePath) {
  const hardcodedTexts = [];
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
    
    // 检查标签内的文本内容
    const textMatches = line.match(/>([^<>{}$]+)</g);
    if (textMatches) {
      for (const match of textMatches) {
        const text = match.substring(1, match.length - 1).trim();
        
        // 跳过空白文本、数字和单个符号
        if (!text || /^[\s\d.,;:!?()[\]{}\/\-+*=<>|&%$#@^~`"']+$/.test(text)) continue;
        
        // 检测中文文本
        if (/[\u4e00-\u9fa5]/.test(text)) {
          hardcodedTexts.push({
            file: filePath,
            line: lineNumber,
            text
          });
          continue;
        }
        
        // 检测英文单词
        if (/[a-zA-Z]{4,}/.test(text)) {
          hardcodedTexts.push({
            file: filePath,
            line: lineNumber,
            text
          });
        }
      }
    }
    
    // 检查属性中的硬编码文本
    const attrMatches = line.match(/(\w+)=["']([^"'{}$]+)["']/g);
    if (attrMatches) {
      for (const match of attrMatches) {
        const parts = match.split(/[='"]/);
        const attrName = parts[0];
        const attrValueMatch = match.match(/["']([^"']+)["']/);
        const attrValue = attrValueMatch ? attrValueMatch[1].trim() : '';
        
        // 跳过不需要国际化的属性
        if (!attrValue || ['class', 'id', 'type', 'name', 'src', 'href', 'alt', 'width', 'height'].includes(attrName)) {
          continue;
        }
        
        // 检测属性值中的中文
        if (/[\u4e00-\u9fa5]/.test(attrValue)) {
          hardcodedTexts.push({
            file: filePath,
            line: lineNumber,
            text: `${attrName}="${attrValue}"`
          });
          continue;
        }
        
        // 检测属性值中的英文单词
        if (/[a-zA-Z]{4,}/.test(attrValue) && !['true', 'false', 'null', 'undefined'].includes(attrValue)) {
          hardcodedTexts.push({
            file: filePath,
            line: lineNumber,
            text: `${attrName}="${attrValue}"`
          });
        }
      }
    }
  }
  
  return hardcodedTexts;
}

/**
 * 打印扫描结果
 * @param {Array<{file: string, line: number, text: string}>} results 扫描结果
 */
function printResults(results) {
  if (results.length === 0) {
    console.log('恭喜！未发现硬编码文本。');
    return;
  }
  
  console.log(`发现 ${results.length} 处可能的硬编码文本:\n`);
  
  // 按文件分组
  const fileGroups = {};
  
  for (const result of results) {
    if (!fileGroups[result.file]) {
      fileGroups[result.file] = [];
    }
    fileGroups[result.file].push(result);
  }
  
  // 打印每个文件的结果
  for (const file in fileGroups) {
    console.log(`文件: ${file}`);
    
    for (const { line, text } of fileGroups[file]) {
      console.log(`  [行 ${line}] ${text}`);
    }
    
    console.log('');
  }
  
  // 打印国际化建议
  console.log('建议:');
  console.log('1. 使用 $t() 函数替换硬编码文本');
  console.log('2. 在语言文件中添加对应的翻译键值');
  console.log('3. 对于属性值，使用 :attr="$t(\'key\')" 的方式绑定国际化文本');
}

/**
 * 扫描组件目录中的硬编码文本
 * @param {object} options 扫描选项
 * @returns {Array<{file: string, line: number, text: string}>} 硬编码文本列表
 */
function scanHardcodedTexts(options) {
  const { dir, exclude = ['node_modules'], verbose = false } = options;
  
  if (verbose) {
    console.log(`开始扫描目录: ${dir}`);
  }
  
  const results = [];
  const files = findVueFiles(dir, exclude);
  
  if (verbose) {
    console.log(`找到 ${files.length} 个 Vue 文件`);
  }
  
  for (const file of files) {
    if (verbose) {
      console.log(`扫描文件: ${file}`);
    }
    
    const content = fs.readFileSync(file, 'utf-8');
    const hardcodedTexts = findHardcodedTextsInFile(content, file);
    
    results.push(...hardcodedTexts);
  }
  
  return results;
}

/**
 * 运行i18n检查
 * @param {string} dir 要扫描的目录
 */
function runI18nCheck(dir) {
  console.log('===== i18n 硬编码文本检查工具 =====\n');
  
  const results = scanHardcodedTexts({
    dir,
    exclude: ['node_modules', 'dist'],
    verbose: true
  });
  
  console.log('\n===== 扫描结果 =====\n');
  printResults(results);
}

// 检查命令行参数
if (process.argv.length < 3) {
  console.log('用法: node i18nChecker.js <directory>');
  process.exit(1);
}

const targetDir = process.argv[2];
runI18nCheck(targetDir); 