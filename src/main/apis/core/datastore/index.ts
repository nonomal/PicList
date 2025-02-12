// External dependencies
import fs from 'fs-extra'

// Electron modules

// Custom utilities and modules
import { dbPathChecker, dbPathDir, getGalleryDBPath } from './dbChecker'

// Custom types/enums

// External utility functions
import { DBStore, JSONStore } from '@picgo/store'

// External utility functions
import { T } from '~/main/i18n'
import { configPaths } from '~/universal/utils/configPaths'

const STORE_PATH = dbPathDir()

if (!fs.pathExistsSync(STORE_PATH)) {
  fs.mkdirpSync(STORE_PATH)
}
const CONFIG_PATH: string = dbPathChecker()
export const DB_PATH: string = getGalleryDBPath().dbPath

class ConfigStore {
  #db: JSONStore
  constructor () {
    this.#db = new JSONStore(CONFIG_PATH)

    if (!this.#db.has('picBed')) {
      this.#db.set('picBed', {
        current: 'smms', // deprecated
        uploader: 'smms',
        smms: {
          token: ''
        }
      })
    }

    if (!this.#db.has(configPaths.settings.shortKey._path)) {
      this.#db.set(configPaths.settings.shortKey['picgo:upload'], {
        enable: true,
        key: 'CommandOrControl+Shift+P',
        name: 'upload',
        label: T('QUICK_UPLOAD')
      })
    }
    this.read()
  }

  flush () {
    this.#db = new JSONStore(CONFIG_PATH)
  }

  read () {
    this.#db.read()
    return this.#db
  }

  get (key = ''): any {
    if (key === '') {
      return this.#db.read()
    }
    return this.#db.get(key)
  }

  set (key: string, value: any): void {
    return this.#db.set(key, value)
  }

  has (key: string) {
    return this.#db.has(key)
  }

  unset (key: string, value: any): boolean {
    return this.#db.unset(key, value)
  }

  getConfigPath () {
    return CONFIG_PATH
  }
}

const db = new ConfigStore()

export default db

// v2.3.0 add gallery db
class GalleryDB {
  static #instance: DBStore
  private constructor () {
    console.log('init gallery db')
  }

  static getInstance (): DBStore {
    if (!GalleryDB.#instance) {
      GalleryDB.#instance = new DBStore(DB_PATH, 'gallery')
    }
    return GalleryDB.#instance
  }
}

export {
  GalleryDB
}
