import React, { useCallback, useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Image from '@tiptap/extension-image'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Placeholder from '@tiptap/extension-placeholder'
import TextStyle from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import LinkInputModal from './LinkInputModal'
import './TipTapEditor.css'

const COLORS = [
  { name: '默认', value: 'inherit' },
  { name: '红色', value: '#e74c3c' },
  { name: '橙色', value: '#e67e22' },
  { name: '蓝色', value: '#3498db' },
  { name: '绿色', value: '#2ecc71' },
  { name: '紫色', value: '#9b59b6' },
  { name: '灰色', value: '#7f8c8d' },
  { name: '黑色', value: '#2c3e50' }
]

const HIGHLIGHT_COLORS = [
  { name: '无', value: 'transparent' },
  { name: '黄色', value: '#fff3cd' },
  { name: '绿色', value: '#d4edda' },
  { name: '蓝色', value: '#cce5ff' },
  { name: '红色', value: '#f8d7da' },
  { name: '紫色', value: '#e2e3e5' }
]

const FONT_SIZES = [
  { name: '小', value: '12px' },
  { name: '正常', value: '14px' },
  { name: '中', value: '16px' },
  { name: '大', value: '20px' },
  { name: '特大', value: '24px' }
]

function TipTapEditor({ content, onChange, placeholder, extraAction, title, onTitleChange }) {
  const [editorTitle, setEditorTitle] = useState(title || '')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showBgColorPicker, setShowBgColorPicker] = useState(false)
  const [showFontSizePicker, setShowFontSizePicker] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const colorBtnRef = useRef(null)
  const bgColorBtnRef = useRef(null)
  const fontSizeBtnRef = useRef(null)
  const TITLE_MAX_LENGTH = 30

  useEffect(() => {
    if (!showColorPicker && !showBgColorPicker && !showFontSizePicker) return

    const handleClickOutside = (e) => {
      const isDropdownClick = e.target.closest('.dropdown-portal')
      const isButtonClick = colorBtnRef.current?.contains(e.target) || bgColorBtnRef.current?.contains(e.target) || fontSizeBtnRef.current?.contains(e.target)

      if (!isDropdownClick && !isButtonClick) {
        setShowColorPicker(false)
        setShowBgColorPicker(false)
        setShowFontSizePicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showColorPicker, showBgColorPicker, showFontSizePicker])

  const updateDropdownPosition = (btnRef, setter) => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setter({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX })
    }
  }

  const toggleColorPicker = () => {
    if (!showColorPicker) {
      updateDropdownPosition(colorBtnRef, setDropdownPosition)
    }
    setShowColorPicker(!showColorPicker)
    setShowBgColorPicker(false)
    setShowFontSizePicker(false)
  }

  const toggleBgColorPicker = () => {
    if (!showBgColorPicker) {
      updateDropdownPosition(bgColorBtnRef, setDropdownPosition)
    }
    setShowBgColorPicker(!showBgColorPicker)
    setShowColorPicker(false)
    setShowFontSizePicker(false)
  }

  const toggleFontSizePicker = () => {
    if (!showFontSizePicker) {
      updateDropdownPosition(fontSizeBtnRef, setDropdownPosition)
    }
    setShowFontSizePicker(!showFontSizePicker)
    setShowColorPicker(false)
    setShowBgColorPicker(false)
  }

  const handleTitleChange = (e) => {
    const text = e.target.value
    if (text.length <= TITLE_MAX_LENGTH) {
      setEditorTitle(text)
      if (onTitleChange) {
        onTitleChange(text)
      }
    }
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false
      }),
      Underline,
      Image.configure({
        inline: true,
        allowBase64: true
      }),
      TaskList,
      TaskItem.configure({
        nested: true
      }),
      Table.configure({
        resizable: true
      }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({
        placeholder: placeholder || '开始输入...'
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true
      })
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content'
      }
    }
  })

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href || ''
    setLinkUrl(previousUrl)
    setShowLinkModal(true)
  }, [editor])

  const handleLinkSubmit = (url) => {
    if (!editor) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
    setShowLinkModal(false)
  }

  const handleLinkModalClose = () => {
    setShowLinkModal(false)
  }

  const addImage = useCallback(() => {
    if (!editor) return
    const url = window.prompt('输入图片地址')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const addTable = useCallback(() => {
    if (!editor) return
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }, [editor])

  const setColor = (color) => {
    if (!editor) return
    editor.chain().focus().setColor(color === 'inherit' ? '' : color).run()
    setShowColorPicker(false)
  }

  const setHighlight = (color) => {
    if (!editor) return
    editor.chain().focus().toggleHighlight({ color: color === 'transparent' ? null : color }).run()
    setShowBgColorPicker(false)
  }

  const setFontSize = (size) => {
    if (!editor) return
    editor.chain().focus().setFontSize(size).run()
    setShowFontSizePicker(false)
  }

  const getCurrentFontSize = () => {
    if (!editor) return '正常'
    const size = editor.getAttributes('textStyle').fontSize
    const found = FONT_SIZES.find(s => s.value === size)
    return found ? found.name : '正常'
  }

  if (!editor) {
    return null
  }

  return (
    <div className="tiptap-editor-wrapper">
      {/* 固定工具栏 */}
      <div className="tiptap-toolbar">
        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`toolbar-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
            title="加粗 (Ctrl+B)"
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`toolbar-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
            title="斜体 (Ctrl+I)"
          >
            <em>I</em>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`toolbar-btn ${editor.isActive('underline') ? 'is-active' : ''}`}
            title="下划线 (Ctrl+U)"
          >
            <u>U</u>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`toolbar-btn ${editor.isActive('strike') ? 'is-active' : ''}`}
            title="删除线"
          >
            <s>S</s>
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* 文字颜色 */}
        <div className="toolbar-group">
          <div ref={colorBtnRef}>
            <button
              className={`toolbar-btn toolbar-btn-text-color ${showColorPicker ? 'is-active' : ''}`}
              onClick={toggleColorPicker}
              title="文字颜色"
            >
              <span className="text-color-icon" style={{ color: editor.getAttributes('textStyle').color || '#333' }}>A</span>
              <span className="text-color-indicator" style={{ backgroundColor: editor.getAttributes('textStyle').color || '#333' }} />
            </button>
          </div>

          {/* 背景色 */}
          <div ref={bgColorBtnRef}>
            <button
              className={`toolbar-btn toolbar-btn-bg-color ${showBgColorPicker ? 'is-active' : ''}`}
              onClick={toggleBgColorPicker}
              title="背景色"
            >
              <span className="bg-color-icon" style={{ backgroundColor: editor.getAttributes('highlight').color || '#fff3cd', color: '#333' }}>A</span>
            </button>
          </div>

          {/* 字号 */}
          <div ref={fontSizeBtnRef}>
            <button
              className={`toolbar-btn toolbar-btn-font-size ${showFontSizePicker ? 'is-active' : ''}`}
              onClick={toggleFontSizePicker}
              title="字号"
            >
              <span className="font-size-icon">T</span>
              <span className="font-size-indicator">{getCurrentFontSize()}</span>
            </button>
          </div>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`toolbar-btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}
            title="无序列表"
          >
            <span className="list-icon">≡</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`toolbar-btn ${editor.isActive('orderedList') ? 'is-active' : ''}`}
            title="有序列表"
          >
            <span className="list-icon">1.</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`toolbar-btn ${editor.isActive('taskList') ? 'is-active' : ''}`}
            title="待办清单"
          >
            <span className="list-icon">☐</span>
          </button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <button
            onClick={addImage}
            className="toolbar-btn"
            title="插入图片"
          >
            🖼️
          </button>
          <button
            onClick={addTable}
            className="toolbar-btn"
            title="插入表格"
          >
            ▦
          </button>
          <button
            onClick={setLink}
            className={`toolbar-btn ${editor.isActive('link') ? 'is-active' : ''}`}
            title="插入链接"
          >
            🔗
          </button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            className="toolbar-btn"
            disabled={!editor.can().undo()}
            title="撤销"
          >
            ↩️
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            className="toolbar-btn"
            disabled={!editor.can().redo()}
            title="重做"
          >
            ↪️
          </button>
        </div>

        {/* 右侧扩展操作 */}
        {extraAction && (
          <>
            <div className="toolbar-divider" />
            <div className="toolbar-group toolbar-extra">
              {extraAction}
            </div>
          </>
        )}
      </div>

      {/* 标题输入框 */}
      <div className="title-input-wrapper">
        <input
          type="text"
          className="title-input"
          value={editorTitle}
          onChange={handleTitleChange}
          placeholder="标题（最多30字）..."
          maxLength={30}
        />
        <span className="title-char-count">{editorTitle.length}/30</span>
      </div>

      {/* 编辑器内容 */}
      <EditorContent editor={editor} className="tiptap-content" />

      {/* Portal 渲染的下拉菜单 */}
      {showColorPicker && createPortal(
        <div className="color-dropdown grid-4col dropdown-portal" style={{ top: dropdownPosition.top, left: dropdownPosition.left }}>
          {COLORS.map(c => (
            <button
              key={c.value}
              className="color-option"
              onClick={() => setColor(c.value)}
              style={{ color: c.value === 'inherit' ? '#333' : c.value }}
            >
              Aa
            </button>
          ))}
        </div>,
        document.body
      )}

      {showBgColorPicker && createPortal(
        <div className="color-dropdown grid-4col dropdown-portal" style={{ top: dropdownPosition.top, left: dropdownPosition.left }}>
          {HIGHLIGHT_COLORS.map(c => (
            <button
              key={c.value}
              className="color-option"
              onClick={() => setHighlight(c.value)}
              style={{ backgroundColor: c.value === 'transparent' ? '#fff' : c.value, color: '#333' }}
            >
              Aa
            </button>
          ))}
        </div>,
        document.body
      )}

      {showFontSizePicker && createPortal(
        <div className="font-size-dropdown dropdown-portal" style={{ top: dropdownPosition.top, left: dropdownPosition.left }}>
          {FONT_SIZES.map(s => (
            <button
              key={s.value}
              className="font-size-option"
              onClick={() => setFontSize(s.value)}
            >
              {s.name}
            </button>
          ))}
        </div>,
        document.body
      )}

      {/* 链接输入弹窗 */}
      <LinkInputModal
        isOpen={showLinkModal}
        onClose={handleLinkModalClose}
        onSubmit={handleLinkSubmit}
        initialValue={linkUrl}
      />
    </div>
  )
}

export default TipTapEditor
