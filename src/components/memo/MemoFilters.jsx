import React, { useState } from 'react'
import './MemoFilters.css'

/**
 * 备忘录筛选侧边栏组件
 */
function MemoFilters({ onFilterChange, stats }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('updatedAt')
  const [archiveStatus, setArchiveStatus] = useState('unarchived')

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchQuery(value)
    onFilterChange({ searchQuery: value, sortBy, archiveStatus })
  }

  const handleSortChange = (newSort) => {
    setSortBy(newSort)
    onFilterChange({ searchQuery, sortBy: newSort, archiveStatus })
  }

  const handleArchiveStatusChange = (newStatus) => {
    setArchiveStatus(newStatus)
    onFilterChange({ searchQuery, sortBy, archiveStatus: newStatus })
  }

  const unarchivedCount = (stats?.total || 0) - (stats?.archived || 0)

  return (
    <div className="memo-filters">
      {/* 搜索框 */}
      <div className="search-box">
        <input
          type="text"
          placeholder="搜索备忘录..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      <div className="sidebar-section">
        <h4 className="sidebar-section-title">显示</h4>
        <div className="sidebar-buttons">
          <button
            className={`sidebar-btn ${archiveStatus === 'all' ? 'active' : ''}`}
            onClick={() => handleArchiveStatusChange('all')}
          >
            📋 全部 <span className="count">{stats?.total || 0}</span>
          </button>
          <button
            className={`sidebar-btn ${archiveStatus === 'unarchived' ? 'active' : ''}`}
            onClick={() => handleArchiveStatusChange('unarchived')}
          >
            📝 未归档 <span className="count">{unarchivedCount}</span>
          </button>
          <button
            className={`sidebar-btn ${archiveStatus === 'archived' ? 'active' : ''}`}
            onClick={() => handleArchiveStatusChange('archived')}
          >
            📦 已归档 <span className="count">{stats?.archived || 0}</span>
          </button>
        </div>
      </div>

      <div className="sidebar-section">
        <h4 className="sidebar-section-title">排序</h4>
        <div className="sidebar-buttons">
          <button
            className={`sidebar-btn ${sortBy === 'updatedAt' ? 'active' : ''}`}
            onClick={() => handleSortChange('updatedAt')}
          >
            🕐 修改时间
          </button>
          <button
            className={`sidebar-btn ${sortBy === 'createdAt' ? 'active' : ''}`}
            onClick={() => handleSortChange('createdAt')}
          >
            📅 创建时间
          </button>
          <button
            className={`sidebar-btn ${sortBy === 'title' ? 'active' : ''}`}
            onClick={() => handleSortChange('title')}
          >
            🔤 标题
          </button>
        </div>
      </div>
    </div>
  )
}

export default MemoFilters