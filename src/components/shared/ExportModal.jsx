import React from 'react'
import './ExportModal.css'

const EXPORT_FORMATS = [
  { id: 'pdf', name: 'PDF文档', icon: '📄', desc: '便携式文档格式' },
  { id: 'docx', name: 'Word文档', icon: '📝', desc: 'Microsoft Word格式' },
  { id: 'md', name: 'Markdown', icon: '📋', desc: '轻量级标记语言' },
  { id: 'html', name: 'HTML网页', icon: '🌐', desc: '网页格式' },
  { id: 'jpg', name: 'JPG图片', icon: '🖼️', desc: '图片格式' }
]

function ExportModal({ isOpen, onClose, onExport, title }) {
  if (!isOpen) return null

  const handleExport = async (format) => {
    await onExport(format)
    onClose()
  }

  return (
    <div className="export-modal-overlay" onClick={onClose}>
      <div className="export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="export-modal-header">
          <h3>导出为</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="export-modal-content">
          {EXPORT_FORMATS.map((format) => (
            <button
              key={format.id}
              className="export-option"
              onClick={() => handleExport(format.id)}
            >
              <span className="export-icon">{format.icon}</span>
              <div className="export-info">
                <span className="export-name">{format.name}</span>
                <span className="export-desc">{format.desc}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ExportModal
