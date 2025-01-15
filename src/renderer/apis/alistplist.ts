import axios from 'axios'
import path from 'path'

import { getConfig, saveConfig } from '@/utils/dataSender'
import { deleteFailedLog, deleteLog } from '#/utils/deleteLog'

interface IConfigMap {
  fileName: string
  config: {
    url: string
    username: string
    password: string
    uploadPath: string
    token: string
  }
}

const getAListToken = async (url: string, username: string, password: string) => {
  const tokenStore = await getConfig<IStringKeyMap>('picgo-plugin-buildin-alistplist')
  if (tokenStore && tokenStore.refreshedAt && Date.now() - tokenStore.refreshedAt < 3600000 && tokenStore.token) {
    return tokenStore.token
  }
  const res = await axios.post(`${url}/api/auth/login`, {
    username,
    password
  })
  if (res.data.code === 200 && res.data.message === 'success') {
    const token = res.data.data.token
    saveConfig({
      'picgo-plugin-buildin-alistplist': {
        token,
        refreshedAt: Date.now()
      }
    })
    return token
  }
}

export default class AListplistApi {
  static async delete(configMap: IConfigMap): Promise<boolean> {
    const { fileName, config } = configMap
    try {
      const { url, username, password, uploadPath } = config
      let token = config.token
      if (!token) {
        token = await getAListToken(url, username, password)
      }
      if (!url || !(token || (username && password))) {
        deleteFailedLog(fileName, 'Alist', 'No valid token or username/password provided')
        return false
      }
      const result = await axios.request({
        method: 'post',
        url: `${url}/api/fs/remove`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        },
        data: {
          dir: path.join('/', uploadPath, path.dirname(fileName)),
          names: [path.basename(fileName)]
        }
      })
      if (result.data.code === 200) {
        deleteLog(fileName, 'Alist')
        return true
      }
      deleteLog(fileName, 'Alist', false)
      return false
    } catch (error: any) {
      deleteFailedLog(fileName, 'Alist', error)
      return false
    }
  }
}
