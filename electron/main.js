const { app, BrowserWindow, Tray, Menu } = require('electron')
const path = require('path')
const isDev = process.env.NODE_ENV === 'development'

let mainWindow
let tray

// 限制单实例
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
      mainWindow.show()
    }
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  // 隐藏菜单栏
  mainWindow.setMenuBarVisibility(false)
  mainWindow.autoHideMenuBar = true

  if (isDev) {
    // 尝试使用5173端口，如果被占用则使用5175
    mainWindow.loadURL('http://localhost:5175')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // 当窗口关闭时，最小化到托盘而不是退出
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })

  // 创建托盘
  createTray()
}

function createTray() {
  // 使用正确的图标路径
  let iconPath
  if (isDev) {
    iconPath = path.join(__dirname, '../public/icon.ico')
  } else {
    // 打包后图标在 resources 目录中
    iconPath = path.join(process.resourcesPath, 'icon.ico')
  }
  
  // 备用路径
  if (!require('fs').existsSync(iconPath)) {
    iconPath = path.join(__dirname, '../public/icon.ico')
  }
  
  tray = new Tray(iconPath)
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示应用',
      click: () => {
        mainWindow.show()
        mainWindow.focus()
      }
    },
    {
      label: '退出应用',
      click: () => {
        app.isQuiting = true
        app.quit()
      }
    }
  ])
  
  tray.setToolTip('小冋记事')
  tray.setContextMenu(contextMenu)
  
  // 点击托盘图标显示/隐藏窗口
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

app.whenReady().then(() => {
  // 设置应用名称，避免通知显示 electron.app.xiaojiong-note
  // 必须在 whenReady 之后调用
  // Windows 下使用 setAppUserModelId 设置通知显示的应用名称
  if (process.platform === 'win32') {
    app.setAppUserModelId('小冋记事')
  }
  createWindow()
})

app.on('window-all-closed', () => {
  // 即使所有窗口关闭，也不退出应用
  // if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (mainWindow) {
    mainWindow.show()
  } else {
    createWindow()
  }
})