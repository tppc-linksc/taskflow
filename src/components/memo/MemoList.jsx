import React, { useState, useEffect } from 'react'
import MemoCard from './MemoCard'
import './MemoList.css'
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
  verticalListSortingStrategy,
  useSortable,
  arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

/**
 * 可拖拽的备忘录卡片
 */
function SortableMemoCard({ memo, onEdit, onView, onDelete, onExport, onExportClick, onArchive }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: memo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  }

  const handleCardClick = (e) => {
    if (!e.target.closest('.memo-actions')) {
      onEdit(memo)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <MemoCard
        memo={memo}
        onEdit={onEdit}
        onView={onView}
        onDelete={onDelete}
        onExport={onExport}
        onExportClick={onExportClick}
        onArchive={onArchive}
        onCardClick={handleCardClick}
      />
    </div>
  )
}

/**
 * 备忘录列表组件
 */
function MemoList({
  filters,
  setFilters,
  onEdit,
  onView,
  memos,
  loading,
  error,
  onDelete,
  onExport,
  onExportClick,
  onArchive,
  onReorder
}) {
  const [filteredMemos, setFilteredMemos] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [activeId, setActiveId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  )

  // 不要在拖拽时重新排序
  useEffect(() => {
    if (isDragging) return

    let result = [...memos]

    // 归档状态筛选
    if (filters.archiveStatus === 'archived') {
      result = result.filter(memo => memo.isArchived)
    } else if (filters.archiveStatus === 'unarchived') {
      result = result.filter(memo => !memo.isArchived)
    }

    // 搜索筛选
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      result = result.filter(memo =>
        memo.title.toLowerCase().includes(query) ||
        memo.content.toLowerCase().includes(query)
      )
    }

    // 排序 - 按 filters.sortBy 排序
    if (filters.sortBy === 'createdAt') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    } else if (filters.sortBy === 'updatedAt') {
      result.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    } else if (filters.sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title))
    } else {
      // 默认按order字段排序
      result.sort((a, b) => (a.order || 0) - (b.order || 0))
    }

    setFilteredMemos(result)
  }, [memos, filters, isDragging])

  const handleDragStart = (event) => {
    setIsDragging(true)
    setActiveId(event.active.id)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setIsDragging(false)

    if (over && active.id !== over.id) {
      const oldIndex = filteredMemos.findIndex(m => m.id === active.id)
      const newIndex = filteredMemos.findIndex(m => m.id === over.id)
      if (oldIndex !== -1 && newIndex !== -1) {
        // 乐观更新本地状态
        const newMemos = arrayMove([...filteredMemos], oldIndex, newIndex)
        setFilteredMemos(newMemos)
        // 调用父组件的 reorder 回调
        if (onReorder) {
          onReorder(newMemos.map((m, i) => ({ id: m.id, order: i + 1 })))
        }
        // 拖拽结束后，切换到 order 排序，使拖拽结果生效
        if (setFilters) {
          setFilters(prev => ({ ...prev, sortBy: 'order' }))
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <p>加载中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error">
        <p>加载失败: {error}</p>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={filteredMemos.map(m => m.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="memo-list">
          {filteredMemos.length === 0 ? (
            <div className="empty-state">
              <p>暂无备忘录</p>
              <p>点击右上角「新建备忘」开始记录</p>
            </div>
          ) : (
            filteredMemos.map(memo => (
              <SortableMemoCard
                key={memo.id}
                memo={memo}
                onEdit={onEdit}
                onView={onView}
                onDelete={onDelete}
                onExport={onExport}
                onExportClick={onExportClick}
                onArchive={onArchive}
              />
            ))
          )}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeId ? (
          <div className="memo-card dragging-overlay">
            {(() => {
              const memo = filteredMemos.find(m => m.id === activeId)
              return memo ? (
                <>
                  <div className="memo-header">
                    <span className="memo-icon">📋</span>
                    <h3 className="memo-title">{memo.title}</h3>
                  </div>
                  {memo.content && (
                    <p className="memo-description">
                      {memo.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                    </p>
                  )}
                </>
              ) : null
            })()}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export default MemoList