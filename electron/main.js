const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

let mainWindow
let pythonProcess

const IS_DEV = !app.isPackaged
const PYTHON_BACKEND_URL = 'http://127.0.0.1:8765'

// 启动 Python 后端
function startPythonBackend() {
  const scriptPath = path.join(__dirname, '..', 'backend', 'main.py')
  pythonProcess = spawn('python', [scriptPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: path.join(__dirname, '..', 'backend'),
  })

  pythonProcess.stdout.on('data', (data) => {
    console.log(`[Python] ${data.toString().trim()}`)
  })

  pythonProcess.stderr.on('data', (data) => {
    console.log(`[Python] ${data.toString().trim()}`)
  })

  pythonProcess.on('close', (code) => {
    console.log(`Python 后端退出，代码: ${code}`)
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',
    title: 'MeetingScribe',
  })

  if (IS_DEV) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

// IPC 处理
ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: '音频文件', extensions: ['mp3', 'wav', 'm4a'] },
    ],
  })
  if (result.canceled) return null
  return result.filePaths[0]
})

ipcMain.handle('save-file', async (_event, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: [
      { name: 'Markdown 文件', extensions: ['md'] },
    ],
  })
  if (result.canceled) return null
  return result.filePath
})

ipcMain.handle('get-backend-url', () => PYTHON_BACKEND_URL)

app.whenReady().then(() => {
  startPythonBackend()
  // 等待后端启动
  setTimeout(createWindow, 1500)
})

app.on('window-all-closed', () => {
  if (pythonProcess) {
    pythonProcess.kill()
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
