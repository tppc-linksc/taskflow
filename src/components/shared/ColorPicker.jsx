import React from 'react'

const COLORS = [
  { name: 'blue', label: '蓝色', value: '#1890ff' },
  { name: 'green', label: '绿色', value: '#52c41a' },
  { name: 'red', label: '红色', value: '#cf1322' },
  { name: 'yellow', label: '黄色', value: '#faad14' },
  { name: 'purple', label: '紫色', value: '#722ed1' }
]

/**
 * 颜色选择器组件
 */
function ColorPicker({ selected, onChange }) {
  return (
    <div className="color-picker">
      {COLORS.map(color => (
        <button
          key={color.name}
          type="button"
          className={`color-option ${selected === color.name ? 'selected' : ''}`}
          style={{ backgroundColor: color.value }}
          onClick={() => onChange(color.name)}
          title={color.label}
          aria-label={`选择${color.label}`}
        />
      ))}
    </div>
  )
}

export default ColorPicker
