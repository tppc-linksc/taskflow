const sharp = require('sharp');
const pngToIco = require('png-to-ico').default;
const fs = require('fs');
const path = require('path');

// 定义输入和输出路径
const inputPath = path.join(__dirname, 'logo.png');
const tempPath = path.join(__dirname, 'logo-square.png');
const outputPath = path.join(__dirname, 'public', 'icon.ico');

// 确保 public 目录存在
if (!fs.existsSync(path.join(__dirname, 'public'))) {
  fs.mkdirSync(path.join(__dirname, 'public'), { recursive: true });
}

async function generateIcon() {
  try {
    // 首先将图片调整为正方形（256x256）
    await sharp(inputPath)
      .resize(256, 256, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 } // 透明背景
      })
      .toFile(tempPath);

    // 然后转换为 ICO 文件
    const buf = await pngToIco(tempPath);
    fs.writeFileSync(outputPath, buf);
    
    // 删除临时文件
    fs.unlinkSync(tempPath);
    
    console.log('标准 Windows 应用图标已成功生成:', outputPath);
  } catch (err) {
    console.error('生成图标失败:', err);
  }
}

generateIcon();