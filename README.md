# 小冋记事 - 跨平台 Todo List 和记事本应用

一个简洁高效的桌面/移动端记事本应用，支持任务管理和富文本备忘录功能。

## 功能特性

### 任务管理
- ✅ 创建、编辑、删除任务
- ✅ 标记任务完成/未完成
- ✅ 高/中/低三级优先级
- ✅ 设置截止日期和时间
- ✅ 任务筛选（全部/待完成/已完成）
- ✅ 统计数据展示
- ✅ 拖拽排序

### 备忘录
- ✅ 富文本编辑器（加粗、斜体、颜色、背景色、字号等）
- ✅ 多种导出格式（PDF/Word/HTML/Markdown/JPG）
- ✅ 归档/取消归档
- ✅ 搜索和筛选
- ✅ 标题和内容分离

### 系统
- ✅ 本地数据存储（IndexedDB）
- ✅ 响应式布局
- ✅ 跨平台打包（Windows/macOS/Linux/Android）

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | React 18.2 + Vite 5.1 |
| 桌面端 | Electron 29 |
| 移动端 | Capacitor 8.3 |
| 富文本编辑器 | TipTap 2.1 |
| 导出库 | docx, html2canvas, jspdf |
| 拖拽 | @dnd-kit |

## 运行项目

```bash
# 安装依赖
npm install

# 开发模式（前端预览）
npm run dev

# Electron 桌面应用开发
npm run electron

# 打包桌面应用
npm run dist
```

## 项目结构

```
taskflow/
├── electron/
│   └── main.js              # Electron 主进程
├── src/
│   ├── components/
│   │   ├── memo/            # 备忘录组件
│   │   │   ├── MemoCard.jsx/css    # 备忘录卡片
│   │   │   ├── MemoDetail.jsx/css   # 备忘录详情
│   │   │   ├── MemoFilters.jsx/css # 筛选器
│   │   │   ├── MemoForm.jsx        # 备忘录表单
│   │   │   └── MemoList.jsx/css    # 备忘录列表
│   │   └── shared/          # 共享组件
│   │       ├── TipTapEditor.jsx/css # 富文本编辑器
│   │       ├── ExportModal.jsx/css   # 导出弹窗
│   │       ├── ConfirmModal.jsx/css  # 确认弹窗
│   │       ├── LinkInputModal.jsx/css # 链接输入弹窗
│   │       └── Modal.jsx            # 通用模态框
│   ├── hooks/
│   │   ├── useMemo.js              # 备忘录状态管理
│   │   └── useTaskNotification.js   # 任务通知
│   ├── services/
│   │   ├── db.js                   # IndexedDB 数据库
│   │   ├── memoService.js          # 备忘录业务逻辑
│   │   └── exportService.js        # 导出服务
│   ├── App.jsx/css                 # 主组件
│   └── index.css                   # 全局样式
├── public/
├── docs/                           # 设计文档
├── package.json
└── vite.config.js
```

## 快捷键

| 功能 | 快捷键 |
|------|--------|
| 加粗 | Ctrl+B |
| 斜体 | Ctrl+I |
| 下划线 | Ctrl+U |

## 版本

- **当前版本**: v1.0.1
- **更新日期**: 2026-04-02

### 更新日志

#### v1.0.1 (2026-04-02)
- ✅ 待办事项卡片增加优先级颜色标识（高=红色，中=黄色，低=绿色）
- ✅ 已过期待办显示红色边框+红色时间
- ✅ 已完成待办自动移至列表末尾
- ✅ 优先级下拉弹窗修复被遮挡问题

#### v1.0.0 (2026-04-01)
- 正式版本发布
