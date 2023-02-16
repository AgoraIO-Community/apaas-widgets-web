import {
  AgoraIMBase,
  AgoraIMConnectionState,
  AgoraIMEvents,
  AgoraIMImageMessage,
  AgoraIMMessageBase,
  AgoraIMMessageExt,
  AgoraIMMessageType,
  AgoraIMTextMessage,
  AgoraIMUserInfo,
  AgoraIMUserInfoExt,
} from './typs';
import websdk, { AgoraChat } from 'agora-chat';
import { agoraChatConfig } from './WebIMConfig';
import { convertHXHistoryMessage, convertHXMessage } from './utils';

export class FcrChatRoom extends AgoraIMBase {
  private _conn?: AgoraChat.Connection;
  userInfo: AgoraIMUserInfo;
  private _connectionInfo: {
    appKey: string;
    roomId: string;
  };
  private _logger = websdk.logger;
  constructor(appKey: string, roomId: string, userInfo: AgoraIMUserInfo) {
    super();
    this._connectionInfo = { appKey, roomId };
    this.init(appKey);
    this.userInfo = userInfo;
    this._logger.enableAll();
    this._logger.setLevel('TRACE', true, 'agora-chat');
  }
  get conn() {
    if (!this._conn) throw new Error();
    return this._conn;
  }
  get roomId() {
    return this._connectionInfo.roomId;
  }
  init(appKey: string): void {
    const config = Object.assign(agoraChatConfig, { appKey });
    this._conn = new websdk.connection(config);
    this._addEventListener();
  }
  async join(joinOptions: { token: string }): Promise<void> {
    const { token } = joinOptions;

    this.setConnectionState(AgoraIMConnectionState.Connecting);

    try {
      await this.conn.open({
        accessToken: token,
        user: this.userInfo.userId,
      });
    } catch (e) {
      console.error(e);
    }
    const { nickName, avatarUrl, ext } = this.userInfo;
    try {
      await this.setSelfUserInfo({
        nickName: nickName,
        avatarUrl,
        ext,
      });
    } catch (e) {
      console.error(e);
    }
    try {
      await this.conn.joinChatRoom({ roomId: this.roomId });
    } catch (e) {
      console.error(e);
    }
  }
  async getAnnouncement(): Promise<string> {
    try {
      const res = await this.conn.fetchChatRoomAnnouncement({
        roomId: this.roomId,
      });
      return res.data?.announcement || '';
    } catch (e) {
      return '';
    }
  }
  async setAnnouncement(announcement: string): Promise<void> {
    await this.conn.updateChatRoomAnnouncement({
      roomId: this.roomId,
      announcement,
      success: () => {},
      error: () => {},
    });
  }
  async deleteAnnouncement(): Promise<void> {
    await this.conn.updateChatRoomAnnouncement({
      roomId: this.roomId,
      announcement: '',
      success: () => {},
      error: () => {},
    });
  }

  async muteAllUserList(): Promise<void> {
    await this.conn.disableSendChatRoomMsg({ chatRoomId: this.roomId });
  }
  async unmuteAllUserList(): Promise<void> {
    await this.conn.enableSendChatRoomMsg({ chatRoomId: this.roomId });
  }
  async muteUserList(params: { userList: string[]; duration?: number | undefined }): Promise<void> {
    const { userList, duration = -1 } = params;
    userList.forEach((user) => {
      this.conn.muteChatRoomMember({
        chatRoomId: this.roomId,
        username: user,
        muteDuration: duration,
      });
    });
  }
  async unmuteUserList(params: { roomId: string; userList: string[] }): Promise<void> {
    const { roomId, userList } = params;
    userList.forEach((user) => {
      this.conn.unmuteChatRoomMember({
        chatRoomId: roomId,
        username: user,
      });
    });
  }
  async getUserInfoList(userIdList: string[]): Promise<AgoraIMUserInfo[]> {
    const { data } = await this.conn.fetchUserInfoById(userIdList);
    const userList = data || [];
    return Object.keys(userList).map((userId) => {
      const user: AgoraChat.UpdateOwnUserInfoParams = userList[userId];
      return {
        userId,
        nickName: user.nickname || '',
        avatarUrl: user.avatarurl || '',
        ext: JSON.parse(user?.ext as unknown as string) as AgoraIMUserInfoExt,
      };
    });
  }
  async setSelfUserInfo(
    userInfo: Partial<Exclude<AgoraIMUserInfo, 'userId'>>,
  ): Promise<AgoraIMUserInfo> {
    this.userInfo = Object.assign(this.userInfo, userInfo);
    const { data } = await this.conn.updateUserInfo({
      nickname: this.userInfo.nickName,
      //兼容老版本
      //@ts-ignore
      ext: JSON.stringify({ ...userInfo.ext }),
    });

    return {
      nickName: data?.nickname || '',
      userId: this.userInfo.userId,
      avatarUrl: data?.avatarurl || '',
      ext: JSON.parse(data?.ext as unknown as string) as AgoraIMUserInfoExt,
    };
  }
  async getHistoryMessageList(params?: {
    pageSize?: number | undefined;
    msgId?: string | undefined;
  }): Promise<AgoraIMMessageBase[]> {
    const { messages } = await this.conn.getHistoryMessages({
      targetId: this.roomId,
      pageSize: params?.pageSize || 50,
      chatType: 'chatRoom',
      cursor: params?.msgId,
      searchDirection: 'down',
    });
    return messages.map(convertHXHistoryMessage);
  }
  createTextMessage(msg: string) {
    const messageExt: AgoraIMMessageExt = {
      nickName: this.userInfo.nickName,
      roomUuid: this._connectionInfo.roomId,
      role: this.userInfo.ext?.role,
      avatarUrl: this.userInfo.avatarUrl,
    };
    return new AgoraIMTextMessage({
      msg,
      ext: messageExt,
      id: websdk.utils.getUniqueId(),
    });
  }
  async createImageMessage(params: Partial<AgoraIMImageMessage>) {
    const messageExt: AgoraIMMessageExt = {
      nickName: this.userInfo.nickName,
      roomUuid: this._connectionInfo.roomId,
      role: this.userInfo.ext?.role,
      avatarUrl: this.userInfo.avatarUrl,
    };

    const imageSize: { width: number; height: number } = await new Promise((resolve) => {
      const img = new Image();
      img.src = params.url || (params.file ? URL.createObjectURL(params.file) : '');

      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
        });
        URL.revokeObjectURL(img.src);
      };
    });

    return new AgoraIMImageMessage({
      id: params.id || websdk.utils.getUniqueId(),
      ...imageSize,
      ...params,
      ext: { ...params.ext, ...messageExt },
    });
  }
  async sendMessage(message: AgoraIMMessageBase): Promise<AgoraIMMessageBase> {
    let newMsg: AgoraChat.MessageBody | null = null;
    switch (message.type) {
      case AgoraIMMessageType.Text:
        const { msg: textMsg, ext: textExt } = message as AgoraIMTextMessage;

        newMsg = websdk.message.create({
          to: this.roomId,
          msg: textMsg,
          type: 'txt',
          chatType: 'chatRoom',
          ext: textExt,
        });
        break;
      case AgoraIMMessageType.Image:
        const {
          file,
          url,
          ext: imageExt,
          width,
          height,
        } = message as AgoraIMImageMessage<AgoraIMMessageExt>;
        newMsg = websdk.message.create({
          to: this.roomId,
          type: 'img',
          chatType: 'chatRoom',
          ext: imageExt,
          width,
          height,
          file: file
            ? {
                filename: '',
                filetype: '',
                url: '',
                data: file,
              }
            : undefined,

          url,
        });
        break;
      default:
        break;
    }
    if (!newMsg) return Promise.reject();
    const res = await this.conn.send(newMsg);
    message.id = res.serverMsgId;
    return message;
  }
  async getChatRoomDetails() {
    const { data } = await this.conn.getChatRoomDetails({
      chatRoomId: this._connectionInfo.roomId,
    });
    const res = (data as unknown as { mute: boolean; affiliations: unknown[] }[])[0];
    return {
      mute: !!res?.mute,
      usersCount: res?.affiliations.length || 0,
    };
  }
  async leave(): Promise<void> {
    await this.conn.leaveChatRoom({
      roomId: this._connectionInfo.roomId,
    });
    this.conn.close();
  }
  private _addEventListener() {
    this.conn.listen({
      onOpened: () => {
        console.log('opened');
      },
      onError: (e) => {
        console.log(e, 'imerror');
      },
    });
    this.conn.onTextMessage = (msg) => {
      const textMessage = convertHXMessage(msg);
      this.emit(AgoraIMEvents.TextMessageReceived, textMessage);
    };
    this.conn.onPictureMessage = (msg) => {
      const imageMessage = convertHXMessage(msg);
      this.emit(AgoraIMEvents.ImageMessageReceived, imageMessage);
    };
    this.conn.onCmdMessage = (msg) => {
      const cmdMessage = convertHXMessage(msg);
      this.emit(AgoraIMEvents.CustomMessageReceived, cmdMessage);
    };
    this.conn.addEventHandler('chatroom', {
      onChatroomEvent: async (msg) => {
        switch (msg.operation) {
          case 'memberPresence':
            this.emit(AgoraIMEvents.UserJoined, msg.from);
            break;
          case 'memberAbsence':
            this.emit(AgoraIMEvents.UserLeft, msg.from);
            break;
          case 'updateAnnouncement':
            this.emit(AgoraIMEvents.AnnouncementUpdated, msg.id);
            break;
          case 'deleteAnnouncement':
            this.emit(AgoraIMEvents.AnnouncementDeleted);
            break;
          case 'unmuteAllMembers':
            this.emit(AgoraIMEvents.AllUserUnmuted);
            break;
          case 'muteAllMembers':
            this.emit(AgoraIMEvents.AllUserMuted);
            break;
          case 'unmuteMember':
            this.emit(AgoraIMEvents.UserUnmuted);
            break;
          case 'muteMember':
            this.emit(AgoraIMEvents.UserMuted);
            break;
        }
      },
    });
    this.conn.addEventHandler('connection', {
      onError: (e) => {
        console.log(e, 'connection error');
      },
      onConnected: () => {
        this.setConnectionState(AgoraIMConnectionState.Connected);
      },
      onDisconnected: () => {
        this.setConnectionState(AgoraIMConnectionState.DisConnected);
      },
    });
  }
}