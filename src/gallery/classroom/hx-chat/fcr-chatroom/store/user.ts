import { AgoraHXChatWidget } from '../..';
import { computed, observable, runInAction, action } from 'mobx';

import { AgoraIMBase, AgoraIMEvents, AgoraIMUserInfo } from '../../../../../common/im/wrapper/typs';
import { Scheduler, bound, transI18n } from 'agora-common-libs';
import { AgoraExtensionRoomEvent, AgoraExtensionWidgetEvent } from '../../../../../events';
import { CustomMessageHandsUpState } from '../../type';
import { iterateMap } from 'agora-common-libs';
import { AgoraIM } from '../../../../../common/im/wrapper';
import { AgoraRteMediaPublishState, AgoraRteMediaSourceState, AgoraRteVideoSourceType } from 'agora-rte-sdk';
import { EduClassroomConfig, EduRoleTypeEnum, EduStream, EduUserStruct, RteRole2EduRole } from 'agora-edu-core';

enum UserMutedState {
  Unmuted = 0,
  Muted = 1,
}
export class UserStore {
  @observable muteList: string[] = [];
  @observable userCarouselAnimDelay = 3000;
  @observable userMap: Map<string, AgoraIMUserInfo> = new Map();
  @observable joinedUser?: AgoraIMUserInfo;
  @observable userMuted = false;
  @observable isRaiseHand = false;
  @observable raiseHandTooltipVisible = false;
  @observable searchKey = '';
  @action.bound
  setSearchKey(key: string) {
    this.searchKey = key;
  }
  private _raiseHandTooltipTask: Scheduler.Task | null = null;

  constructor(private _widget: AgoraHXChatWidget, private _fcrChatRoom: AgoraIMBase) {
    runInAction(() => {
      this._privateUser = this._fcrChatRoom.getPrivateUser();
    });
    this._addEventListeners();
    this._onUserJoined = this._onUserJoined.bind(this);
    this._initUserMuted();
  }
  @computed
  get userList() {
    return iterateMap(this.userMap, {
      onMap(_key, item) {
        return item;
      },
    }).list;
  }
  @bound
  async updateUsers(userUuids: string[]) {
    const users = await this._fcrChatRoom.getUserInfoList(userUuids);
    runInAction(() => {
      users.forEach((user) => {
        if (user.ext.role === 1 || user.ext.role === 2) {
          this.userMap.set(user.userId, user);
        }
      });
    });
  }
  @bound
  async updateUser(userUuid: string) {
    const [user] = await this._fcrChatRoom.getUserInfoList([userUuid]);
    const userIndex = this.userList.findIndex((user) => user.userId === userUuid);
    runInAction(() => {
      if (userIndex === -1) {
        this.userList.push(user);
      } else {
        this.userList[userIndex] = user;
      }
    });
  }
  @action.bound
  private async _onUserLeft(userUuid: string) {
    const users = AgoraIM.getRoomManager(this._fcrChatRoom.getRoomId())?.getAllUserList();
    if (users) {
      this.updateAllUsers(users);
    }
  }
  @computed
  get searchUserList() {
    return this.userList
      .filter((user) => user.nickName.toLowerCase().includes(this.searchKey.toLowerCase()))
      .sort((a, b) => {
        if (a.ext.role === 1) return -1;

        if (this.muteList.includes(a.userId) && b.ext.role !== 1) return -1;

        return 0;
      });
  }
  @action.bound
  private _initUserMuted() {
    this.userMuted =
      this._widget.classroomStore.userStore.localUser?.userProperties.get('flexProps')?.mute ===
      UserMutedState.Muted;
  }
  private _addEventListeners() {
    this._fcrChatRoom.on(AgoraIMEvents.UserJoined, this._onUserJoined);
    this._fcrChatRoom.on(AgoraIMEvents.UserLeft, this._onUserLeft);

    this._fcrChatRoom.on(AgoraIMEvents.UserMuted, this._onUserMuted);
    this._fcrChatRoom.on(AgoraIMEvents.UserUnmuted, this._onUserUnmuted);
    this._widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.PrivateChat,
      onMessage: this._handlePrivateChat,
    });
    this._widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RaiseHandStateChanged,
      onMessage: this._onRaiseHandStateChanged,
    });
  }
  private _removeEventListeners() {
    this._fcrChatRoom.off(AgoraIMEvents.UserJoined, this._onUserJoined);
    this._fcrChatRoom.off(AgoraIMEvents.UserJoined, this._onUserLeft);
    this._fcrChatRoom.off(AgoraIMEvents.UserMuted, this._onUserMuted);
    this._fcrChatRoom.off(AgoraIMEvents.UserUnmuted, this._onUserUnmuted);
    this._widget.removeBroadcastListener({
      messageType: AgoraExtensionRoomEvent.PrivateChat,
      onMessage: this._handlePrivateChat,
    });
    this._widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RaiseHandStateChanged,
      onMessage: this._onRaiseHandStateChanged,
    });
  }
  @observable
  private _privateUser?: AgoraIMUserInfo;
  @computed
  get privateUser() {
    return this._privateUser;
  }
  @action.bound
  setPrivateUser(user: AgoraIMUserInfo | undefined) {
    this._fcrChatRoom.setPrivateUser(user);
    this._privateUser = user;
  }

  @action.bound
  private _handlePrivateChat(message: { widgetId: string; userId: string }) {
    if (message.widgetId === this._widget.widgetId) {
      const privateChatUser = this.userList.find((user) => user.ext.userUuid === message.userId);
      this.setPrivateUser(privateChatUser);
    }
  }

  @action.bound
  private _onRaiseHandStateChanged(data: CustomMessageHandsUpState) {
    this.isRaiseHand = data === CustomMessageHandsUpState.raiseHand;
    if (this.isRaiseHand) {
      this.raiseHandTooltipVisible = true;
      this._raiseHandTooltipTask = Scheduler.shared.addDelayTask(() => {
        runInAction(() => {
          this.raiseHandTooltipVisible = false;
        });
      }, 6000);
    } else {
      this._raiseHandTooltipTask?.stop();
      this.raiseHandTooltipVisible = false;
    }
  }
  @bound
  raiseHand() {
    this._widget.broadcast(AgoraExtensionWidgetEvent.RaiseHand, undefined);
  }
  @bound
  lowerHand() {
    this._widget.broadcast(AgoraExtensionWidgetEvent.LowerHand, undefined);
  }

  @bound
  private _updateUserMutedState(muted: UserMutedState) {
    const { userUuid } = this._widget.classroomConfig.sessionInfo;
    const { updateUserProperties } = this._widget.classroomStore.userStore;
    const scene = this._widget.classroomStore.connectionStore.scene;
    updateUserProperties(
      [
        {
          userUuid,
          properties: {
            mute: muted,
          },
          cause: {
            mute: muted ? 'mute' : 'unmute',
          },
        },
      ],
      scene,
    );
  }

  @action.bound
  private _onUserMuted() {
    this.userMuted = true;
    this._updateUserMutedState(UserMutedState.Muted);
  }
  @action.bound
  private _onUserUnmuted() {
    this.userMuted = false;
    this._updateUserMutedState(UserMutedState.Unmuted);
  }
  @bound
  async updateAllUsers(users: AgoraIMUserInfo[]) {
    runInAction(() => {
      this.userMap.clear()
      users.forEach((user) => {
        if (user.ext.role === 1 || user.ext.role === 2) {
          this.userMap.set(user.userId, user);
        }
      });
    });
  }
  @bound
  private async _onUserJoined(user: string) {
    const users = AgoraIM.getRoomManager(this._fcrChatRoom.getRoomId())?.getAllUserList();
    if (users) {
      this.updateAllUsers(users);
    }
    // this.updateUsers([user]);
    // if (this.joinedUser) return;
    // const userInfoList = await this._fcrChatRoom.getUserInfoList([user]);
    // const joinedUser = userInfoList[0];
    // if (joinedUser.ext.role !== 2) return;
    // runInAction(() => {
    //   if (joinedUser) this.joinedUser = joinedUser;
    // });
    // Scheduler.shared.addDelayTask(() => {
    //   runInAction(() => {
    //     this.joinedUser = undefined;
    //   });
    // }, this.userCarouselAnimDelay + 500);
  }
  @computed get teacherName() {
    return this._widget.classroomStore.roomStore.flexProps['teacherName'];
  }
  @bound
  async muteUserList(userList: string[]) {
    if (!this.checkUserInCurrentGroup(userList)) {
      this._widget.ui.addToast(transI18n('fcr_chat_options_no_one_room'));
      return;
    }
    await this._fcrChatRoom.muteUserList({ userList });
    runInAction(() => {
      this.muteList = this.muteList.concat(userList);
    });
  }
  @bound
  async unmuteUserList(userList: string[]) {
    if (!this.checkUserInCurrentGroup(userList)) {
      this._widget.ui.addToast(transI18n('fcr_chat_options_no_one_room'));
      return;
    }
    await this._fcrChatRoom.unmuteUserList({ userList });
    runInAction(() => {
      this.muteList = this.muteList.filter((user) => {
        return !userList.includes(user);
      });
    });
  }
  @bound
  async getMutedUserList() {
    const res = await this._fcrChatRoom.getMutedUserList();
    runInAction(() => {
      this.muteList = res;
    });
  }
  destroy() {
    this._removeEventListeners();
  }
  /**
   * 判断用户是否在当前聊天室中
   */
  private checkUserInCurrentGroup(userList: string[]): boolean {
    //获取所有用户列表
    const allList = AgoraIM.getRoomManager(this._fcrChatRoom.getRoomId())?.getAllUserList();
    //获取所有分组的用户列表
    const groupInfo = this._widget.classroomStore.groupStore.groupDetails;
    //获取需要判断的用户列表
    const judgeUserList: string[] = [];
    let find;
    if (this._fcrChatRoom.checkDefChatRoom()) {
      //当前是主房间
      const otherUser = new Set<string>();
      groupInfo.forEach((value) => {
        value.users.forEach((user) => {
          find = allList?.find((item) => user.userUuid === item.ext.userUuid);
          if (find) {
            otherUser.add(find.userId);
          }
        });
      });
      if (allList != null) {
        judgeUserList.push(
          ...allList.filter((item) => !otherUser.has(item.userId)).map((item) => item.userId),
        );
      }
    } else {
      //当前是分组聊天室
      if (
        this._widget.classroomStore.groupStore.currentSubRoom != null &&
        groupInfo.has(this._widget.classroomStore.groupStore.currentSubRoom)
      ) {
        groupInfo
          .get(this._widget.classroomStore.groupStore.currentSubRoom)
          ?.users?.forEach((user) => {
            find = allList?.find((item) => user.userUuid === item.ext.userUuid);
            if (find) {
              judgeUserList.push(find.userId);
            }
          });
      }
    }
    //判断要禁言的用户是不是实际在当前房间里
    return userList.every((element) => judgeUserList.includes(element));
  }



  @computed
  private get localUser() {
    return this._widget.classroomStore.userStore.localUser;
  }
  @computed
  private get isInGroup() {
    return this._widget.classroomStore.groupStore.groupUuidByUserUuid.get(
      this.localUser?.userUuid || '',
    );
  }
  @computed
  private get cameraUIStreams() {
    return Array.from(this.cameraStreams)
      .filter((stream) => {
        return this.isInGroup
          ? true
          : !this._widget.classroomStore.groupStore.groupUuidByUserUuid.get(
            stream.fromUser.userUuid,
          );
      })
      .map((stream) => new EduStream(stream));
  }
  @computed
  private get teacherUIStream() {
    return this.cameraUIStreams.find((stream) => {
      return RteRole2EduRole(EduClassroomConfig.shared.sessionInfo.roomType, stream.fromUser.role) === EduRoleTypeEnum.teacher;
    });
  }
  /**
   * 老师流信息
   * @returns
   */
  @computed
  private get teacherCameraStream() {
    return this.teacherUIStream;
  }
  @computed
  private get studentCameraUIStreams() {
    const { classroomStore } = this._widget;
    const { studentList } = classroomStore.userStore;

    return this.cameraUIStreams.filter((stream) => {
      return studentList.has(stream.fromUser.userUuid);
    });
  }
  /**
   * 学生流信息列表
   * @returns
   */
  @computed
  private get studentCameraStreams(): EduStream[] {
    return this.studentCameraUIStreams.map((stream) => stream);
  }
  @computed
  private get cameraStreams() {
    const { streamByUserUuid, streamByStreamUuid } =
      this._widget.classroomStore.streamStore;
    const cameraStreams = extractUserStreams(
      this._widget.classroomStore.userStore.users,
      streamByUserUuid,
      streamByStreamUuid,
      [AgoraRteVideoSourceType.Camera],
    );
    return cameraStreams;
  }
  /**
   * 分离窗口视频流
   * @returns
   */
  @computed get allUIStreams(): Map<string, EduStream> {
    const uiStreams = new Map<string, EduStream>();

    [this.teacherCameraStream, ...this.studentCameraStreams].forEach((streamUI) => {
      if (streamUI) {
        uiStreams.set(streamUI.streamUuid, streamUI);
      }
    });
    return uiStreams;
  }
  //相机是否开启
  checkCameraEnabled(stream?: EduStream) {
    return AgoraRteMediaSourceState.started === stream?.videoSourceState && AgoraRteMediaPublishState.Published === stream?.videoState;
  }
  //麦克风是否开启
  checkMicEnabled(stream?: EduStream) {
    return AgoraRteMediaSourceState.started === stream?.audioSourceState && AgoraRteMediaPublishState.Published === stream?.audioState;
  }
}

/**
 * 提取流列表
 */
const extractUserStreams = (
  users: Map<string, EduUserStruct>,
  streamByUserUuid: Map<string, Set<string>>,
  streamByStreamUuid: Map<string, EduStream>,
  sourceTypes: AgoraRteVideoSourceType[],
) => {
  const streams = new Set<EduStream>();
  for (const user of users.values()) {
    const streamUuids = streamByUserUuid.get(user.userUuid) || new Set();
    for (const streamUuid of streamUuids) {
      const stream = streamByStreamUuid.get(streamUuid);

      if (stream && sourceTypes.includes(stream.videoSourceType)) {
        streams.add(stream);
      }
    }
  }
  return streams;
};
