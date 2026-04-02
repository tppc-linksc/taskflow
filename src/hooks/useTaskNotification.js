import { useEffect, useRef } from 'react'

const NOTIFICATION_KEY = 'taskflow_notified_tasks'

export function useTaskNotification(tasks) {
  const notifiedTasksRef = useRef(new Set(JSON.parse(localStorage.getItem(NOTIFICATION_KEY) || '[]')))

  useEffect(() => {
    const checkOverdueTasks = () => {
      const now = new Date()

      tasks.forEach(task => {
        if (task.status !== 'pending') return
        if (!task.dueDate || !task.dueTime) return

        const dueDateTime = new Date(`${task.dueDate}T${task.dueTime}`)
        if (dueDateTime >= now) return // 未过期
        if (notifiedTasksRef.current.has(task.id)) return // 已经提醒过

        // 标记为已通知
        notifiedTasksRef.current.add(task.id)
        localStorage.setItem(NOTIFICATION_KEY, JSON.stringify([...notifiedTasksRef.current]))

        // 发送通知
        if (Notification.permission === 'granted') {
          new Notification('任务超时提醒', {
            body: `任务 "${task.title}" 已超过截止时间未完成`,
            icon: '/icon.ico'
          })
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification('任务超时提醒', {
                body: `任务 "${task.title}" 已超过截止时间未完成`,
                icon: '/icon.ico'
              })
            }
          })
        }
      })
    }

    // 首次检查
    checkOverdueTasks()

    // 每分钟检查一次
    const interval = setInterval(checkOverdueTasks, 60000)

    // 页面可见性变化时也检查
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkOverdueTasks()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [tasks])
}
