import React, { useState, useEffect } from 'react'
import './App.css'
import MemoList from './components/memo/MemoList'
import MemoFilters from './components/memo/MemoFilters'
import MemoForm from './components/memo/MemoForm'
import MemoDetail from './components/memo/MemoDetail'
import Modal from './components/shared/Modal'
import ConfirmModal from './components/shared/ConfirmModal'
import ExportModal from './components/shared/ExportModal'
import { useMemo } from './hooks/useMemo'
import { useTaskNotification } from './hooks/useTaskNotification'
import { exportAsPng, exportAsJpg, exportAsPdf, exportAsDocx } from './services/exportService'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function App() {
  // 待办事项相关状态
  const [tasks, setTasks] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    dueTime: ''
  })
  const [filter, setFilter] = useState('all')
  const [taskSortBy, setTaskSortBy] = useState('updatedAt') // 'urgency', 'createdAt', 'updatedAt', 'title'
  const [activeId, setActiveId] = useState(null)

  // DnD sensors - 8px distance to distinguish click from drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  )

  // 备忘录相关状态
  const [activeTab, setActiveTab] = useState('tasks')
  const [editingMemo, setEditingMemo] = useState(null)
  const [memoFilters, setMemoFilters] = useState({
    searchQuery: '',
    sortBy: 'updatedAt',
    archiveStatus: 'unarchived', // 'all', 'unarchived', 'archived'
    color: null // null means all colors
  })
  const [viewingMemo, setViewingMemo] = useState(null)
  const [isMemoEditMode, setIsMemoEditMode] = useState(false)
  const [isNewMemo, setIsNewMemo] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportingMemoId, setExportingMemoId] = useState(null)

  // 备忘录Hook
  const {
    memos,
    loading: memoLoading,
    error: memoError,
    createMemo,
    updateMemo,
    deleteMemo,
    duplicateMemo,
    archiveMemo,
    unarchiveMemo,
    exportMemo,
    downloadMemo,
    reorderMemos
  } = useMemo()

  // 备忘录统计数据
  const memoStats = {
    total: memos.length,
    archived: memos.filter(m => m.isArchived).length,
    unarchived: memos.filter(m => !m.isArchived).length
  }

  // 加载任务
  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = () => {
    const data = localStorage.getItem('taskflow_tasks')
    if (data) {
      const parsed = JSON.parse(data)
      // 为没有 order 字段的任务分配 order
      const tasksWithOrder = parsed.map((task, index) => ({
        ...task,
        order: task.order || (index + 1)
      }))
      setTasks(tasksWithOrder)
    }
  }

  // 超时提醒
  useTaskNotification(tasks)

  // 保存任务
  const saveTasks = (newTasks) => {
    localStorage.setItem('taskflow_tasks', JSON.stringify(newTasks))
    setTasks(newTasks)
  }

  // 添加任务
  const handleAddTask = (e) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    const newTask = {
      id: Date.now().toString(),
      ...formData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      completedAt: null,
      order: tasks.length + 1
    }

    saveTasks([...tasks, newTask])
    setFormData({ title: '', description: '', priority: 'medium', dueDate: '', dueTime: '' })
    setShowForm(false)
  }

  // 更新任务
  const handleUpdateTask = (e) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    const updatedTasks = tasks.map(t =>
      t.id === editingTask.id
        ? { ...t, ...formData, updatedAt: new Date().toISOString() }
        : t
    )

    saveTasks(updatedTasks)
    setFormData({ title: '', description: '', priority: 'medium', dueDate: '', dueTime: '' })
    setEditingTask(null)
    setShowForm(false)
  }

  // 完成/取消完成任务
  const handleToggleTask = (task) => {
    let updatedTasks
    if (task.status === 'pending') {
      // 标记为完成时，先从列表中移除，再添加到末尾
      const otherTasks = tasks.filter(t => t.id !== task.id)
      const completedTask = {
        ...task,
        status: 'completed',
        completedAt: new Date().toISOString()
      }
      updatedTasks = [...otherTasks, completedTask]
    } else {
      // 取消完成时，恢复为待处理状态
      updatedTasks = tasks.map(t =>
        t.id === task.id
          ? {
              ...t,
              status: 'pending',
              completedAt: null
            }
          : t
      )
    }
    // 更新 order 字段
    updatedTasks = updatedTasks.map((t, index) => ({
      ...t,
      order: index + 1
    }))
    saveTasks(updatedTasks)
  }

  // 删除任务
  const handleDeleteTask = (taskId) => {
    saveTasks(tasks.filter(t => t.id !== taskId))
  }

  // 显示删除确认
  const showDeleteConfirmation = (task) => {
    setTaskToDelete(task)
    setShowDeleteConfirm(true)
  }

  // 确认删除任务
  const confirmDeleteTask = () => {
    if (taskToDelete) {
      handleDeleteTask(taskToDelete.id)
    }
    setShowDeleteConfirm(false)
    setTaskToDelete(null)
  }

  // 打开编辑弹窗
  const openEditModal = (task) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      dueDate: task.dueDate || '',
      dueTime: task.dueTime || ''
    })
    setShowForm(true)
  }

  // 拖拽相关函数
  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex(t => t.id === active.id)
      const newIndex = tasks.findIndex(t => t.id === over.id)
      if (oldIndex !== -1 && newIndex !== -1) {
        const newTasks = arrayMove(tasks, oldIndex, newIndex)
        // 更新 order 字段
        const reorderedTasks = newTasks.map((task, index) => ({
          ...task,
          order: index + 1
        }))
        saveTasks(reorderedTasks)
      }
    }
  }

  // 计算任务紧急度分数
  const getUrgencyScore = (task) => {
    let score = 0
    if (task.status === 'pending') {
      if (task.priority === 'high') score += 100
      else if (task.priority === 'medium') score += 50
      if (task.dueDate) {
        const dueDateTime = new Date(task.dueDate + (task.dueTime ? 'T' + task.dueTime : 'T23:59:59'))
        const now = new Date()
        if (dueDateTime < now) score += 200 // 已过期
        else score += 75 // 有截止日期
      }
    } else {
      score = -1 // 已完成的任务排到最后
    }
    return score
  }

  // 排序任务 - 按选中的 taskSortBy 排序，已完成的排到最后
  const sortTasks = (taskList) => {
    const completed = []
    const pending = []
    taskList.forEach(task => {
      if (task.status === 'completed') {
        completed.push(task)
      } else {
        pending.push(task)
      }
    })
    const sortedPending = [...pending].sort((a, b) => {
      switch (taskSortBy) {
        case 'urgency':
          return getUrgencyScore(b) - getUrgencyScore(a)
        case 'createdAt':
          return new Date(b.createdAt) - new Date(a.createdAt)
        case 'updatedAt':
          return new Date(b.updatedAt) - new Date(a.updatedAt)
        case 'title':
          return a.title.localeCompare(b.title)
        default:
          return new Date(b.updatedAt) - new Date(a.updatedAt)
      }
    })
    // 已完成的任务按 order 排序（保持拖拽顺序）
    const sortedCompleted = [...completed].sort((a, b) => (a.order || 0) - (b.order || 0))
    return [...sortedPending, ...sortedCompleted]
  }

  // 筛选任务
  const filteredTasks = sortTasks(tasks.filter(task => {
    if (filter === 'pending') return task.status === 'pending'
    if (filter === 'completed') return task.status === 'completed'
    return true
  }))

  // 统计
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    pending: tasks.filter(t => t.status === 'pending').length
  }

  // 备忘录相关函数
  const handleMemoSubmit = async (memoData) => {
    try {
      if (editingMemo) {
        await updateMemo(editingMemo.id, memoData)
      } else {
        await createMemo(memoData)
      }
      setEditingMemo(null)
    } catch (error) {
      console.error('保存备忘录失败:', error)
      alert('保存备忘录失败: ' + error.message)
    }
  }

  const handleArchiveMemo = async (memo) => {
    try {
      if (memo.isArchived) {
        await unarchiveMemo(memo.id)
      } else {
        await archiveMemo(memo.id)
      }
    } catch (error) {
      console.error('归档备忘录失败:', error)
      alert('归档备忘录失败: ' + error.message)
    }
  }

  const handleDeleteMemo = async (memoId) => {
    try {
      await deleteMemo(memoId)
      // 如果删除的是当前查看的备忘录，清除viewingMemo状态
      if (viewingMemo && viewingMemo.id === memoId) {
        setViewingMemo(null)
        setIsMemoEditMode(false)
      }
    } catch (error) {
      console.error('删除备忘录失败:', error)
      alert('删除备忘录失败: ' + error.message)
    }
  }

  const extractTitle = (html) => {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    
    // 方法1：尝试获取第一个子元素的文本（通常是标题行）
    const firstElement = tempDiv.firstElementChild
    if (firstElement) {
      let title = firstElement.textContent || firstElement.innerText || ''
      title = title.trim()
      // 限制标题为30字
      return title.length > 30 ? title.substring(0, 30) + '...' : title || '无标题'
    }
    
    // 方法2：如果没有子元素，使用整个文本的第一行
    const text = tempDiv.textContent || tempDiv.innerText || ''
    const lines = text.split(/[\n\r]+/).filter(line => line.trim())
    const title = lines[0]?.trim() || '无标题'
    // 限制标题为30字
    return title.length > 30 ? title.substring(0, 30) + '...' : title
  }

  const handleMemoSave = async (memoData, isEdit = false) => {
    if (isEdit) {
      setIsMemoEditMode(true)
    } else {
      try {
        if (isNewMemo) {
          const title = memoData.title || extractTitle(memoData.content)
          await createMemo({ ...memoData, title })
          setIsNewMemo(false)
          setIsMemoEditMode(false)
          // 重新加载备忘录列表，以便获取新创建的备忘录
          // 这里可以通过 useEffect 监听 memos 变化来自动更新
        } else if (viewingMemo) {
          // 优先使用传入的标题，否则从内容中提取
          const title = memoData.title || extractTitle(memoData.content)
          await updateMemo(viewingMemo.id, { ...memoData, title })
          // 更新viewingMemo状态，确保回到列表页时显示最新内容
          setViewingMemo(prevMemo => ({
            ...prevMemo,
            ...memoData,
            title,
            updatedAt: new Date().toISOString()
          }))
          setIsMemoEditMode(false)
        }
      } catch (error) {
        console.error('保存备忘录失败:', error)
        alert('保存备忘录失败: ' + error.message)
      }
    }
  }

  const handleEditMemo = (memo) => {
    setViewingMemo(memo)
    setIsMemoEditMode(true)
  }

  const closeMemoModal = () => {
    setEditingMemo(null)
  }

  const handleViewMemo = (memo) => {
    setViewingMemo(memo)
  }

  const handleBackFromDetail = () => {
    setViewingMemo(null)
    setIsMemoEditMode(false)
    setIsNewMemo(false)
  }

  // 备忘录卡片导出按钮点击 - 弹出格式选择
  const handleExportClick = (memoId) => {
    setExportingMemoId(memoId)
    setShowExportModal(true)
  }

  // 统一的导出处理函数
  const handleExport = async (memoId, format) => {
    try {
      // 如果没有指定格式，使用 Markdown 导出
      if (!format) {
        const content = await exportMemo(memoId, 'markdown')
        if (content) {
          const blob = new Blob([content], { type: 'text/markdown' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `memo.md`
          a.click()
          URL.revokeObjectURL(url)
        }
        return
      }

      const result = await downloadMemo(memoId, format)
      if (!result) return

      const { memo } = result
      const filename = memo.title || 'memo'

      if (format === 'png') {
        await exportAsPng(memo.content, memo.title, filename)
      } else if (format === 'jpg') {
        await exportAsJpg(memo.content, memo.title, filename)
      } else if (format === 'pdf') {
        await exportAsPdf(memo.content, memo.title, filename)
      } else if (format === 'docx') {
        await exportAsDocx(memo.content, memo.title, filename)
      } else if (format === 'md') {
        const content = await exportMemo(memoId, 'markdown')
        if (content) {
          const blob = new Blob([content], { type: 'text/markdown' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${filename}.md`
          a.click()
          URL.revokeObjectURL(url)
        }
      } else if (format === 'html') {
        const content = await exportMemo(memoId, 'html')
        if (content) {
          const blob = new Blob([content], { type: 'text/html' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${filename}.html`
          a.click()
          URL.revokeObjectURL(url)
        }
      }
    } catch (error) {
      console.error('导出失败:', error)
      alert('导出失败: ' + error.message)
    }
  }

  const handleNewButtonClick = () => {
    if (activeTab === 'tasks') {
      setShowForm(true)
    } else if (!viewingMemo && !isMemoEditMode && !isNewMemo) {
      // 只在备忘录列表页面可新建备忘
      setIsNewMemo(true)
      setIsMemoEditMode(true)
      setViewingMemo(null)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>📋 小冋记事</h1>

        {/* 标签切换 */}
        <div className="tab-nav">
          <button
            className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            📝 待办事项
          </button>
          <button
            className={`tab-btn ${activeTab === 'memos' ? 'active' : ''}`}
            onClick={() => setActiveTab('memos')}
          >
            📋 备忘录
          </button>
        </div>

        {activeTab === 'tasks' || (!viewingMemo && !isMemoEditMode && !isNewMemo) ? (
          <button className="btn-add" onClick={handleNewButtonClick}>
            + {activeTab === 'tasks' ? '新建待办' : '新建备忘'}
          </button>
        ) : null}
      </header>

      <div className="container">
        {/* 侧边栏 */}
        <aside className="sidebar">
          {activeTab === 'tasks' ? (
            <>
              <div className="sidebar-section">
                <h4 className="sidebar-section-title">状态</h4>
                <div className="sidebar-buttons">
                  <button
                    className={`sidebar-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                  >
                    📋 全部 <span className="count">{stats.total}</span>
                  </button>
                  <button
                    className={`sidebar-btn ${filter === 'pending' ? 'active' : ''}`}
                    onClick={() => setFilter('pending')}
                  >
                    ⏳ 待完成 <span className="count">{stats.pending}</span>
                  </button>
                  <button
                    className={`sidebar-btn ${filter === 'completed' ? 'active' : ''}`}
                    onClick={() => setFilter('completed')}
                  >
                    ✅ 已完成 <span className="count">{stats.completed}</span>
                  </button>
                </div>
              </div>

              <div className="sidebar-section">
                <h4 className="sidebar-section-title">排序</h4>
                <div className="sidebar-buttons">
                  <button
                    className={`sidebar-btn ${taskSortBy === 'updatedAt' ? 'active' : ''}`}
                    onClick={() => setTaskSortBy('updatedAt')}
                  >
                    🕐 修改时间
                  </button>
                  <button
                    className={`sidebar-btn ${taskSortBy === 'urgency' ? 'active' : ''}`}
                    onClick={() => setTaskSortBy('urgency')}
                  >
                    🔥 紧急度
                  </button>
                  <button
                    className={`sidebar-btn ${taskSortBy === 'createdAt' ? 'active' : ''}`}
                    onClick={() => setTaskSortBy('createdAt')}
                  >
                    📅 创建时间
                  </button>
                  <button
                    className={`sidebar-btn ${taskSortBy === 'title' ? 'active' : ''}`}
                    onClick={() => setTaskSortBy('title')}
                  >
                    🔤 标题
                  </button>
                </div>
              </div>
            </>
          ) : (
            <MemoFilters onFilterChange={setMemoFilters} stats={memoStats} />
          )}
        </aside>

        {/* 主内容区 */}
        <main className="main">
          {activeTab === 'tasks' ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredTasks.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="tasks-list">
                  {filteredTasks.length === 0 ? (
                    <div className="empty-state">
                      <p>暂无待办</p>
                      <p>点击右上角「新建待办」开始吧！</p>
                    </div>
                  ) : (
                    filteredTasks.map(task => (
                      <SortableTaskCard
                        key={task.id}
                        task={task}
                        onEdit={openEditModal}
                        onToggle={handleToggleTask}
                        onDelete={showDeleteConfirmation}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
              <DragOverlay>
                {activeId ? (
                  <div className="task-card dragging-overlay" style={{ opacity: 1 }}>
                    {(() => {
                      const task = tasks.find(t => t.id === activeId)
                      return task ? (
                        <div className="task-header">
                          <input
                            type="checkbox"
                            checked={task.status === 'completed'}
                            className="task-checkbox"
                            onChange={() => {}}
                          />
                          <h3 className="task-title">{task.title}</h3>
                          <span className={`priority priority-${task.priority}`}>
                            {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                          </span>
                        </div>
                      ) : null
                    })()}
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          ) : (viewingMemo || isMemoEditMode || isNewMemo) ? (
            <MemoDetail
              memo={viewingMemo}
              onBack={handleBackFromDetail}
              onSave={handleMemoSave}
              onDelete={handleDeleteMemo}
              onExport={handleExport}
              isEditMode={isMemoEditMode}
            />
          ) : (
            <MemoList
              filters={memoFilters}
              setFilters={setMemoFilters}
              onEdit={handleEditMemo}
              onView={handleViewMemo}
              memos={memos}
              loading={memoLoading}
              error={memoError}
              onDelete={handleDeleteMemo}
              onExport={handleExport}
              onExportClick={handleExportClick}
              onArchive={handleArchiveMemo}
              onReorder={reorderMemos}
            />
          )}
        </main>
      </div>

      {/* 备忘录导出模态框 */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={(format) => handleExport(exportingMemoId, format)}
        title={exportingMemoId ? memos.find(m => m.id === exportingMemoId)?.title : ''}
      />

      {/* 任务表单模态框 */}
      {showForm && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setEditingTask(null); setFormData({ title: '', description: '', priority: 'medium', dueDate: '', dueTime: '' }) }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editingTask ? '编辑待办' : '新建待办'}</h2>
            <form onSubmit={editingTask ? handleUpdateTask : handleAddTask}>
              <div className="form-group">
                <label>任务标题 *</label>
                <input
                  type="text"
                  placeholder="输入任务名称..."
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>描述</label>
                <textarea
                  placeholder="输入任务描述..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group popup-selector">
                  <label>优先级</label>
                  <button
                    type="button"
                    className={`selector-btn priority-${formData.priority}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      const container = e.currentTarget.closest('.form-group')
                      const dropdown = container.querySelector('.selector-dropdown')
                      const rect = e.currentTarget.getBoundingClientRect()
                      document.querySelectorAll('.selector-dropdown').forEach(d => {
                        if (d !== dropdown) d.style.display = 'none'
                      })
                      if (dropdown.style.display === 'block') {
                        dropdown.style.display = 'none'
                      } else {
                        dropdown.style.top = rect.bottom + 'px'
                        dropdown.style.left = rect.left + 'px'
                        dropdown.style.right = window.innerWidth - rect.right + 'px'
                        dropdown.style.display = 'block'
                      }
                    }}
                  >
                    {formData.priority === 'high' ? '🔴 高' : formData.priority === 'medium' ? '🟡 中' : '🟢 低'}
                  </button>
                  <div className="selector-dropdown">
                    <button type="button" onClick={() => { setFormData({ ...formData, priority: 'low' }); this.closest('.selector-dropdown').style.display = 'none' }}>🟢 低</button>
                    <button type="button" onClick={() => { setFormData({ ...formData, priority: 'medium' }); this.closest('.selector-dropdown').style.display = 'none' }}>🟡 中</button>
                    <button type="button" onClick={() => { setFormData({ ...formData, priority: 'high' }); this.closest('.selector-dropdown').style.display = 'none' }}>🔴 高</button>
                  </div>
                </div>

                <div className="form-group">
                  <label>截止日期</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="date-input"
                  />
                </div>

                <div className="form-group">
                  <label>截止时间</label>
                  <input
                    type="time"
                    value={formData.dueTime}
                    onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                    className="time-input"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => { setShowForm(false); setEditingTask(null); setFormData({ title: '', description: '', priority: 'medium', dueDate: '', dueTime: '' }) }}>
                  取消
                </button>
                <button type="submit" className="btn-submit">
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 删除任务确认弹窗 */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="删除任务"
        message={taskToDelete ? `确定要删除「${taskToDelete.title}」吗？此操作不可恢复。` : '确定要删除这个任务吗？'}
        confirmText="删除"
        cancelText="取消"
        onConfirm={confirmDeleteTask}
        onCancel={() => { setShowDeleteConfirm(false); setTaskToDelete(null) }}
        danger
      />
    </div>
  )
}

// 可拖拽的任务卡片组件
function SortableTaskCard({ task, onEdit, onToggle, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto'
  }

  // 计算紧急度等级
  const getUrgencyLevel = (task) => {
    // 已过期：完整红色边框 + 左侧红色竖条
    if (task.dueDate && task.status !== 'completed') {
      const dueDateTime = new Date(task.dueDate + (task.dueTime ? 'T' + task.dueTime : 'T23:59:59'))
      if (dueDateTime < new Date()) return 'urgency-overdue'
    }
    // 按优先级显示对应颜色（仅左侧竖条）
    if (task.priority === 'high') return 'urgency-high'
    if (task.priority === 'medium') return 'urgency-medium'
    return 'urgency-low'
  }

  const urgencyLevel = getUrgencyLevel(task)

  const handleClick = (e) => {
    // 如果是拖拽操作，不触发行编辑
    if (!isDragging && task.status !== 'completed') {
      onEdit(task)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-card ${task.status} ${urgencyLevel || ''}`}
      onClick={handleClick}
      {...attributes}
      {...listeners}
    >
      <div className="task-header">
        <input
          type="checkbox"
          checked={task.status === 'completed'}
          onChange={() => onToggle(task)}
          className="task-checkbox"
          onClick={(e) => e.stopPropagation()}
        />
        <h3 className="task-title">{task.title}</h3>
        <span className={`priority priority-${task.priority}`}>
          {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
        </span>
      </div>

      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      <div className="task-footer">
        {task.dueDate && (() => {
          const dueDateTime = new Date(task.dueDate + (task.dueTime ? 'T' + task.dueTime : 'T23:59:59'))
          const isOverdue = dueDateTime < new Date() && task.status !== 'completed'
          return (
            <span className={`task-date ${isOverdue ? 'overdue' : ''}`}>
              📅 {task.dueDate} {task.dueTime ? task.dueTime : ''}
            </span>
          )
        })()}
        <div className="task-actions">
          <button
            className="btn-delete"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(task)
            }}
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
