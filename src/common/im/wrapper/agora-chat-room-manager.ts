import { Logger, Log } from 'agora-common-libs';
import { AgoraIMConnectionState, AgoraIMEvents, AgoraIMUserInfo } from './typs';
import websdk, { AgoraChat } from 'agora-chat';
import { agoraChatConfig } from './WebIMConfig';
import { convertHXMessage } from './utils';
import dayjs from 'dayjs';
import { FcrChatRoomItem } from './agora-chat-room-item';
import { AgoraIM } from '.';
type AgoraChatLog = {
  level: Lowercase<AgoraChat.DefaultLevel>;
  logs: [string, unknown];
  time?: string;
};
@Log.attach({ proxyMethods: true })
export class FcrChatRoomManager {
  //@ts-ignore
  private _logger = new Logger('agora-chat-manager', { console: true, database: true });
  //聊天室管理，key值为聊天室id
  private _chatRoomItemMap = new Map<string, FcrChatRoomItem>();
  //当前连接状态
  private _connectionState: AgoraIMConnectionState = AgoraIMConnectionState.DisConnected;
  //教室总的连接实例
  private _classRoomConnection: AgoraChat.Connection;
  //当前教室id
  private _currentClassRoomId: string;
  //当前登录的用户信息
  private _currentUserInfo: AgoraIMUserInfo;
  //默认聊天室Id
  private _defaultChatRoomeId: string;

  constructor(
    appKey: string,
    userInfo: AgoraIMUserInfo,
    classRoomId: string,
    defaultChatRoomeId: string,
  ) {
    const config = Object.assign(agoraChatConfig, { appKey });
    this._classRoomConnection = new websdk.connection(config);
    this._addEventListener();
    this._currentClassRoomId = classRoomId;
    this._currentUserInfo = userInfo;
    this._defaultChatRoomeId = defaultChatRoomeId;
    this._enableLog();
  }
  /**
   * 获取链接状态
   */
  getConnectState():AgoraIMConnectionState{
    return this._connectionState
  }
  
  /**
   * 创建聊天室
   * @param chatRoomId 聊天室id
   */
  createChat(chatRoomId: string): FcrChatRoomItem {
    if (
      this._chatRoomItemMap.has(chatRoomId) &&
      this._chatRoomItemMap.get(chatRoomId) !== undefined
    ) {
      return this._chatRoomItemMap.get(chatRoomId) as FcrChatRoomItem;
    } else {
      return this.createChatRoomItem(chatRoomId);
    }
  }
  /**
   * 加人聊天室
   * @param chatRoomId 聊天室id
   * @param token token
   */
  async joinChatRoom(chatRoomId: string, token: string) : Promise<void> {
    try {
      if (this._connectionState === AgoraIMConnectionState.Connected) {
        let manager = this.createChat(chatRoomId);
        await manager.managerOptionsJoin();
        //判断默认的是否加入了，没有的话从新加入下
        if (this._defaultChatRoomeId != chatRoomId) {
          manager = this.createChat(this._defaultChatRoomeId);
          await manager.managerOptionsJoin();
        }
        if (manager.isJoin) {
          this.emitEventsInfo(AgoraIMEvents.UserListUpdated, null);
        }
      } else {
        //初次未连接肯定是主房间，所以就不做特殊处理
      await  this.login({ token });
      }
    } catch (e) {
      this._formateLogs({ level: 'error', logs: ['join chatroom error', e] });
      this.setConnectionState(AgoraIMConnectionState.DisConnected);
      throw e;
    }
  }
  /**
   * 退出聊天室
   * @param chatRoomId 聊天室id
   */
  async leaveChatRoom(chatRoomId: string): Promise<void>  {
    if (this._chatRoomItemMap.has(chatRoomId)) {
      await this.createChat(chatRoomId).managerOptionsLeave(false);
    }
  }
  /**
   * 是否还有聊天室
   * @returns 是-true
   */
  haveChatRoom(): boolean {
    return this._chatRoomItemMap.size > 0;
  }

  private async login(joinOptions: { token: string }): Promise<void> {
    const { token } = joinOptions;
    this.setConnectionState(AgoraIMConnectionState.Connecting);
    try {
      await this._classRoomConnection.open({
        accessToken: token,
        user: this._currentUserInfo.userId,
      });
    } catch (e) {
      this._logger.error(this._formateLogs({ level: 'error', logs: ['connection open error', e] }));
      this.setConnectionState(AgoraIMConnectionState.DisConnected);
      throw e;
    }
  }

  /**
   * 创建(主/子)聊天室
   * @param toItemRoomId 目标聊天室Id
   */
  private createChatRoomItem(toItemRoomId: string): FcrChatRoomItem {
    try {
      //如果聊天室mao中没有的话则加人
      if (!this._chatRoomItemMap.has(toItemRoomId)) {
        const item = new FcrChatRoomItem(
          this._classRoomConnection,
          this._currentUserInfo,
          this._currentClassRoomId,
          this._defaultChatRoomeId,
          toItemRoomId,
        );
        // item.join({ token: '' })
        this._chatRoomItemMap.set(toItemRoomId, item);
        return item;
      } else {
        return this.createChat(toItemRoomId);
      }
    } catch (e) {
      this._formateLogs({ level: 'error', logs: ['join chatroom error', e] });
      this.setConnectionState(AgoraIMConnectionState.DisConnected);
      throw e;
    }
  }
  /**
   * 更新链接状态
   * @param connectionState 链接状态
   */
  protected setConnectionState(connectionState: AgoraIMConnectionState) {
    this._connectionState = connectionState;
    this.emitEventsInfo(AgoraIMEvents.ConnectionStateChanged, connectionState);
  }
  /**
   * 开启log日志
   */
  private _enableLog() {
    websdk.logger.setLevel('DEBUG', true, 'agora-chat');
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
  /**
   * 格式化日志信息
   */
  @Log.silence
  private _formateLogs(log: AgoraChatLog) {
    const [logInfo, ...args] = log.logs;
    return `${
      log.time
        ? `${dayjs().format('YYYY-MM-DD')} ${log.time}`
        : `${dayjs().format('YYYY-MM-DD HH:mm:ss')}`
    } [Agora-Chat] ${logInfo}, args: ${args.map((arg) => `${JSON.stringify(arg)} `)}`;
  }
  /**
   * 更新我自己的用户信息
   * @param userInfo 新的用户信息
   * @returns 覆盖后新的用户信息
   */
  private async setSelfUserInfo(
    userInfo: Partial<Exclude<AgoraIMUserInfo, 'userId'>>,
  ): Promise<AgoraIMUserInfo> {
    this._currentUserInfo = Object.assign(this._currentUserInfo, userInfo);
    await this._classRoomConnection.updateUserInfo({
      nickname: this._currentUserInfo.nickName,
      avatarurl: this._currentUserInfo.avatarUrl,
      //兼容老版本
      //@ts-ignore
      ext: JSON.stringify({ ...this._currentUserInfo.ext }),
    });
    return this._currentUserInfo;
  }

  @Log.silence
  private _addEventListener() {
    this._classRoomConnection.onTextMessage = (msg) => {
      const textMessage = convertHXMessage(msg);
      this.emitEventsInfo(
        AgoraIMEvents.TextMessageReceived,
        textMessage,
        textMessage?.ext?.receiverList != null && textMessage.ext.receiverList.length > 0
          ? null
          : msg.to,
      );
    };
    this._classRoomConnection.onPictureMessage = (msg) => {
      const imageMessage = convertHXMessage(msg);
      this.emitEventsInfo(
        AgoraIMEvents.ImageMessageReceived,
        imageMessage,
        imageMessage?.ext?.receiverList != null && imageMessage.ext.receiverList.length > 0
          ? null
          : msg.to,
      );
    };
    this._classRoomConnection.onCmdMessage = (msg) => {
      const cmdMessage = convertHXMessage(msg);
      this.emitEventsInfo(
        AgoraIMEvents.CustomMessageReceived,
        cmdMessage,
        cmdMessage?.ext?.receiverList != null && cmdMessage.ext.receiverList.length > 0
          ? null
          : msg.to,
      );
    };
    this._classRoomConnection.addEventHandler('chatroom', {
      onChatroomEvent: async (msg) => {
        switch (msg.operation) {
          case 'memberPresence':
            this.emitEventsInfo(AgoraIMEvents.UserJoined, msg.from, null);
            this.emitEventsInfo(AgoraIMEvents.UserListUpdated, msg.from, null);
            break;
          case 'memberAbsence':
            this.emitEventsInfo(AgoraIMEvents.UserLeft, msg.from, null);
            this.emitEventsInfo(AgoraIMEvents.UserListUpdated, msg.from, null);
            break;
          case 'updateAnnouncement':
            this.emitEventsInfo(AgoraIMEvents.AnnouncementUpdated, msg.id, msg.id);
            break;
          case 'deleteAnnouncement':
            this.emitEventsInfo(AgoraIMEvents.AnnouncementDeleted, null, msg.id);
            break;
          case 'unmuteAllMembers':
            this.emitEventsInfo(AgoraIMEvents.AllUserUnmuted, null, msg.id);
            break;
          case 'muteAllMembers':
            this.emitEventsInfo(AgoraIMEvents.AllUserMuted, null, msg.id);
            break;
          case 'unmuteMember':
            this.emitEventsInfo(AgoraIMEvents.UserUnmuted, null, msg.id);
            break;
          case 'muteMember':
            this.emitEventsInfo(AgoraIMEvents.UserMuted, null, msg.id);
            break;
        }
      },
    });
    this._classRoomConnection.addEventHandler('connection', {
      onError: (e) => {
        this._logger.error(this._formateLogs({ level: 'error', logs: ['connection error', e] }));
        this.emitEventsInfo(AgoraIMEvents.ErrorOccurred);
      },
      onConnected: async () => {
        const { nickName, avatarUrl, ext } = this._currentUserInfo;
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
          const chatRoom = this.createChatRoomItem(this._defaultChatRoomeId);
          await chatRoom.managerOptionsJoin();
          if (chatRoom.isJoin) {
            this.emitEventsInfo(AgoraIMEvents.UserListUpdated, null);
          }
        } catch (e) {
          this._formateLogs({ level: 'error', logs: ['join chatroom error', e] });
          this.setConnectionState(AgoraIMConnectionState.DisConnected);
          throw e;
        }
        this.setConnectionState(AgoraIMConnectionState.Connected);
      },
      onDisconnected: () => {
        this.setConnectionState(AgoraIMConnectionState.DisConnected);
      },
    });
  }
  /**
   * 提交通知信息
   * @param toChatRoomId 目标聊天室id
   * @param events 通知类型
   * @param value 值
   */
  private emitEventsInfo(events: AgoraIMEvents, data?: any, toChatRoomId?: string | null) {
    if (toChatRoomId != null) {
      this._chatRoomItemMap.forEach((value, key) => {
        if (toChatRoomId === key) {
          if (data != null) {
            value.emit(events, data);
          } else {
            value.emit(events);
          }
        }
      });
    } else {
      this._chatRoomItemMap.forEach((value) => {
        if (data != null) {
          value.emit(events, data);
        } else {
          value.emit(events);
        }
      });
    }
  }
  destory() {
    this._chatRoomItemMap.forEach((value) => {
      value.managerOptionsLeave(true);
    });
    AgoraIM.leaveChatRoom(this._currentClassRoomId, this._defaultChatRoomeId);
  }
}
