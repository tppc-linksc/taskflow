# 小冋记事 备忘录系统实现计划

> **目标:** 在小冋记事应用中添加平行于待办事项的备忘录功能

**架构:** 模块化组件架构，使用IndexedDB存储，标签切换集成

---

## Task 1: 创建UUID工具
- 创建 `src/utils/uuid.js`
- 创建测试文件

## Task 2: 创建IndexedDB数据库封装
- 创建 `src/services/db.js`
- 创建测试文件

## Task 3: 创建备忘录业务服务层
- 创建 `src/services/memoService.js`
- 创建测试文件

## Task 4: 创建备忘录自定义Hook
- 创建 `src/hooks/useMemo.js`
- 创建测试文件

## Task 5: 创建共享组件
- `src/components/shared/Modal.jsx`
- `src/components/shared/ColorPicker.jsx`

## Task 6: 创建备忘录UI组件
- `src/components/memo/MemoCard.jsx`
- `src/components/memo/MemoList.jsx`
- `src/components/memo/MemoForm.jsx`
- `src/components/memo/MemoFilters.jsx`

## Task 7: 集成到App.jsx
- 添加标签切换状态
- 集成所有备忘录组件

## Task 8: 添加样式
- App.css补充备忘录样式
