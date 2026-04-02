import React, { useRef, useEffect, useState } from 'react'
import './RichTextEditor.css'

const COLORS = [
  { name: '默认', value: 'inherit' },
  { name: '红色', value: '#e74c3c' },
  { name: '橙色', value: '#e67e22' },
  { name: '黄色', value: '#f1c40f' },
  { name: '绿色', value: '#2ecc71' },
  { name: '蓝色', value: '#3498db' },
  { name: '紫色', value: '#9b59b6' },
  { name: '灰色', value: '#7f8c8d' }
]

const BG_COLORS = [
  { name: '无', value: 'transparent' },
  { name: '黄色', value: '#fff3cd' },
  { name: '绿色', value: '#d4edda' },
  { name: '蓝色', value: '#cce5ff' },
  { name: '红色', value: '#f8d7da' },
  { name: '灰色', value: '#e2e3e5' }
]

const TITLE_MAX_LENGTH = 30
const TITLE_PLACEHOLDER = '标题（最多30字）...'

function RichTextEditor({ value, onChange, placeholder }) {
  const editorRef = useRef(null)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showBgColorPicker, setShowBgColorPicker] = useState(false)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [isComposing, setIsComposing] = useState(false)

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && value && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || ''
      ensureTitleFormat()
    }
  }, [])

  // Ensure first line is in title format
  const ensureTitleFormat = () => {
    if (!editorRef.current) return

    const editor = editorRef.current

    // If editor is empty, create initial title div
    if (!editor.innerHTML.trim()) {
      const titleDiv = document.createElement('div')
      titleDiv.className = 'title-line'
      titleDiv.textContent = ''
      titleDiv.setAttribute('data-placeholder', TITLE_PLACEHOLDER)
      editor.appendChild(titleDiv)
      return
    }

    // Check if first child is a title-line div
    const firstChild = editor.firstChild

    if (firstChild) {
      if (firstChild.nodeType === Node.TEXT_NODE) {
        // Text node at start - wrap in title div
        const titleDiv = document.createElement('div')
        titleDiv.className = 'title-line'
        titleDiv.textContent = firstChild.textContent
        titleDiv.setAttribute('data-placeholder', TITLE_PLACEHOLDER)
        editor.insertBefore(titleDiv, firstChild)
        editor.removeChild(firstChild)
      } else if (firstChild.className !== 'title-line') {
        // First element exists but not title - insert title div before it
        const titleDiv = document.createElement('div')
        titleDiv.className = 'title-line'
        titleDiv.setAttribute('data-placeholder', TITLE_PLACEHOLDER)
        editor.insertBefore(titleDiv, firstChild)
      } else {
        // Already has title-line, set placeholder if empty
        if (!firstChild.textContent.trim()) {
          firstChild.setAttribute('data-placeholder', TITLE_PLACEHOLDER)
        }
      }
    }
  }

  const handleInput = (e) => {
    if (!editorRef.current || isComposing) return

    const editor = editorRef.current
    const firstChild = editor.firstChild

    // Check if first line exceeds 30 chars
    if (firstChild && firstChild.className === 'title-line') {
      const text = firstChild.textContent || ''
      if (text.length > TITLE_MAX_LENGTH) {
        // Truncate to 30 chars
        firstChild.textContent = text.substring(0, TITLE_MAX_LENGTH)
        // Move cursor to end
        const range = document.createRange()
        const sel = window.getSelection()
        range.setStart(firstChild, TITLE_MAX_LENGTH)
        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
      }
    }

    ensureTitleFormat()
    onChange(editor.innerHTML)
  }

  const handleCompositionStart = () => {
    setIsComposing(true)
  }

  const handleCompositionEnd = () => {
    setIsComposing(false)
    handleInput()
  }

  const handlePaste = (e) => {
    e.preventDefault()
    if (!editorRef.current) return

    const text = e.clipboardData.getData('text')
    const firstChild = editorRef.current.firstChild

    if (firstChild && firstChild.className === 'title-line') {
      const currentText = firstChild.textContent || ''
      const remaining = TITLE_MAX_LENGTH - currentText.length

      if (remaining > 0) {
        const textToInsert = text.substring(0, remaining)
        document.execCommand('insertText', false, textToInsert)
      }
    } else {
      // No title line yet, paste as new title
      document.execCommand('insertText', false, text.substring(0, TITLE_MAX_LENGTH))
    }

    ensureTitleFormat()
    onChange(editorRef.current.innerHTML)
  }

  const handleKeyDown = (e) => {
    const editor = editorRef.current
    if (!editor) return

    const selection = window.getSelection()
    if (!selection.rangeCount) return

    const range = selection.getRangeAt(0)
    const node = range.startContainer
    const currentLine = node.nodeType === Node.TEXT_NODE ? node.parentElement : node
    const isFirstLine = currentLine === editor.firstChild ||
                        (editor.firstChild && editor.firstChild.className === 'title-line' &&
                         currentLine.className === 'title-line')

    // Enter key handling
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()

      if (isFirstLine && currentLine.className === 'title-line') {
        // On title line, create new paragraph
        const p = document.createElement('p')
        p.textContent = ''
        editor.insertBefore(p, currentLine.nextSibling)
        // Move cursor to new paragraph
        range.setStart(p, 0)
        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)
        editorRef.current.focus()
      } else if (isFirstLine) {
        // First line but not title div - ensure title exists then create new line
        if (!editor.firstChild.className?.includes('title-line')) {
          ensureTitleFormat()
        }
        const p = document.createElement('p')
        p.textContent = ''
        if (currentLine.nextSibling) {
          editor.insertBefore(p, currentLine.nextSibling)
        } else {
          editor.appendChild(p)
        }
        range.setStart(p, 0)
        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)
        editorRef.current.focus()
      }
      return
    }

    // Backspace at start of title line - prevent deletion
    if (e.key === 'Backspace' && isFirstLine) {
      const text = currentLine.textContent || ''
      if (range.startOffset === 0 && text.length === 0) {
        e.preventDefault()
        return
      }
      // Don't allow backspace if it would delete the title
      if (currentLine.className === 'title-line' && text.length <= 1) {
        e.preventDefault()
        return
      }
    }
  }

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleInput()
  }

  const handleBold = () => execCommand('bold')
  const handleItalic = () => execCommand('italic')
  const handleUnderline = () => execCommand('underline')
  const handleStrikeThrough = () => execCommand('strikeThrough')

  const handleColor = (color) => {
    execCommand('foreColor', color === 'inherit' ? '' : color)
    setShowColorPicker(false)
  }

  const handleBgColor = (color) => {
    execCommand('hiliteColor', color === 'transparent' ? '' : color)
    setShowBgColorPicker(false)
  }

  const handleLink = () => {
    if (linkUrl) {
      execCommand('createLink', linkUrl)
    }
    setShowLinkInput(false)
    setLinkUrl('')
  }

  const handleUnlink = () => execCommand('unlink')

  useEffect(() => {
    if (!isComposing) {
      setTimeout(ensureTitleFormat, 0)
    }
  }, [value, isComposing])

  return (
    <div className="rich-text-editor">
      <div className="toolbar">
        <button type="button" className="toolbar-btn" onClick={handleBold} title="加粗">
          <strong>B</strong>
        </button>
        <button type="button" className="toolbar-btn" onClick={handleItalic} title="斜体">
          <em>I</em>
        </button>
        <button type="button" className="toolbar-btn" onClick={handleUnderline} title="下划线">
          <u>U</u>
        </button>
        <button type="button" className="toolbar-btn" onClick={handleStrikeThrough} title="删除线">
          <s>S</s>
        </button>

        <div className="toolbar-divider" />

        <div className="color-picker-wrapper">
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => setShowColorPicker(!showColorPicker)}
            title="文字颜色"
          >
            <span className="color-icon">A</span>
          </button>
          {showColorPicker && (
            <div className="color-picker">
              {COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  className="color-option"
                  style={{ color: c.value === 'inherit' ? '#333' : c.value }}
                  onClick={() => handleColor(c.value)}
                >
                  A
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="color-picker-wrapper">
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => setShowBgColorPicker(!showBgColorPicker)}
            title="背景色"
          >
            <span className="bg-color-icon">A</span>
          </button>
          {showBgColorPicker && (
            <div className="color-picker">
              {BG_COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  className="color-option"
                  style={{ backgroundColor: c.value }}
                  onClick={() => handleBgColor(c.value)}
                >
                  A
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="toolbar-divider" />

        <div className="link-wrapper">
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => setShowLinkInput(!showLinkInput)}
            title="插入链接"
          >
            🔗
          </button>
          {showLinkInput && (
            <div className="link-input">
              <input
                type="url"
                placeholder="输入链接地址"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLink()}
              />
              <button type="button" onClick={handleLink}>确定</button>
            </div>
          )}
        </div>
        <button type="button" className="toolbar-btn" onClick={handleUnlink} title="移除链接">
          🔗✖
        </button>
      </div>

      <div
        ref={editorRef}
        className="editor-content"
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onPaste={handlePaste}
        data-placeholder={placeholder || '开始输入...'}
        suppressContentEditableWarning
      />
    </div>
  )
}

export default RichTextEditor