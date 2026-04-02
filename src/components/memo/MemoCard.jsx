import React, { useState } from 'react'
import './MemoCard.css'
import ConfirmModal from '../shared/ConfirmModal'

/**
 * 备忘录卡片组件
 * 点击卡片进入编辑模式
 */
function MemoCard({ memo, onEdit, onDelete, onExport, onExportClick, onArchive, onCardClick }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getContentPreview = (html) => {
    if (!html) return ''
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    const content = tempDiv.innerHTML
    if (content.length > 200) {
      return content.substring(0, 200) + '...'
    }
    return content || ''
  }

  const handleCardClick = (e) => {
    if (!e.target.closest('.memo-actions')) {
      if (onCardClick) {
        onCardClick(e)
      } else {
        onEdit(memo)
      }
    }
  }

  const handleExport = (e) => {
    e.stopPropagation()
    if (onExportClick) {
      onExportClick(memo.id)
    } else if (onExport) {
      onExport(memo.id)
    }
  }

  const handleArchive = (e) => {
    e.stopPropagation()
    onArchive(memo)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    onDelete(memo.id)
    setShowDeleteConfirm(false)
  }

  return (
    <>
      <div
        className={`memo-card ${memo.isArchived ? 'archived' : ''}`}
        onClick={handleCardClick}
      >
        <div className="memo-header">
          <span className="memo-icon">📋</span>
          <h3 className="memo-title">{memo.title}</h3>
        </div>

        {memo.content && (
          <p
            className="memo-description"
            dangerouslySetInnerHTML={{ __html: getContentPreview(memo.content) }}
          />
        )}

        <div className="memo-footer">
          <span className="memo-time">
            {formatDate(memo.updatedAt)}
          </span>
          <div className="memo-actions">
            <button className="btn-action btn-archive" onClick={handleArchive} title={memo.isArchived ? '取消归档' : '归档'}>
              {memo.isArchived ? '📂' : '📋'}
            </button>
            <button className="btn-action" onClick={handleExport} title="导出">
              📤
            </button>
            <button className="btn-action btn-delete-action" onClick={handleDelete} title="删除">
              🗑️
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="删除备忘录"
        message={`确定要删除「${memo.title}」吗？此操作不可恢复。`}
        confirmText="删除"
        cancelText="取消"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        danger
      />
    </>
  )
}

export default MemoCard