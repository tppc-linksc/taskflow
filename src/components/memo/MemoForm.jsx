import React, { useState, useEffect } from 'react'
import RichTextEditor from '../shared/RichTextEditor'

/**
 * 备忘录表单组件
 */
function MemoForm({ memo, onSubmit, onCancel }) {
  const [content, setContent] = useState('')

  useEffect(() => {
    if (memo) {
      setContent(memo.content || '')
    } else {
      setContent('')
    }
  }, [memo])

  const extractTitle = (html) => {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    const text = tempDiv.textContent || tempDiv.innerText || ''
    const lines = text.split('\n').filter(line => line.trim())
    return lines[0]?.trim() || '无标题'
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!content.trim()) return
    
    const title = extractTitle(content)
    onSubmit({ title, content })
  }

  return (
    <form onSubmit={handleSubmit} className="memo-form">
      <div className="form-group">
        <label>备忘录内容</label>
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="第一行将作为标题...&#10;后续内容支持富文本编辑"
        />
      </div>

      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={onCancel}>
          取消
        </button>
        <button type="submit" className="btn-submit">
          保存
        </button>
      </div>
    </form>
  )
}

export default MemoForm