import db from '@core/datastore'

import { i18nManager } from '~/i18n'

import { II18nLanguage } from '#/types/enum'
import { configPaths } from '#/utils/configPaths'

export const initI18n = () => {
  const currentLanguage = db.get(configPaths.settings.language) || II18nLanguage.ZH_CN
  i18nManager.setCurrentLanguage(currentLanguage)
}
