import React from 'react'
import './ConfirmModal.css'

/**
 * 确认对话框组件 - 替代浏览器原生 confirm()
 */
function ConfirmModal({ isOpen, title, message, confirmText = '确定', cancelText = '取消', onConfirm, onCancel, danger = false }) {
  if (!isOpen) return null

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel()
    }
  }

  return (
    <div className="confirm-modal-overlay" onClick={handleOverlayClick}>
      <div className="confirm-modal">
        <div className="confirm-modal-header">
          <h3>{title || '确认操作'}</h3>
        </div>
        <div className="confirm-modal-body">
          <p>{message}</p>
        </div>
        <div className="confirm-modal-footer">
          <button className="btn-confirm-cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button className={`btn-confirm-${danger ? 'danger' : 'primary'}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal