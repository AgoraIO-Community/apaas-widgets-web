import {
  AgoraIMBase,
  AgoraIMCmdActionEnum,
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
import { Logger, Log } from 'agora-rte-sdk';
import dayjs from 'dayjs';
type AgoraChatLog = {
  level: Lowercase<AgoraChat.DefaultLevel>;
  logs: [string, unknown];
  time?: string;
};
@Log.attach({ proxyMethods: true })
export class FcrChatRoom extends AgoraIMBase {
  private _logger = new Logger('agora-chat', { console: true, database: true });
  private _conn?: AgoraChat.Connection;
  userInfo: AgoraIMUserInfo;
  private _connectionInfo: {
    appKey: string;
    roomId: string;
  };
  constructor(appKey: string, roomId: string, userInfo: AgoraIMUserInfo) {
    super();
    this._connectionInfo = { appKey, roomId };
    this.init(appKey);
    this.userInfo = userInfo;

    this._enableLog();
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
  @Log.silence
  private _formateLogs(log: AgoraChatLog) {
    const [logInfo, ...args] = log.logs;
    return `${
      log.time
        ? `${dayjs().format('YYYY-MM-DD')} ${log.time}`
        : `${dayjs().format('YYYY-MM-DD HH:mm:ss')}`
    } [Agora-Chat] ${logInfo}, args: ${args.map((arg) => `${JSON.stringify(arg)} `)}`;
  }

  private _enableLog() {
    websdk.logger.setLevel('WARN', true, 'agora-chat');
    //@ts-ignore
    websdk.logger.onLog = (log: AgoraChatLog) => {
      switch (log.level) {
        case 'warn':
          this._logger.warn(this._formateLogs(log));
          break;
        case 'error':
          this._logger.error(this._formateLogs(log));
          break;
      }
    };
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
      this._logger.error(this._formateLogs({ level: 'error', logs: ['connection open error', e] }));
      this.setConnectionState(AgoraIMConnectionState.DisConnected);
      throw e;
    }
    const { nickName, avatarUrl, ext } = this.userInfo;
    try {
      await this.setSelfUserInfo({
        nickName: nickName,
        avatarUrl,
        ext,
      });
    } catch (e) {
      this._logger.error(
        this._formateLogs({ level: 'error', logs: ['set self user info error', e] }),
      );
      this.setConnectionState(AgoraIMConnectionState.DisConnected);
      throw e;
    }
    try {
      await this.conn.joinChatRoom({ roomId: this.roomId });
    } catch (e) {
      this._formateLogs({ level: 'error', logs: ['join chatroom error', e] });
      this.setConnectionState(AgoraIMConnectionState.DisConnected);
      throw e;
    }
  }
  @Log.silence
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
  @Log.silence
  async setAnnouncement(announcement: string): Promise<void> {
    await this.conn.updateChatRoomAnnouncement({
      roomId: this.roomId,
      announcement,
      success: () => {},
      error: () => {},
    });
  }
  @Log.silence
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
      avatarurl: this.userInfo.avatarUrl,
      //兼容老版本
      //@ts-ignore
      ext: JSON.stringify({ ...this.userInfo.ext }),
    });
    return this.userInfo;
  }
  @Log.silence
  async getHistoryMessageList(params?: {
    pageSize?: number | undefined;
    msgId?: string | number | undefined;
  }): Promise<AgoraIMMessageBase[]> {
    const { messages } = await this.conn.getHistoryMessages({
      targetId: this.roomId,
      pageSize: params?.pageSize || 50,
      chatType: 'chatRoom',
      cursor: params?.msgId,
    });
    const deletedMessageIds = new Map();
    const msgList: AgoraIMMessageBase[] = [];
    messages.forEach((msg) => {
      if (deletedMessageIds.has(msg.id)) return;
      if (msg.type === 'cmd' && msg.action === AgoraIMCmdActionEnum.MsgDeleted) {
        deletedMessageIds.set((msg.ext as { msgId: string }).msgId, true);
      }
      msgList.push(convertHXHistoryMessage(msg));
    });
    return msgList.reverse();
  }
  @Log.silence
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
  @Log.silence
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
  @Log.silence
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
    const res = (data as unknown as { mute: boolean }[])[0];
    return {
      mute: !!res?.mute,
    };
  }
  async getMutedUserList(): Promise<string[]> {
    const { data } = await this.conn.getChatRoomMutelist({
      chatRoomId: this._connectionInfo.roomId,
    });
    return data
      ? data.map((i) => {
          return i.user;
        })
      : [];
  }
  async getUserList(params: {
    pageNum: number;
    pageSize: number;
  }): Promise<AgoraIMUserInfo<AgoraIMUserInfoExt>[]> {
    return [];
  }
  async leave(): Promise<void> {
    await this.conn.leaveChatRoom({
      roomId: this._connectionInfo.roomId,
    });
    this.conn.close();
  }
  @Log.silence
  private _addEventListener() {
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
        this._logger.error(this._formateLogs({ level: 'error', logs: ['connection error', e] }));
        this.emit(AgoraIMEvents.ErrorOccurred, e);
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
