import { useState, useEffect, useCallback } from 'react'
import { MemoService } from '../services/memoService'

/**
 * 备忘录自定义Hook
 */
export function useMemo() {
  const [memos, setMemos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const memoService = new MemoService()

  const loadMemos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await memoService.getAllMemos()
      setMemos(data)
    } catch (err) {
      setError(err.message)
      console.error('加载备忘录失败:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMemos()
  }, [loadMemos])

  const createMemo = useCallback(async (memoData) => {
    try {
      setError(null)
      await memoService.createMemo(memoData)
      await loadMemos()
      return true
    } catch (err) {
      setError(err.message)
      console.error('创建备忘录失败:', err)
      return false
    }
  }, [loadMemos])

  const updateMemo = useCallback(async (id, updates) => {
    try {
      setError(null)
      await memoService.updateMemo(id, updates)
      await loadMemos()
      return true
    } catch (err) {
      setError(err.message)
      console.error('更新备忘录失败:', err)
      return false
    }
  }, [loadMemos])

  const deleteMemo = useCallback(async (id) => {
    try {
      setError(null)
      await memoService.deleteMemo(id)
      await loadMemos()
      return true
    } catch (err) {
      setError(err.message)
      console.error('删除备忘录失败:', err)
      return false
    }
  }, [loadMemos])

  const archiveMemo = useCallback(async (id) => {
    try {
      setError(null)
      await memoService.archiveMemo(id)
      await loadMemos()
      return true
    } catch (err) {
      setError(err.message)
      console.error('归档备忘录失败:', err)
      return false
    }
  }, [loadMemos])

  const unarchiveMemo = useCallback(async (id) => {
    try {
      setError(null)
      await memoService.unarchiveMemo(id)
      await loadMemos()
      return true
    } catch (err) {
      setError(err.message)
      console.error('取消归档备忘录失败:', err)
      return false
    }
  }, [loadMemos])

  const duplicateMemo = useCallback(async (id) => {
    try {
      setError(null)
      await memoService.duplicateMemo(id)
      await loadMemos()
      return true
    } catch (err) {
      setError(err.message)
      console.error('复制备忘录失败:', err)
      return false
    }
  }, [loadMemos])

  const searchMemos = useCallback(async (query) => {
    try {
      setError(null)
      return await memoService.searchMemos(query)
    } catch (err) {
      setError(err.message)
      console.error('搜索备忘录失败:', err)
      return []
    }
  }, [])

  const filterByTag = useCallback(async (tag) => {
    try {
      setError(null)
      return await memoService.filterMemosByTag(tag)
    } catch (err) {
      setError(err.message)
      console.error('按标签筛选备忘录失败:', err)
      return []
    }
  }, [])

  const exportMemo = useCallback(async (id, format = 'markdown') => {
    try {
      setError(null)
      return await memoService.exportMemo(id, format)
    } catch (err) {
      setError(err.message)
      console.error('导出备忘录失败:', err)
      return null
    }
  }, [])

  const getStats = useCallback(async () => {
    try {
      setError(null)
      return await memoService.getStats()
    } catch (err) {
      setError(err.message)
      console.error('获取统计信息失败:', err)
      return { total: 0, archived: 0, unarchived: 0 }
    }
  }, [])

  const downloadMemo = useCallback(async (id, format) => {
    try {
      setError(null)
      const memo = await memoService.getMemoForExport(id)
      return { memo, format }
    } catch (err) {
      setError(err.message)
      console.error('获取备忘录失败:', err)
      return null
    }
  }, [])

  const reorderMemos = useCallback(async (memoOrders) => {
    try {
      setError(null)
      await memoService.reorderMemos(memoOrders)
      await loadMemos()
      return true
    } catch (err) {
      setError(err.message)
      console.error('更新备忘录顺序失败:', err)
      return false
    }
  }, [loadMemos])

  return {
    memos,
    loading,
    error,
    loadMemos,
    createMemo,
    updateMemo,
    deleteMemo,
    archiveMemo,
    unarchiveMemo,
    duplicateMemo,
    searchMemos,
    filterByTag,
    exportMemo,
    downloadMemo,
    getStats,
    reorderMemos
  }
}
