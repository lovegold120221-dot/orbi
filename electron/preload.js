/**
 * Orbit Meeting — Preload Script
 *
 * Exposes safe IPC channels to the renderer process for native dialogs
 * (save-file picker, directory picker) and Ollama detection.
 */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  /** Open a native save-file dialog. Returns { canceled, filePath } or null. */
  showSaveDialog: (options) => ipcRenderer.invoke("dialog:saveFile", options),

  /** Open a native directory picker. Returns { canceled, filePaths } or null. */
  showOpenDirectory: () => ipcRenderer.invoke("dialog:openDirectory"),

  /** Whether the app is packaged (production) or running in dev mode. */
  isPackaged: () => ipcRenderer.invoke("app:isPackaged"),
});
