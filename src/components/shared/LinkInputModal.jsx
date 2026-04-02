import React, { useState, useEffect, useRef } from 'react'
import './LinkInputModal.css'

function LinkInputModal({ isOpen, onClose, onSubmit, initialValue = '' }) {
  const [url, setUrl] = useState(initialValue)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setUrl(initialValue)
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 100)
    }
  }, [isOpen, initialValue])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (url.trim()) {
      onSubmit(url.trim())
    }
  }

  const handleRemove = () => {
    onSubmit('')
  }

  if (!isOpen) return null

  return (
    <div className="link-modal-overlay" onClick={onClose}>
      <div className="link-modal" onClick={(e) => e.stopPropagation()}>
        <div className="link-modal-header">
          <span className="link-modal-title">插入链接</span>
          <button className="link-modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="link-modal-body">
            <label className="link-modal-label">地址 (URL)：</label>
            <input
              ref={inputRef}
              type="url"
              className="link-modal-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          <div className="link-modal-footer">
            <button type="button" className="link-modal-btn link-modal-btn-remove" onClick={handleRemove}>
              移除链接
            </button>
            <div className="link-modal-footer-right">
              <button type="button" className="link-modal-btn link-modal-btn-cancel" onClick={onClose}>
                取消
              </button>
              <button type="submit" className="link-modal-btn link-modal-btn-submit">
                确定
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LinkInputModal
