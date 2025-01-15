import { dialog, shell } from 'electron'
import { IGuiMenuItem, PicGo as PicGoCore } from 'piclist'
import path from 'path'

import { dbPathDir } from '@core/datastore/dbChecker'
import picgo from '@core/picgo'

import shortKeyHandler from 'apis/app/shortKey/shortKeyHandler'
import windowManager from 'apis/app/window/windowManager'

import { T } from '~/i18n'
import { showNotification } from '~/utils/common'

import { handleStreamlinePluginName, simpleClone } from '#/utils/common'
import { ICOREBuildInEvent, IPicGoHelperType, IWindowList } from '#/types/enum'

const STORE_PATH = dbPathDir()

// eslint-disable-next-line
const requireFunc = typeof __webpack_require__ === 'function' ? __non_webpack_require__ : require

// get uploader or transformer config
const getConfig = (name: string, type: IPicGoHelperType, ctx: PicGoCore) => {
  let config: any[] = []
  if (name === '') {
    return config
  } else {
    const handler = ctx.helper[type].get(name)
    if (handler) {
      if (handler.config) {
        config = handler.config(ctx)
      }
    }
    return config
  }
}

const handleConfigWithFunction = (config: any[]) => {
  for (const i in config) {
    if (typeof config[i].default === 'function') {
      config[i].default = config[i].default()
    }
    if (typeof config[i].choices === 'function') {
      config[i].choices = config[i].choices()
    }
  }
  return config
}

const getPluginList = (): IPicGoPlugin[] => {
  const pluginList = picgo.pluginLoader.getFullList()
  const list = []
  for (const i in pluginList) {
    const plugin = picgo.pluginLoader.getPlugin(pluginList[i])!
    const pluginPath = path.join(STORE_PATH, `/node_modules/${pluginList[i]}`)
    const pluginPKG = requireFunc(path.join(pluginPath, 'package.json'))
    const uploaderName = plugin.uploader || ''
    const transformerName = plugin.transformer || ''
    let menu: Omit<IGuiMenuItem, 'handle'>[] = []
    if (plugin.guiMenu) {
      menu = plugin.guiMenu(picgo).map(item => ({
        label: item.label
      }))
    }
    let gui = false
    if (pluginPKG.keywords && pluginPKG.keywords.length > 0) {
      if (pluginPKG.keywords.includes('picgo-gui-plugin')) {
        gui = true
      }
    }
    const obj: IPicGoPlugin = {
      name: handleStreamlinePluginName(pluginList[i]),
      fullName: pluginList[i],
      author: pluginPKG.author.name || pluginPKG.author,
      description: pluginPKG.description,
      logo: 'file://' + path.join(pluginPath, 'logo.png').split(path.sep).join('/'),
      version: pluginPKG.version,
      gui,
      config: {
        plugin: {
          fullName: pluginList[i],
          name: handleStreamlinePluginName(pluginList[i]),
          config: plugin.config ? handleConfigWithFunction(plugin.config(picgo)) : []
        },
        uploader: {
          name: uploaderName,
          config: handleConfigWithFunction(getConfig(uploaderName, IPicGoHelperType.uploader, picgo))
        },
        transformer: {
          name: transformerName,
          config: handleConfigWithFunction(getConfig(uploaderName, IPicGoHelperType.transformer, picgo))
        }
      },
      enabled: picgo.getConfig(`picgoPlugins.${pluginList[i]}`),
      homepage: pluginPKG.homepage ? pluginPKG.homepage : '',
      guiMenu: menu,
      ing: false
    }
    list.push(obj)
  }
  return list
}

const handleNPMError = (): IDispose => {
  const handler = (msg: string) => {
    if (msg === 'NPM is not installed') {
      dialog
        .showMessageBox({
          title: T('TIPS_ERROR'),
          message: T('TIPS_INSTALL_NODE_AND_RELOAD_PICGO'),
          buttons: ['Yes']
        })
        .then(res => {
          if (res.response === 0) {
            shell.openExternal('https://nodejs.org/')
          }
        })
    }
  }
  picgo.once(ICOREBuildInEvent.FAILED, handler)
  return () => picgo.off(ICOREBuildInEvent.FAILED, handler)
}

export const handlePluginUpdate = async (fullName: string | string[]) => {
  const window = windowManager.get(IWindowList.SETTING_WINDOW)!
  const dispose = handleNPMError()
  const res = await picgo.pluginHandler.update(typeof fullName === 'string' ? [fullName] : fullName)
  if (res.success) {
    window.webContents.send('updateSuccess', res.body[0])
  } else {
    showNotification({
      title: T('PLUGIN_UPDATE_FAILED'),
      body: res.body as string
    })
  }
  window.webContents.send('hideLoading')
  dispose()
}

export const handlePluginUninstall = async (fullName: string) => {
  const window = windowManager.get(IWindowList.SETTING_WINDOW)!
  const dispose = handleNPMError()
  const res = await picgo.pluginHandler.uninstall([fullName])
  if (res.success) {
    window.webContents.send('uninstallSuccess', res.body[0])
    shortKeyHandler.unregisterPluginShortKey(res.body[0])
  } else {
    showNotification({
      title: T('PLUGIN_UNINSTALL_FAILED'),
      body: res.body as string
    })
  }
  window.webContents.send('hideLoading')
  dispose()
}

export const pluginGetListFunc = async (event: IIPCEvent) => {
  try {
    const list = simpleClone(getPluginList())
    // here can just send JS Object not function
    // or will cause [Failed to serialize arguments] error
    event.sender.send('pluginList', list)
  } catch (e: any) {
    event.sender.send('pluginList', [])
    showNotification({
      title: T('TIPS_GET_PLUGIN_LIST_FAILED'),
      body: e.message
    })
    picgo.log.error(e)
  }
}

export const pluginInstallFunc = async (event: IIPCEvent, args: [fullName: string]) => {
  const fullName = args[0]
  const dispose = handleNPMError()
  const res = await picgo.pluginHandler.install([fullName])
  event.sender.send('installPlugin', {
    success: res.success,
    body: fullName,
    errMsg: res.success ? '' : res.body
  })
  if (res.success) {
    shortKeyHandler.registerPluginShortKey(res.body[0])
  } else {
    showNotification({
      title: T('PLUGIN_INSTALL_FAILED'),
      body: res.body as string
    })
  }
  event.sender.send('hideLoading')
  dispose()
}

export const pluginImportLocalFunc = async (event: IIPCEvent) => {
  const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW)!
  const res = await dialog.showOpenDialog(settingWindow, {
    properties: ['openDirectory']
  })
  const filePaths = res.filePaths
  if (filePaths.length > 0) {
    const res = await picgo.pluginHandler.install(filePaths)
    if (res.success) {
      try {
        const list = simpleClone(getPluginList())
        event.sender.send('pluginList', list)
      } catch (e: any) {
        event.sender.send('pluginList', [])
        showNotification({
          title: T('TIPS_GET_PLUGIN_LIST_FAILED'),
          body: e.message
        })
      }
      showNotification({
        title: T('PLUGIN_IMPORT_SUCCEED'),
        body: ''
      })
    } else {
      showNotification({
        title: T('PLUGIN_IMPORT_FAILED'),
        body: res.body as string
      })
    }
  }
  event.sender.send('hideLoading')
}

export const pluginUpdateAllFunc = async (_: IIPCEvent, args: [list: string[]]) => {
  handlePluginUpdate(args[0])
}
