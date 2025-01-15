import { RPCRouter } from '~/events/rpc/router'
import getPicBeds from '~/utils/getPicBeds'
import { uploadChoosedFiles, uploadClipboardFiles } from '~/apis/app/uploader/apis'

import { IRPCActionType, IRPCType } from '#/types/enum'

const uploadRouter = new RPCRouter()

const uploadRoutes = [
  {
    action: IRPCActionType.MAIN_GET_PICBED,
    handler: async () => {
      return getPicBeds()
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.UPLOAD_CLIPBOARD_FILES_FROM_UPLOAD_PAGE,
    handler: async () => {
      uploadClipboardFiles()
    }
  },
  {
    action: IRPCActionType.UPLOAD_CHOOSED_FILES,
    handler: async (evt: IIPCEvent, args: [files: IFileWithPath[]]) => {
      return uploadChoosedFiles(evt.sender, args[0])
    }
  }
]

uploadRouter.addBatch(uploadRoutes)

export { uploadRouter }
