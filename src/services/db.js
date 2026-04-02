/**
 * IndexedDB 数据库封装类
 */
export class MemoDatabase {
  constructor(dbName = 'taskflow_db', version = 1, storeName = 'memos') {
    this.dbName = dbName
    this.version = version
    this.storeName = storeName
    this.db = null
  }

  /**
   * 初始化数据库
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        // 检查存储对象是否已存在
        if (!db.objectStoreNames.contains(this.storeName)) {
          // 创建存储对象
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' })

          // 创建索引用于高效查询
          store.createIndex('createdAt', 'createdAt', { unique: false })
          store.createIndex('updatedAt', 'updatedAt', { unique: false })
          store.createIndex('tags', 'tags', { unique: false, multiEntry: true })
          store.createIndex('color', 'color', { unique: false })
          store.createIndex('isArchived', 'isArchived', { unique: false })
          store.createIndex('order', 'order', { unique: false })
        }
      }

      request.onsuccess = (event) => {
        this.db = event.target.result
        resolve(this.db)
      }

      request.onerror = (event) => {
        reject(event.target.error)
      }
    })
  }

  /**
   * 检查IndexedDB是否被支持
   */
  async isSupported() {
    return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null
  }

  /**
   * 获取所有数据
   */
  async getAll() {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'))

      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = (event) => reject(event.target.error)
    })
  }

  /**
   * 根据ID获取单条数据
   */
  async get(id) {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'))

      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = (event) => reject(event.target.error)
    })
  }

  /**
   * 添加数据
   */
  async add(item) {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'))

      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.add(item)

      request.onsuccess = () => resolve(item.id)
      request.onerror = (event) => reject(event.target.error)
    })
  }

  /**
   * 更新数据
   */
  async update(id, updates) {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'))

      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const getRequest = store.get(id)

      getRequest.onsuccess = () => {
        const existing = getRequest.result
        if (!existing) {
          reject(new Error(`Item with id ${id} not found`))
          return
        }

        const updated = { ...existing, ...updates }
        const putRequest = store.put(updated)

        putRequest.onsuccess = () => resolve(updated)
        putRequest.onerror = (event) => reject(event.target.error)
      }

      getRequest.onerror = (event) => reject(event.target.error)
    })
  }

  /**
   * 删除数据
   */
  async delete(id) {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'))

      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(id)

      request.onsuccess = () => resolve(true)
      request.onerror = (event) => reject(event.target.error)
    })
  }

  /**
   * 搜索数据（按标题和内容）
   */
  async search(query) {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'))
      if (!query || typeof query !== 'string') return resolve([])

      const lowerQuery = query.toLowerCase()
      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()

      request.onsuccess = () => {
        const results = request.result.filter(memo => {
          const title = memo.title?.toLowerCase() || ''
          const content = memo.content?.toLowerCase() || ''
          return title.includes(lowerQuery) || content.includes(lowerQuery)
        })
        resolve(results)
      }

      request.onerror = (event) => reject(event.target.error)
    })
  }

  /**
   * 按标签筛选
   */
  async filterByTag(tag) {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'))

      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()

      request.onsuccess = () => {
        const results = request.result.filter(memo =>
          memo.tags && memo.tags.includes(tag)
        )
        resolve(results)
      }

      request.onerror = (event) => reject(event.target.error)
    })
  }

  /**
   * 按颜色筛选
   */
  async filterByColor(color) {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'))

      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()

      request.onsuccess = () => {
        const results = request.result.filter(memo => memo.color === color)
        resolve(results)
      }

      request.onerror = (event) => reject(event.target.error)
    })
  }

  /**
   * 获取已归档的数据
   */
  async getArchived() {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'))

      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()

      request.onsuccess = () => {
        const results = request.result.filter(memo => memo.isArchived === true)
        resolve(results)
      }

      request.onerror = (event) => reject(event.target.error)
    })
  }

  /**
   * 获取未归档的数据
   */
  async getUnarchived() {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'))

      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()

      request.onsuccess = () => {
        const results = request.result.filter(memo => memo.isArchived !== true)
        resolve(results)
      }

      request.onerror = (event) => reject(event.target.error)
    })
  }

  /**
   * 关闭数据库连接
   */
  close() {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}
