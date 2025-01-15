import crypto from 'crypto'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

import { availableIconList } from '@/manage/utils/icon'
import { getConfig } from '@/manage/utils/dataSender'

import { handleUrlEncode, safeSliceF, isNeedToShorten } from '#/utils/common'

export function randomStringGenerator(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length })
    .map(() => chars.charAt(Math.floor(Math.random() * chars.length)))
    .join('')
}

export function renameFileNameWithTimestamp(oldName: string): string {
  return `${Math.floor(Date.now() / 1000)}${randomStringGenerator(5)}${path.extname(oldName)}`
}

export function renameFileNameWithRandomString(oldName: string, length: number = 5): string {
  return `${randomStringGenerator(length)}${path.extname(oldName)}`
}

function renameFormatHelper(num: number): string {
  return num.toString().length === 1 ? `0${num}` : num.toString()
}

function getMd5(input: crypto.BinaryLike): string {
  return crypto.createHash('md5').update(input).digest('hex')
}

export function renameFileNameWithCustomString(oldName: string, customFormat: string, affixFileName?: string): string {
  const date = new Date()
  const year = date.getFullYear().toString()
  const fileBaseName = path.basename(oldName, path.extname(oldName))
  const conversionMap: { [key: string]: () => string } = {
    '{Y}': () => year,
    '{y}': () => year.slice(2),
    '{m}': () => renameFormatHelper(date.getMonth() + 1),
    '{d}': () => renameFormatHelper(date.getDate()),
    '{h}': () => renameFormatHelper(date.getHours()),
    '{i}': () => renameFormatHelper(date.getMinutes()),
    '{s}': () => renameFormatHelper(date.getSeconds()),
    '{ms}': () => date.getMilliseconds().toString().padStart(3, '0'),
    '{md5}': () => getMd5(fileBaseName),
    '{md5-16}': () => getMd5(fileBaseName).slice(0, 16),
    '{filename}': () =>
      affixFileName
        ? path.basename(affixFileName, path.extname(affixFileName))
        : path.basename(oldName, path.extname(oldName)),
    '{uuid}': () => uuidv4().replace(/-/g, ''),
    '{timestamp}': () => date.getTime().toString()
  }
  if (
    customFormat === undefined ||
    (!Object.keys(conversionMap).some(item => customFormat.includes(item)) && !customFormat.includes('{str-'))
  ) {
    return oldName
  }
  const ext = path.extname(oldName)
  let newName =
    Object.keys(conversionMap).reduce((acc, cur) => {
      return acc.replace(new RegExp(cur, 'g'), conversionMap[cur]())
    }, customFormat) + ext
  const strRegex = /{str-(\d+)}/gi
  newName = newName.replace(strRegex, (_, group1) => {
    const length = parseInt(group1, 10)
    return randomStringGenerator(length)
  })
  return newName
}

export function renameFile(
  { timestampRename, randomStringRename, customRename, customRenameFormat }: IStringKeyMap,
  oldName = ''
): string {
  switch (true) {
    case timestampRename:
      return renameFileNameWithTimestamp(oldName)
    case randomStringRename:
      return renameFileNameWithRandomString(oldName, 20)
    case customRename:
      return renameFileNameWithCustomString(oldName, customRenameFormat)
    default:
      return oldName
  }
}

export async function formatLink(url: string, fileName: string, type: string, format?: string): Promise<string> {
  const encodedUrl = (await getConfig('settings.isEncodeUrl')) ? handleUrlEncode(url) : url
  switch (type) {
    case 'markdown':
      return `![${fileName}](${encodedUrl})`
    case 'html':
      return `<img src="${encodedUrl}" alt="${fileName}"/>`
    case 'bbcode':
      return `[img]${encodedUrl}[/img]`
    case 'url':
      return encodedUrl
    case 'markdown-with-link':
      return `[![${fileName}](${encodedUrl})](${encodedUrl})`
    case 'custom':
      if (format && (format.includes('$url') || format.includes('$fileName'))) {
        return format.replace(/\$url/g, encodedUrl).replace(/\$fileName/g, fileName)
      }
      return encodedUrl
    default:
      return encodedUrl
  }
}

export function getFileIconPath(fileName: string) {
  const ext = path.extname(fileName).slice(1).toLowerCase()
  return availableIconList.includes(ext) ? `${ext}.webp` : 'unknown.webp'
}

const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']

export function formatFileSize(size: number) {
  if (size === 0) return ''
  const index = Math.floor(Math.log2(size) / 10)
  return `${(size / Math.pow(2, index * 10)).toFixed(2)} ${units[index]}`
}

export function formatFileName(fileName: string, length: number = 20) {
  let ext = path.extname(fileName)
  ext = ext.length > 5 ? ext.slice(ext.length - 5) : ext
  const name = path.basename(fileName, ext)
  return isNeedToShorten(fileName, length) ? `${safeSliceF(name, length - 3 - ext.length)}...${ext}` : fileName
}

export function formObjToTableData(obj: any) {
  const exclude = [undefined, null, '', 'transformedConfig']
  return Object.keys(obj)
    .filter(key => !exclude.includes(obj[key]))
    .map(key => ({
      key,
      value: typeof obj[key] === 'object' ? JSON.stringify(obj[key]) : obj[key]
    }))
    .sort((a, b) => a.key.localeCompare(b.key))
}

export function isValidUrl(str: string) {
  try {
    return !!new URL(str)
  } catch (e) {
    return false
  }
}

export const svg = `
  <path class="path" d="
    M 30 15
    L 28 17
    M 25.61 25.61
    A 15 15, 0, 0, 1, 15 30
    A 15 15, 0, 1, 1, 27.99 7.5
    L 15 15
  " style="stroke-width: 4px; fill: rgba(0, 0, 0, 0)"/>
  `

export function customStrMatch(str: string, pattern: string): boolean {
  if (!str || !pattern) return false
  try {
    const reg = new RegExp(pattern, 'ug')
    return reg.test(str)
  } catch (e) {
    console.error(e)
    return false
  }
}

export function customStrReplace(str: string, pattern: string, replacement: string): string {
  if (!str || !pattern) return str
  replacement = replacement || ''
  let result = str
  try {
    const reg = new RegExp(pattern, 'ug')
    result = str.replace(reg, replacement)
    result = renameFileNameWithCustomString(result, result, str)
  } catch (e) {
    console.error(e)
  }
  return result
}

export const customRenameFormatTable = [
  {
    placeholder: '{Y}',
    description: '年份，4位数',
    placeholderB: '{y}',
    descriptionB: '年份，2位数'
  },
  {
    placeholder: '{m}',
    description: '月份(01-12)',
    placeholderB: '{d}',
    descriptionB: '日期(01-31)'
  },
  {
    placeholder: '{h}',
    description: '小时(00-23)',
    placeholderB: '{i}',
    descriptionB: '分钟(00-59)'
  },
  {
    placeholder: '{s}',
    description: '秒(00-59)',
    placeholderB: '{ms}',
    descriptionB: '毫秒(000-999)'
  },
  {
    placeholder: '{timestamp}',
    description: '时间戳（毫秒）',
    placeholderB: '{uuid}',
    descriptionB: 'uuid字符串'
  },
  {
    placeholder: '{md5}',
    description: 'md5',
    placeholderB: '{md5-16}',
    descriptionB: 'md5前16位'
  },
  {
    placeholder: '{str-number}',
    description: 'number位随机字符串',
    placeholderB: '{filename}',
    descriptionB: '原文件名'
  }
]

export const buildInRenameFormatTable = [
  {
    placeholder: '{Y}',
    description: '年份，4位数',
    placeholderB: '{timestamp}',
    descriptionB: '时间戳（毫秒）'
  },
  {
    placeholder: '{y}',
    description: '年份，2位数',
    placeholderB: '{md5}',
    descriptionB: 'md5'
  },
  {
    placeholder: '{m}',
    description: '月份(01-12)',
    placeholderB: '{md5-16}',
    descriptionB: 'md5前16位'
  },
  {
    placeholder: '{d}',
    description: '日期(01-31)',
    placeholderB: '{localFolder:<number>}',
    descriptionB: '本地文件夹层级'
  },
  {
    placeholder: '{h}',
    description: '小时(00-23)',
    placeholderB: '{uuid}',
    descriptionB: 'uuid字符串'
  },
  {
    placeholder: '{i}',
    description: '分钟(00-59)',
    placeholderB: '{filename}',
    descriptionB: '原文件名'
  },
  {
    placeholder: '{s}',
    description: '秒(00-59)',
    placeholderB: '{str-number}',
    descriptionB: 'number位随机字符串'
  },
  {
    placeholder: '{ms}',
    description: '毫秒(000-999)'
  }
]
