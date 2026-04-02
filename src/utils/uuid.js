/**
 * 生成符合RFC4122 v4标准的UUID
 */
export function generateUUID() {
  if (crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // 兼容性回退
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * 验证UUID格式
 */
export function isValidUUID(uuid) {
  if (typeof uuid !== 'string') return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}
