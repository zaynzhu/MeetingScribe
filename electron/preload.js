const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: () => ipcRenderer.invoke('select-file'),
  saveFile: (defaultName, content) => ipcRenderer.invoke('save-file', defaultName, content),
  getBackendUrl: () => ipcRenderer.invoke('get-backend-url'),
})
