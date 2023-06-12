import { FcrChatRoom } from './agora-chat';
import { AgoraIMBase, AgoraIMUserInfo, AgoraIMUserInfoExt } from './typs';

export class AgoraIM {
  static createIMwithType(
    type: 'easemob',
    opt: {
      appKey: string;
      roomId: string;
      userInfo: AgoraIMUserInfo<AgoraIMUserInfoExt>;
    },
  ): AgoraIMBase {
    switch (type) {
      case 'easemob':
        return new FcrChatRoom(opt.appKey, opt.roomId, opt.userInfo);
    }
  }
}
