import React, { useState, useEffect, useRef } from 'react'
import './MemoDetail.css'
import TipTapEditor from '../shared/TipTapEditor'
import ExportModal from '../shared/ExportModal'
import ConfirmModal from '../shared/ConfirmModal'

/**
 * 备忘录详情页组件
 */
function MemoDetail({ memo, onBack, onSave, onDelete, onExport, isEditMode = false }) {
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const [content, setContent] = useState(memo?.content || '')
  const [title, setTitle] = useState(memo?.title || '')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const lastSavedContentRef = useRef(memo?.content || '')
  const lastSavedTitleRef = useRef(memo?.title || '')

  useEffect(() => {
    if (memo) {
      setContent(memo.content || '')
      setTitle(memo.title || '')
      lastSavedContentRef.current = memo.content || ''
      lastSavedTitleRef.current = memo.title || ''
      setHasUnsavedChanges(false)
    }
  }, [memo])

  const handleContentChange = (newContent) => {
    setContent(newContent)
    setHasUnsavedChanges(newContent !== lastSavedContentRef.current || title !== lastSavedTitleRef.current)
  }

  const handleTitleChange = (newTitle) => {
    setTitle(newTitle)
    setHasUnsavedChanges(newTitle !== lastSavedTitleRef.current || content !== lastSavedContentRef.current)
  }

  const handleBack = async () => {
    // 如果有未保存的更改，先保存
    if (hasUnsavedChanges && content.trim()) {
      await onSave({ title, content })
    }
    onBack()
  }

  const handleSave = async () => {
    if (onSave && content.trim()) {
      await onSave({ title, content })
      lastSavedTitleRef.current = title
      lastSavedContentRef.current = content
      setHasUnsavedChanges(false)
    }
  }

  const handleExport = async (format) => {
    if (memo) {
      await onExport(memo.id, format)
    }
    setShowExportModal(false)
  }

  const confirmDelete = () => {
    onDelete(memo.id)
    setShowDeleteConfirm(false)
  }

  return (
    <div className="memo-detail">
      {/* 顶部导航栏 - 仅在非编辑模式显示 */}
      {!isEditMode && (
        <div className="memo-detail-header">
          <button className="btn-back" onClick={handleBack}>
            返  回
          </button>
          <div className="memo-detail-actions">
            {memo ? (
              <>
                <button className="btn-edit" onClick={() => onSave({ title: memo.title, content: memo.content }, true)}>
                  编辑
                </button>
                <button className="btn-export" onClick={() => setShowExportModal(true)}>
                  导出
                </button>
                <button className="btn-delete" onClick={() => setShowDeleteConfirm(true)}>
                  🗑️ 删除
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* 备忘录内容 */}
      <div className="memo-detail-content">
        {isEditMode ? (
          <div className="memo-edit-content">
            <TipTapEditor
              content={content}
              onChange={handleContentChange}
              title={title}
              onTitleChange={handleTitleChange}
              placeholder="开始输入内容..."
              extraAction={
                <button className="toolbar-btn" onClick={handleBack} title="返回">
                  返  回
                </button>
              }
            />
          </div>
        ) : (
          <>
            <h1 className="memo-detail-title">{memo?.title}</h1>
            <div className="memo-detail-meta">
              <span className="memo-detail-time">
                {memo?.updatedAt ? formatDate(memo.updatedAt) : ''}
              </span>
              {memo?.isArchived && (
                <span className="memo-detail-archived">
                  已归档
                </span>
              )}
            </div>

            <div
              className="memo-detail-body"
              dangerouslySetInnerHTML={{ __html: memo?.content }}
            />
          </>
        )}
      </div>

      {/* 导出弹窗 */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title={memo?.title}
      />

      {/* 删除确认弹窗 */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="删除备忘录"
        message={`确定要删除「${memo?.title}」吗？此操作不可恢复。`}
        confirmText="删除"
        cancelText="取消"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        danger
      />
    </div>
  )
}

export default MemoDetail