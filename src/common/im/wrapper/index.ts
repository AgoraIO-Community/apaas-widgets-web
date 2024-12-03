import { FcrChatRoom, FcrChatRoomGroup } from './agora-chat';
import { AgoraIMBase, AgoraIMUserInfo, AgoraIMUserInfoExt } from './typs';

export class AgoraIM {
  static createIMwithType(
    type: 'easemob' | 'easemobgroup',
    opt: {
      appKey: string;
      roomId: string;
      sendRoomIds?: string[]
      recvRoomIds?: string[]
      userInfo: AgoraIMUserInfo<AgoraIMUserInfoExt>;
      ext: { roomUuid: string };
    },
  ): AgoraIMBase {
    switch (type) {
      case 'easemob':
        return new FcrChatRoom(opt.appKey, opt.roomId, opt.userInfo, opt.ext);
      case 'easemobgroup':
        return new FcrChatRoomGroup(opt.appKey, opt.roomId, opt.sendRoomIds || [], opt.recvRoomIds || [], opt.userInfo, opt.ext);
    }
  }
}
