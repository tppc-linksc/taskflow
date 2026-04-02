import { generateUUID } from '../utils/uuid'
import { MemoDatabase } from './db'

/**
 * 备忘录业务服务层
 */
export class MemoService {
  constructor() {
    this.db = new MemoDatabase()
    this.initialized = false
  }

  /**
   * 确保数据库已初始化
   */
  async ensureInit() {
    if (!this.initialized) {
      const isSupported = await this.db.isSupported()
      if (!isSupported) {
        throw new Error('IndexedDB is not supported in this browser')
      }
      await this.db.init()
      this.initialized = true
    }
  }

  /**
   * 创建备忘录
   */
  async createMemo({ title, content = '', tags = [], color = 'blue', attachments = [], order = null }) {
    await this.ensureInit()

    if (!title || !title.trim()) {
      throw new Error('备忘录标题不能为空')
    }

    // 如果没有指定order，获取当前最大order值+1
    if (order === null) {
      const allMemos = await this.getAllMemos()
      const maxOrder = allMemos.reduce((max, m) => Math.max(max, m.order || 0), 0)
      order = maxOrder + 1
    }

    const memo = {
      id: generateUUID(),
      title: title.trim(),
      content: content.trim(),
      tags: Array.isArray(tags) ? tags : [],
      color: ['blue', 'green', 'red', 'yellow', 'purple'].includes(color) ? color : 'blue',
      isArchived: false,
      order,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attachments: Array.isArray(attachments) ? attachments : []
    }

    await this.db.add(memo)
    return memo
  }

  /**
   * 获取所有备忘录
   */
  async getAllMemos() {
    await this.ensureInit()
    return this.db.getAll()
  }

  /**
   * 获取单个备忘录
   */
  async getMemo(id) {
    await this.ensureInit()
    const memo = await this.db.get(id)
    if (!memo) {
      throw new Error(`备忘录 ${id} 不存在`)
    }
    return memo
  }

  /**
   * 更新备忘录
   */
  async updateMemo(id, updates) {
    await this.ensureInit()

    const allowedUpdates = ['title', 'content', 'tags', 'color', 'isArchived', 'attachments', 'order']
    const filteredUpdates = {}

    for (const key of allowedUpdates) {
      if (key in updates) {
        if (key === 'title' && updates[key] && !updates[key].trim()) {
          throw new Error('备忘录标题不能为空')
        }
        filteredUpdates[key] = updates[key]
      }
    }

    filteredUpdates.updatedAt = new Date().toISOString()

    const updated = await this.db.update(id, filteredUpdates)
    if (!updated) {
      throw new Error(`更新备忘录失败: ${id}`)
    }

    return updated
  }

  /**
   * 批量更新备忘录顺序
   */
  async reorderMemos(memoOrders) {
    await this.ensureInit()
    // memoOrders 是一个数组 [{id, order}, ...]
    for (const { id, order } of memoOrders) {
      await this.db.update(id, { order, updatedAt: new Date().toISOString() })
    }
    return true
  }

  /**
   * 删除备忘录
   */
  async deleteMemo(id) {
    await this.ensureInit()
    await this.db.delete(id)
    return true
  }

  /**
   * 搜索备忘录
   */
  async searchMemos(query) {
    await this.ensureInit()
    if (!query || typeof query !== 'string' || !query.trim()) {
      return this.getAllMemos()
    }
    return this.db.search(query.trim())
  }

  /**
   * 按标签筛选备忘录
   */
  async filterMemosByTag(tag) {
    await this.ensureInit()
    if (!tag || typeof tag !== 'string' || !tag.trim()) {
      return this.getAllMemos()
    }
    return this.db.filterByTag(tag.trim())
  }

  /**
   * 按颜色筛选备忘录
   */
  async filterMemosByColor(color) {
    await this.ensureInit()
    const validColors = ['blue', 'green', 'red', 'yellow', 'purple']
    if (!validColors.includes(color)) {
      return this.getAllMemos()
    }
    return this.db.filterByColor(color)
  }

  /**
   * 归档备忘录
   */
  async archiveMemo(id) {
    return this.updateMemo(id, { isArchived: true })
  }

  /**
   * 取消归档备忘录
   */
  async unarchiveMemo(id) {
    return this.updateMemo(id, { isArchived: false })
  }

  /**
   * 获取已归档备忘录
   */
  async getArchivedMemos() {
    await this.ensureInit()
    return this.db.getArchived()
  }

  /**
   * 获取未归档备忘录
   */
  async getUnarchivedMemos() {
    await this.ensureInit()
    return this.db.getUnarchived()
  }

  /**
   * 复制备忘录
   */
  async duplicateMemo(id) {
    const original = await this.getMemo(id)

    return this.createMemo({
      title: `副本: ${original.title}`,
      content: original.content,
      tags: [...original.tags],
      color: original.color,
      attachments: [...original.attachments]
    })
  }

  /**
   * 导出备忘录（文本格式）
   */
  async exportMemo(id, format = 'markdown') {
    const memo = await this.getMemo(id)

    const stripHtml = (html) => {
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = html
      return tempDiv.textContent || tempDiv.innerText || ''
    }

    if (format === 'markdown') {
      const plainContent = stripHtml(memo.content)
      return `# ${memo.title}\n\n${plainContent}\n\n创建时间: ${new Date(memo.createdAt).toLocaleString()}\n最后修改: ${new Date(memo.updatedAt).toLocaleString()}`
    } else if (format === 'json') {
      return JSON.stringify(memo, null, 2)
    } else if (format === 'text') {
      return `${memo.title}\n\n${stripHtml(memo.content)}`
    } else if (format === 'html') {
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${memo.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { border-bottom: 2px solid #333; padding-bottom: 10px; }
    .meta { color: #666; font-size: 14px; margin-top: 20px; }
  </style>
</head>
<body>
  <h1>${memo.title}</h1>
  <div class="content">${memo.content}</div>
  <div class="meta">
    <p>创建时间: ${new Date(memo.createdAt).toLocaleString()}</p>
    <p>最后修改: ${new Date(memo.updatedAt).toLocaleString()}</p>
  </div>
</body>
</html>`
    }

    throw new Error(`不支持的导出格式: ${format}`)
  }

  /**
   * 获取备忘录（供其他导出服务使用）
   */
  async getMemoForExport(id) {
    return await this.getMemo(id)
  }

  /**
   * 获取统计信息
   */
  async getStats() {
    const allMemos = await this.getAllMemos()
    const archived = await this.getArchivedMemos()

    return {
      total: allMemos.length,
      archived: archived.length,
      unarchived: allMemos.length - archived.length
    }
  }
}
