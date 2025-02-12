import axios from 'axios'
import path from 'path'

interface IConfigMap {
  fileName: string
  config: {
    version: string
    url: string
    uploadPath: string
    token: string
  }
}

export default class AlistApi {
  static async delete (configMap: IConfigMap): Promise<boolean> {
    const { fileName, config } = configMap
    try {
      const { version, url, uploadPath, token } = config
      if (String(version) === '2') return true
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
      return result.data.code === 200
    } catch (error) {
      console.error(error)
      return false
    }
  }
}
