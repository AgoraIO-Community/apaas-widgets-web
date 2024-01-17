import { AgoraIM } from '../../../../../common/im/wrapper';
import {
  AgoraIMBase,
  AgoraIMConnectionState,
  AgoraIMEvents,
} from '../../../../../common/im/wrapper/typs';
import { AgoraHXChatWidget } from '../..';
import { MessageStore } from './message';
import { UserStore } from './user';
import { RoomStore } from './room';
import { retryAttempt } from 'agora-common-libs';
import to from 'await-to-js';
import { transI18n, bound, Logger } from 'agora-common-libs';

export class FcrChatRoomStore {
  fcrChatRoom: AgoraIMBase;
  messageStore: MessageStore;
  userStore: UserStore;
  roomStore: RoomStore;
  constructor(private _widget: AgoraHXChatWidget, appKey: string, roomId: string) {
    const easemobUserId = this._widget.easemobUserId || '';
    const { userName, role, userUuid } = this._widget.classroomConfig.sessionInfo;

    this.fcrChatRoom = AgoraIM.createIMwithType('easemob', {
      appKey,
      roomId,
      userInfo: {
        userId: easemobUserId,
        nickName: userName,
        avatarUrl:
          'https://download-sdk.oss-cn-beijing.aliyuncs.com/downloads/IMDemo/avatar/Image1.png',
        ext: { role, userUuid },
      },
      ext: {
        roomUuid: this._widget.classroomConfig.sessionInfo.roomUuid,
      },
    });
    this.messageStore = new MessageStore(this._widget, this.fcrChatRoom);
    this.userStore = new UserStore(this._widget, this.fcrChatRoom);
    this.roomStore = new RoomStore(this._widget, this.fcrChatRoom);
    this._addListeners();
    this._init();
  }
  private _addListeners() {
    this.fcrChatRoom.on(
      AgoraIMEvents.ConnectionStateChanged,
      this._handleFcrChatRoomConnectionStateChanged,
    );
    this.fcrChatRoom.on(AgoraIMEvents.ErrorOccurred, this._handleFcrChatRoomErrorOccurred);
  }
  private _removeListeners() {
    this.fcrChatRoom.off(
      AgoraIMEvents.ConnectionStateChanged,
      this._handleFcrChatRoomConnectionStateChanged,
    );
    this.fcrChatRoom.off(
      AgoraIMEvents.ErrorOccurred,
      this._handleFcrChatRoomConnectionStateChanged,
    );
  }
  @bound
  private _handleFcrChatRoomErrorOccurred(error: unknown) {
    //@ts-ignore
    this._widget.shareUIStore.addSingletonToast(JSON.stringify(error), 'error');
  }
  @bound
  private _handleFcrChatRoomConnectionStateChanged(connectionState: AgoraIMConnectionState) {
    if (connectionState === AgoraIMConnectionState.DisConnected) {
      Logger.error('[FcrChatRoom] connection disConnected');
    }
  }
  @bound
  private async _joinChatRoom() {
    const { userUuid, roomUuid } = this._widget.classroomConfig.sessionInfo;
    const { token } = (await this._widget.classroomStore.api.getAgoraChatToken({
      roomUuid,
      userUuid,
    })) as { token: string };
    await this.fcrChatRoom.join({
      token,
    });
  }
  @bound
  private async _init() {
    const [error] = await to(
      retryAttempt(
        async () => {
          await this._joinChatRoom();
        },
        [],
        { retriesMax: 10 },
      )
        .fail(async ({ error, timeFn, currentRetry }) => {
          Logger.error(
            'failed to join chatroom, error:',
            error.message,
            ', current retry:',
            currentRetry,
          );
          await timeFn();
          return true;
        })
        .exec(),
    );

    if (error) {
      //@ts-ignore
      return this._widget.shareUIStore.addSingletonToast(transI18n('chat.join_room_fail'), 'error');
    }
    this.roomStore.getChatRoomDetails();
    await this.messageStore.getHistoryMessageList();
    this.messageStore.getAnnouncement();
  }
  @bound
  broadcastWidgetMessage(messageType: string, message: unknown) {
    this._widget.broadcast(messageType, message);
  }
  destroy() {
    this._removeListeners();
    this.userStore.destroy();
    this.messageStore.destroy();
    this.roomStore.destroy();
    this.fcrChatRoom.leave();
  }
}
