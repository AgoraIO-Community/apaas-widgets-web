import type { EduRoleTypeEnum } from 'agora-edu-core';
import { AGEventEmitter } from 'agora-common-libs';

export abstract class AgoraIMBase extends AGEventEmitter implements AgoraIMEventEmitter {
  connectionState: AgoraIMConnectionState = AgoraIMConnectionState.DisConnected;
  abstract userInfo?: AgoraIMUserInfo;
  protected setConnectionState(connectionState: AgoraIMConnectionState) {
    this.connectionState = connectionState;
    this.emit(AgoraIMEvents.ConnectionStateChanged, connectionState);
  }
  abstract init(appKey: string): void;
  abstract join(joinOptions: { token: string }): Promise<void>;
  abstract leave(): Promise<void>;
  abstract sendMessage(message: AgoraIMMessageBase): Promise<AgoraIMMessageBase>;
  abstract getUserList(params: { pageNum: number; pageSize: number }): Promise<AgoraIMUserInfo[]>;
  abstract getHistoryMessageList(params?: {
    pageSize?: number;
    msgId?: string | number;
  }): Promise<AgoraIMMessageBase[]>;
  abstract getAnnouncement(): Promise<string>;
  abstract setAnnouncement(announcement: string): Promise<void>;
  abstract deleteAnnouncement(): Promise<void>;
  abstract muteAllUserList(): Promise<void>;
  abstract unmuteAllUserList(): Promise<void>;
  abstract muteUserList(params: { userList: string[]; duration?: number }): Promise<void>;
  abstract unmuteUserList(params: { userList: string[] }): Promise<void>;
  abstract getMutedUserList(): Promise<string[]>;
  abstract getUserInfoList(userIdList: string[]): Promise<AgoraIMUserInfo[]>;
  abstract setSelfUserInfo(userInfo: AgoraIMUserInfo): Promise<AgoraIMUserInfo>;
  abstract createTextMessage(msg: string, receiverList?: AgoraIMUserInfo[]): AgoraIMTextMessage;
  abstract createImageMessage(
    params: Exclude<Partial<AgoraIMImageMessage>, 'receiverList'>,
    receiverList?: AgoraIMUserInfo[],
  ): Promise<AgoraIMImageMessage>;
  abstract createCustomMessage(
    action: AgoraIMCmdActionEnum,
    ext?: Partial<AgoraIMMessageExt>,
    receiverList?: AgoraIMUserInfo[],
  ): AgoraIMCustomMessage;

  abstract getChatRoomDetails(): Promise<AgoraIMChatRoomDetails>;
}

export interface AgoraIMEventEmitter {
  on(
    evt: AgoraIMEvents.ConnectionStateChanged,
    cb: (connectionState: AgoraIMConnectionState) => void,
  ): this;
  on(evt: AgoraIMEvents.TextMessageReceived, cb: (msg: AgoraIMTextMessage) => void): this;
  on(evt: AgoraIMEvents.ImageMessageReceived, cb: (msg: AgoraIMImageMessage) => void): this;
  on(evt: AgoraIMEvents.CustomMessageReceived, cb: (msg: AgoraIMCustomMessage) => void): this;
  on(evt: AgoraIMEvents.UserJoined, cb: (user: string) => void): this;
  on(evt: AgoraIMEvents.UserLeft, cb: (user: string) => void): this;

  on(evt: AgoraIMEvents.AnnouncementUpdated, cb: () => void): this;
  on(evt: AgoraIMEvents.AnnouncementDeleted, cb: () => void): this;

  on(evt: AgoraIMEvents.UserMuted, cb: () => void): this;
  on(evt: AgoraIMEvents.UserUnmuted, cb: () => void): this;

  on(evt: AgoraIMEvents.AllUserMuted, cb: () => void): this;
  on(evt: AgoraIMEvents.AllUserUnmuted, cb: () => void): this;

  on(evt: AgoraIMEvents.UserMuted, cb: () => void): this;
  on(evt: AgoraIMEvents.UserUnmuted, cb: () => void): this;

  on(evt: AgoraIMEvents.ErrorOccurred, cb: (e: unknown) => void): this;
}
export interface AgoraIMChatRoomDetails {
  mute: boolean;
  affiliations: { member?: string; owner?: string }[];
}

export interface AgoraIMMessageExt {
  nickName: string;
  roomUuid: string;
  role: EduRoleTypeEnum;
  avatarUrl: string;
  muteMember?: string;
  muteNickName?: string;
  receiverList: AgoraIMUserInfo[];
}
export class AgoraIMMessageBase<B = unknown, E extends AgoraIMMessageExt = AgoraIMMessageExt> {
  id: string;
  from?: string;
  to?: string;
  type?: AgoraIMMessageType;
  body?: B;
  ext?: E;
  ts?: number;
  receiverList?: AgoraIMUserInfo[];
  constructor(params: AgoraIMMessageBase<B, E>) {
    this.id = params.id;
    this.from = params.from;
    this.to = params.to;
    this.type = params.type;
    this.body = params.body;
    this.ext = params.ext;
    this.ts = params.ts || new Date().getTime();
    this.receiverList = params.receiverList;
  }
}
export class AgoraIMTextMessage extends AgoraIMMessageBase {
  msg: string;

  constructor(params: AgoraIMTextMessage) {
    super(params);
    this.type = AgoraIMMessageType.Text;
    this.msg = params.msg;
  }
}

export class AgoraIMImageMessage<
  E extends AgoraIMMessageExt = AgoraIMMessageExt,
> extends AgoraIMMessageBase<unknown, E> {
  url?: string;
  file?: File;
  width?: number;
  height?: number;
  onFileUploadError?(): void;
  onFileUploadProgress?(e: unknown): void;
  onFileUploadComplete?(): void;

  constructor(params: AgoraIMImageMessage<E>) {
    super(params);
    this.type = AgoraIMMessageType.Image;

    this.url = params.url;
    this.file = params.file;
    this.width = params.width;
    this.height = params.height;
    this.onFileUploadComplete = params.onFileUploadComplete;
    this.onFileUploadError = params.onFileUploadError;
    this.onFileUploadProgress = params.onFileUploadProgress;
  }
}
export enum AgoraIMCmdActionEnum {
  AllUserMuted = 'setAllMute',
  AllUserUnmuted = 'removeAllMute',
  UserMuted = 'mute',
  UserUnmuted = 'unmute',
  MsgDeleted = 'DEL',
}
export class AgoraIMCustomMessage extends AgoraIMMessageBase {
  action: AgoraIMCmdActionEnum;
  constructor(params: AgoraIMCustomMessage) {
    super(params);
    this.type = AgoraIMMessageType.Custom;

    this.action = params.action;
  }
}
export enum AgoraIMEvents {
  ConnectionStateChanged = 'connectionStateChanged',
  TextMessageReceived = 'textMessageReceived',
  ImageMessageReceived = 'imageMessageReceived',
  CustomMessageReceived = 'customMessageReceived',
  UserListUpdated = 'userListUpdated',
  UserJoined = 'userJoined',
  UserLeft = 'userLeft',
  ErrorOccurred = 'errorOccurred',
  AnnouncementUpdated = 'announcementUpdated',
  AnnouncementDeleted = 'announcementDeleted',
  AllUserMuted = 'allUserMuted',
  AllUserUnmuted = 'allUserUnmuted',
  UserMuted = 'userMuted',
  UserUnmuted = 'userUnmuted',
}
export enum AgoraIMConnectionState {
  DisConnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected',
}
export enum AgoraIMMessageType {
  Text = 'text',
  Image = 'image',
  Custom = 'custom',
}
export interface AgoraIMUserInfo<E extends AgoraIMUserInfoExt = AgoraIMUserInfoExt> {
  userId: string;
  nickName: string;
  avatarUrl: string;
  ext: E;
}

export interface AgoraIMUserInfoExt {
  role: EduRoleTypeEnum;
  userUuid: string;
}
