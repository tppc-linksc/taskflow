import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'

/**
 * 导出服务 - 支持PNG、PDF、Word格式
 */

/**
 * 将HTML转换为图片元素
 */
const createImageFromHtml = async (html, title) => {
  // 创建一个临时容器
  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.top = '-9999px'
  container.style.width = '800px'
  container.style.background = '#ffffff'
  container.style.padding = '40px'
  container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

  // 构建内容
  container.innerHTML = `
    <div style="color: #333;">
      <h1 style="font-size: 24px; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px;">${title}</h1>
      <div style="font-size: 14px; line-height: 1.8;">${html}</div>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999;">
        导出时间: ${new Date().toLocaleString()}
      </div>
    </div>
  `

  document.body.appendChild(container)

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    })
    return canvas
  } finally {
    document.body.removeChild(container)
  }
}

/**
 * 导出为PNG
 */
export async function exportAsPng(html, title, filename = 'memo') {
  try {
    const canvas = await createImageFromHtml(html, title)
    const dataUrl = canvas.toDataURL('image/png')

    const link = document.createElement('a')
    link.download = `${filename}.png`
    link.href = dataUrl
    link.click()

    return true
  } catch (error) {
    console.error('导出PNG失败:', error)
    throw error
  }
}

/**
 * 导出为JPG
 */
export async function exportAsJpg(html, title, filename = 'memo') {
  try {
    const canvas = await createImageFromHtml(html, title)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)

    const link = document.createElement('a')
    link.download = `${filename}.jpg`
    link.href = dataUrl
    link.click()

    return true
  } catch (error) {
    console.error('导出JPG失败:', error)
    throw error
  }
}

/**
 * 导出为PDF
 */
export async function exportAsPdf(html, title, filename = 'memo') {
  try {
    const canvas = await createImageFromHtml(html, title)
    const imgData = canvas.toDataURL('image/png')

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width / 2, canvas.height / 2 + 40]
    })

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)
    pdf.save(`${filename}.pdf`)

    return true
  } catch (error) {
    console.error('导出PDF失败:', error)
    throw error
  }
}

/**
 * 将HTML转换为纯文本（用于Word导出）
 */
const htmlToPlainText = (html) => {
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html

  const extractText = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase()
      let text = ''

      // 处理列表
      if (tagName === 'ul' || tagName === 'ol') {
        const items = Array.from(node.querySelectorAll('li'))
        items.forEach((item, index) => {
          const bullet = tagName === 'ul' ? '• ' : `${index + 1}. `
          text += bullet + extractText(item) + '\n'
        })
        return text
      }

      // 处理段落
      if (tagName === 'p' || tagName === 'div') {
        text = Array.from(node.childNodes).map(extractText).join('') + '\n\n'
      } else {
        text = Array.from(node.childNodes).map(extractText).join('')
      }

      // 添加适当的换行
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
        text = '\n' + text + '\n'
      } else if (tagName === 'br') {
        text = '\n'
      }

      return text
    }

    return ''
  }

  return extractText(tempDiv).trim()
}

/**
 * 导出为Word (DOCX)
 */
export async function exportAsDocx(html, title, filename = 'memo') {
  try {
    const plainText = htmlToPlainText(html)

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 }
          }),
          ...plainText.split('\n\n').filter(p => p.trim()).map(paragraph =>
            new Paragraph({
              children: [
                new TextRun({
                  text: paragraph.replace(/\n/g, ' '),
                  size: 24
                })
              ],
              spacing: { after: 120 }
            })
          )
        ]
      }]
    })

    const blob = await Packer.toBlob(doc)
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.download = `${filename}.docx`
    link.href = url
    link.click()

    URL.revokeObjectURL(url)

    return true
  } catch (error) {
    console.error('导出Word失败:', error)
    throw error
  }
}

/**
 * 获取支持的导出格式
 */
export const EXPORT_FORMATS = [
  { id: 'markdown', name: 'Markdown', extension: '.md', icon: '📝' },
  { id: 'png', name: 'PNG图片', extension: '.png', icon: '🖼️' },
  { id: 'jpg', name: 'JPG图片', extension: '.jpg', icon: '🖼️' },
  { id: 'pdf', name: 'PDF文档', extension: '.pdf', icon: '📄' },
  { id: 'docx', name: 'Word文档', extension: '.docx', icon: '📝' },
  { id: 'json', name: 'JSON数据', extension: '.json', icon: '📋' },
  { id: 'text', name: '纯文本', extension: '.txt', icon: '📃' },
  { id: 'html', name: 'HTML网页', extension: '.html', icon: '🌐' }
]
