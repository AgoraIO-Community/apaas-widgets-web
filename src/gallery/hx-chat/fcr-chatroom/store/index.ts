import { AgoraIM } from '../../../im/wrapper';
import { AgoraIMBase } from '../../../im/wrapper/typs';
import { AgoraHXChatWidget } from '../..';
import { MessageStore } from './message';
import { UserStore } from './user';
import { RoomStore } from './room';

export class FcrChatRoomStore {
  fcrChatRoom: AgoraIMBase;
  messageStore: MessageStore;
  userStore: UserStore;
  roomStore: RoomStore;
  constructor(private _widget: AgoraHXChatWidget, appKey: string, roomId: string) {
    const easemobUserId = this._widget.easemobUserId || '';
    const { userName, role } = this._widget.classroomConfig.sessionInfo;

    this.fcrChatRoom = AgoraIM.createIMwithType('easemob', {
      appKey,
      roomId,
      userInfo: {
        userId: easemobUserId,
        nickName: userName,
        avatarUrl:
          'https://download-sdk.oss-cn-beijing.aliyuncs.com/downloads/IMDemo/avatar/Image1.png',
        ext: { role },
      },
    });
    this.messageStore = new MessageStore(this._widget, this.fcrChatRoom);
    this.userStore = new UserStore(this._widget, this.fcrChatRoom);
    this.roomStore = new RoomStore(this._widget, this.fcrChatRoom);
    this._joinChatRoom();
  }
  private async _joinChatRoom() {
    const { userUuid, roomUuid } = this._widget.classroomConfig.sessionInfo;
    const { token } = (await this._widget.classroomStore.api.getAgoraChatToken({
      roomUuid,
      userUuid,
    })) as { token: string };
    await this.fcrChatRoom.join({
      token,
    });
    this.roomStore.getChatRoomDetails();

    await this.messageStore.getHistoryMessageList();
    this.messageStore.getAnnouncement();
  }
  destroy() {
    this.userStore.destroy();
    this.messageStore.destroy();
    this.roomStore.destroy();
    this.fcrChatRoom.leave();
  }
}
