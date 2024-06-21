import { Logger, Log } from 'agora-common-libs';
import {
  AgoraIMBase,
  AgoraIMChatRoomDetails,
  AgoraIMCmdActionEnum,
  AgoraIMConnectionState,
  AgoraIMCustomMessage,
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
import { convertHXMessage, convertHXHistoryMessage } from './utils';
import dayjs from 'dayjs';
import { AgoraIM } from '.';
import { reject } from 'lodash';
import { ApiBase } from 'agora-rte-sdk';
import { EduClassroomConfig } from 'agora-edu-core';
import { to } from 'react-spring';
import axios from 'axios';
import { message } from 'antd';
type AgoraChatLog = {
  level: Lowercase<AgoraChat.DefaultLevel>;
  logs: [string, unknown];
  time?: string;
};

@Log.attach({ proxyMethods: true })
export class FcrChatRoomItem extends AgoraIMBase {
  getUserList(params: { pageNum: number; pageSize: number; }): Promise<AgoraIMUserInfo<AgoraIMUserInfoExt>[]> {
    throw new Error('Method not implemented.');
  }
  setSelfUserInfo(userInfo: AgoraIMUserInfo<AgoraIMUserInfoExt>): Promise<AgoraIMUserInfo<AgoraIMUserInfoExt>> {
    throw new Error('Method not implemented.');
  }
  userInfo?: AgoraIMUserInfo<AgoraIMUserInfoExt> | undefined;

  private _logger = new Logger('agora-chat-room-item', { console: true, database: true });
  //教室总的链接实例
  private _classRoomConnection: AgoraChat.Connection;
  //当前登录的用户信息
  private _currentUserInfo: AgoraIMUserInfo;
  //当前教室Id
  private _currentClassRoomUuid: string
  //默认聊天室Id
  private _defaultChatRoomeId: string
  //当前聊天室的Id
  private _currentChatRoomId: string
  //是否加入了
  isJoin = false
  //是否退出了
  private _isLeave = true

  constructor(connection: AgoraChat.Connection, userInfo: AgoraIMUserInfo, classRoomUuid: string, defaultChatRoomeId: string, chatRoomId: string) {
    super();
    this._classRoomConnection = connection;
    this._currentUserInfo = userInfo
    this.userInfo = userInfo
    this._currentClassRoomUuid = classRoomUuid
    this._currentChatRoomId = chatRoomId
    this._defaultChatRoomeId = defaultChatRoomeId
    this._enableLog()
  }
  init(appKey: string): void {
    // throw new Error('Method not implemented.');
  }
  /**
   * 加人(主/子)聊天室
   */
  async join(joinOptions: { token: string; }): Promise<void> {
    AgoraIM.joinChatRoom(this._currentClassRoomUuid, this._currentChatRoomId, joinOptions.token)
  }
  /**
   * 退出(主/子)聊天室
   */
  async leave(): Promise<void> {
    AgoraIM.leaveChatRoom(this._currentClassRoomUuid, this._currentChatRoomId)
  }
  /**
   * 当前教室id
   */
  getRoomId(): string {
    return this._currentClassRoomUuid
  }
  /**
   * 管理实例操作的加入房间逻辑
   */
  async managerOptionsJoin() {
    try {
      if (this._isLeave) {
        this._isLeave = false
        await this._classRoomConnection.joinChatRoom({ roomId: this._currentChatRoomId });
        this.isJoin = true
      }
    } catch (e) {
      console.log(e)
      this._formateLogs({ level: 'error', logs: ['join chatroom error', e] });
      throw e;
    }
  }
  /**
   * 管理实例操作的退出房间逻辑
   * @param focus 是否强制退出
   */
  async managerOptionsLeave(focus: boolean) {
    if (this.isJoin && (this._defaultChatRoomeId !== this._currentChatRoomId || focus)) {
      this.isJoin = false
      await this._classRoomConnection.leaveChatRoom({
        roomId: this._currentChatRoomId
      });
      this._isLeave = true
    }
  }
  /**
   * 获取聊天室详情数据
   * @returns 目标聊天室详细信息
   */
  async getChatRoomDetails() {
    const { data } = await this._classRoomConnection.getChatRoomDetails({ chatRoomId: this._currentChatRoomId, });
    const res = (data as unknown as AgoraIMChatRoomDetails[])[0];
    return {
      mute: !!res?.mute,
      affiliations: res.affiliations,
    };
  }
  /**
   * 聊天室全员静音
   */
  async muteAllUserList(): Promise<void> {
    await this._classRoomConnection.disableSendChatRoomMsg({ chatRoomId: this._currentChatRoomId });
  }
  /**
   * 聊天室全员取消静音
   */
  async unmuteAllUserList(): Promise<void> {
    await this._classRoomConnection.enableSendChatRoomMsg({ chatRoomId: this._currentChatRoomId });
  }
  /**
   * 获取聊天室的公告
   * @returns 
   */
  @Log.silence
  async getAnnouncement(): Promise<string> {
    try {
      const res = await this._classRoomConnection.fetchChatRoomAnnouncement({
        roomId: this._currentChatRoomId,
      });
      return res.data?.announcement || '';
    } catch (e) {
      return '';
    }
  }
  /**
   * 设置聊天室的公告
   */
  @Log.silence
  async setAnnouncement(announcement: string): Promise<void> {
    await this._classRoomConnection.updateChatRoomAnnouncement({
      roomId: this._currentChatRoomId,
      announcement,
      success: () => { },
      error: () => { },
    });
  }
  /**
   * 删除聊天室的公告
   */
  @Log.silence
  async deleteAnnouncement(): Promise<void> {
    await this._classRoomConnection.updateChatRoomAnnouncement({
      roomId: this._currentChatRoomId,
      announcement: '',
      success: () => { },
      error: () => { },
    });
  }
  /**
   * 设置私聊对象
   */
  setPrivateUser(user: AgoraIMUserInfo | undefined): void {
    AgoraIM.setPrivateUser(this._currentClassRoomUuid, user)
  }
  /**
   * 获取私聊对象
   */
  getPrivateUser(): AgoraIMUserInfo | undefined {
    return AgoraIM.getRoomPrivateUser(this._currentClassRoomUuid)
  }
  /**
   * 对指定的人禁言
   * @param params.userList 要禁言的人员列表
   * @param params.duration 禁言时间
   */
  async muteUserList(params: { userList: string[]; duration?: number | undefined }): Promise<void> {
    const { userList, duration = -1 } = params;
    userList.forEach((user) => {
      this._classRoomConnection.muteChatRoomMember({
        chatRoomId: this._currentChatRoomId,
        username: user,
        muteDuration: duration,
      });
    });
  }
  /**
  * 对指定的人取消禁言
  * @param params.userList 要禁言的人员列表
  */
  async unmuteUserList(params: { userList: string[] }): Promise<void> {
    const { userList } = params;
    userList.forEach((user) => {
      this._classRoomConnection.unmuteChatRoomMember({
        chatRoomId: this._currentChatRoomId,
        username: user,
      });
    });
  }
  /**
   * 获取当前被禁言的用户列表
   * @returns 当前被禁言的用户列表
   */
  async getMutedUserList(): Promise<string[]> {
    const { data } = await this._classRoomConnection.getChatRoomMutelist({
      chatRoomId: this._currentChatRoomId
    });
    return data
      ? data.map((i) => {
        return i.user;
      })
      : [];
  }
  /**
   * 获取当前教室内指定的用户详细信息
   * @param userIdList 要查询的用户列表
   * @returns 查询到的用户信息
   */
  async getUserInfoList(userIdList: string[]): Promise<AgoraIMUserInfo[]> {
    const newArr = userIdList.reduce((acc, cur, index) => {
      const groupIndex = Math.floor(index / 100);
      if (!acc[groupIndex]) {
        acc[groupIndex] = [];
      }
      acc[groupIndex].push(cur);
      return acc;
    }, [] as string[][]);
    const res = await Promise.all(newArr.map((item) => this._classRoomConnection.fetchUserInfoById(item)));
    const newUserList: Record<string, AgoraChat.UpdateOwnUserInfoParams> = {};
    res.forEach((i) => Object.assign(newUserList, i.data));
    return Object.keys(newUserList).map((userId) => {
      const user: AgoraChat.UpdateOwnUserInfoParams = newUserList[userId];
      return {
        userId,
        nickName: user.nickname || '',
        avatarUrl: user.avatarurl || '',
        ext: JSON.parse(user?.ext as unknown as string) as AgoraIMUserInfoExt,
      };
    });
  }

  /**
   * 获取所有的用户信息(从默认聊天室中取，所有聊天室地方要显示全量的，但是分组还是各自的)
   */
  async getAllUserInfoList(): Promise<AgoraIMUserInfo[]> {
    const { data } = await this._classRoomConnection.getChatRoomDetails({ chatRoomId: this._defaultChatRoomeId, });
    const res = (data as unknown as AgoraIMChatRoomDetails[])[0];
    const affiliations = res.affiliations;
    return this.getUserInfoList(affiliations
      .filter((item) => !!item.member)
      .map((item) => {
        return item.member!;
      }));
  }

  /**
   * 获取当前聊天室的历史消息
   * @returns 历史消息
   */
  async getHistoryMessageList(): Promise<AgoraIMMessageBase[]> {
    const {
      rteEngineConfig: { ignoreUrlRegionPrefix, region },
      sessionInfo: { roomUuid },
      appId,
    } = EduClassroomConfig.shared;
    const httpClient = axios.create({
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const allMsgList = []
    const currentUserId = this._currentUserInfo.userId;
    //当前群组消息
    const pubMsg = await httpClient.get("https://api-solutions.bj2.agoralab.co/scenario/im/apps/" + appId + "/v1/rooms/" + roomUuid + "/history/messages?to=" + this._currentChatRoomId + "&chatType=groupchat")
    allMsgList.push(...pubMsg.data.data.list)
    //默认大群群组消息
    if (this._currentChatRoomId !== this._defaultChatRoomeId) {
      const defMsg = await httpClient.get("https://api-solutions.bj2.agoralab.co/scenario/im/apps/" + appId + "/v1/rooms/" + roomUuid + "/history/messages?to=" + this._defaultChatRoomeId + "&chatType=groupchat")
      for (const msg of defMsg.data.data.list) {
        const list = JSON.parse(msg.ext.receiverList)
        for (const data of list) {
          if (data.userId === currentUserId || data.ext.userUuid === currentUserId || currentUserId == msg.from) {
            allMsgList.push(msg)
            break
          }
        }
      }
    }
    //按照时间升序排序
    allMsgList.sort((a, b) => b.timestamp - a.timestamp);
    const msgList: AgoraIMMessageBase[] = [];
    allMsgList.forEach(msg => {
      //数据向指定格式处理
      msg.id = msg.msgId
      msg.time = msg.timestamp
      msg.ext.receiverList = JSON.parse(msg.ext.receiverList)
      msg.receiverList = msg.ext.receiverList
      let needAdd = msg.ext.receiverList.length === 0 || msg.from === currentUserId
      for (const data of msg.ext.receiverList) {
        if (data.userId === currentUserId || data.ext.userUuid === currentUserId) {
          needAdd = true
        }
      }
      if (needAdd) {
        switch (msg.type) {
          case "txt":
            msg.contentsType = "TEXT"
            msg.data = msg.payload.msg
            break;
          case "img":
            msg.contentsType = "IMAGE"
            msg.url = msg.payload.url
            break;
        }
        msgList.push(convertHXMessage(msg))
      }
    })
    return msgList.reverse();
  }
  /**
   * 发送消息
   * @param message 消息实体
   * @returns 发送结果
   */
  @Log.silence
  async sendMessage(message: AgoraIMMessageBase): Promise<AgoraIMMessageBase> {
    let newMsg: AgoraChat.MessageBody | null = null;
    let receiverList;
    switch (message.type) {
      case AgoraIMMessageType.Text:
        const {
          msg: textMsg,
          ext: textExt,
          receiverList: textReceiverList,
        } = message as AgoraIMTextMessage;
        //私聊消息通过群组进行发送
        receiverList = textReceiverList?.map((user) => user.userId)
        newMsg = websdk.message.create({
          to: receiverList != null && receiverList.length > 0 ? this._defaultChatRoomeId : this._currentChatRoomId,
          msg: textMsg,
          type: 'txt',
          chatType: 'chatRoom',
          ext: { ...textExt } as AgoraIMMessageExt,
          receiverList: textReceiverList?.map((user) => user.userId),
        });
        break;
      case AgoraIMMessageType.Image:
        const {
          file,
          url,
          ext: imageExt,
          width,
          height,
          receiverList: imageReceiverList,
        } = message as AgoraIMImageMessage<AgoraIMMessageExt>;
        //私聊消息通过群组进行发送
        receiverList = imageReceiverList?.map((user) => user.userId)
        newMsg = websdk.message.create({
          to: receiverList != null && receiverList.length > 0 ? this._defaultChatRoomeId : this._currentChatRoomId,
          type: 'img',
          chatType: 'chatRoom',
          ext: { ...imageExt } as AgoraIMMessageExt,
          receiverList: imageReceiverList?.map((user) => user.userId),
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
      case AgoraIMMessageType.Custom:
        const {
          action: customAction,
          ext: customExt,
          receiverList: customReceiverList,
        } = message as AgoraIMCustomMessage;

        //私聊消息通过群组进行发送
        receiverList = customReceiverList?.map((user) => user.userId)
        newMsg = websdk.message.create({
          to: receiverList != null && receiverList.length > 0 ? this._defaultChatRoomeId : this._currentChatRoomId,
          action: customAction,
          type: 'cmd',
          chatType: 'chatRoom',
          ext: { ...customExt } as AgoraIMMessageExt,
          receiverList: receiverList,
        });
        break;
      default:
        break;
    }
    if (!newMsg) return Promise.reject();

    const res = await this._classRoomConnection.send(newMsg);
    message.id = res.serverMsgId;
    return message;
  }
  /**
   * 创建文本消息实例
   * @param msg 文本消息数据
   * @param receiverList 私聊目标用户列表
   * @returns 文本消息实例
   */
  @Log.silence
  createTextMessage(msg: string, receiverList?: AgoraIMUserInfo[]) {
    const messageExt: AgoraIMMessageExt = {
      nickName: this._currentUserInfo.nickName,
      roomUuid: this._currentClassRoomUuid,
      role: this._currentUserInfo.ext?.role,
      avatarUrl: this._currentUserInfo.avatarUrl,
      receiverList: receiverList || [],
    };
    return new AgoraIMTextMessage({
      msg,
      ext: messageExt,
      id: websdk.utils.getUniqueId(),
      receiverList,
    });
  }
  /**
   * 创建自定义动作消息
   * @param action 自定义动作类型，例如：全员静音等
   * @param ext 每个自定义动作对应的消息数据
   * @param receiverList 私聊目标用户列表
   * @returns 自定义动作操作消息实例
   */
  @Log.silence
  createCustomMessage(
    action: AgoraIMCmdActionEnum,
    ext?: Partial<AgoraIMMessageExt>,
    receiverList?: AgoraIMUserInfo[],
  ) {
    const baseMessageExt: AgoraIMMessageExt = {
      nickName: this._currentUserInfo.nickName,
      roomUuid: this._currentClassRoomUuid,
      role: this._currentUserInfo.ext?.role,
      avatarUrl: this._currentUserInfo.avatarUrl,
      receiverList: receiverList || [],
    };
    return new AgoraIMCustomMessage({
      action,
      ext: Object.assign(baseMessageExt, ext),
      id: websdk.utils.getUniqueId(),
      receiverList,
    });
  }
  /**
   * 创建图片消息
   * @param params 图片消息数据
   * @param receiverList 私聊目标用户列表
   * @returns 图片消息实例
   */
  @Log.silence
  async createImageMessage(params: Partial<AgoraIMImageMessage>, receiverList?: AgoraIMUserInfo[]) {
    const messageExt: AgoraIMMessageExt = {
      nickName: this._currentUserInfo.nickName,
      roomUuid: this._currentClassRoomUuid,
      role: this._currentUserInfo.ext?.role,
      avatarUrl: this._currentUserInfo.avatarUrl,
      receiverList: receiverList || [],
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
      receiverList,
    });
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
    return `${log.time
      ? `${dayjs().format('YYYY-MM-DD')} ${log.time}`
      : `${dayjs().format('YYYY-MM-DD HH:mm:ss')}`
      } [Agora-Chat] ${logInfo}, args: ${JSON.stringify(log)}`;
  }
}