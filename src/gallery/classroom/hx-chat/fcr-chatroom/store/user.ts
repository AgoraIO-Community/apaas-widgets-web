import { AgoraHXChatWidget } from '../..';
import { computed, observable, runInAction, action } from 'mobx';

import { AgoraIMBase, AgoraIMEvents, AgoraIMUserInfo } from '../../../../../common/im/wrapper/typs';
import { Scheduler, bound } from 'agora-common-libs';
import { AgoraExtensionRoomEvent, AgoraExtensionWidgetEvent } from '../../../../../events';
import { CustomMessageHandsUpState } from '../../type';
import { iterateMap } from 'agora-common-libs';

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
    this.userMap.delete(userUuid);
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
  private async _onUserJoined(user: string) {
    this.updateUsers([user]);
    if (this.joinedUser) return;
    const userInfoList = await this._fcrChatRoom.getUserInfoList([user]);
    const joinedUser = userInfoList[0];
    if (joinedUser.ext.role !== 2) return;
    runInAction(() => {
      if (joinedUser) this.joinedUser = joinedUser;
    });
    Scheduler.shared.addDelayTask(() => {
      runInAction(() => {
        this.joinedUser = undefined;
      });
    }, this.userCarouselAnimDelay + 500);
  }
  @computed get teacherName() {
    return this._widget.classroomStore.roomStore.flexProps['teacherName'];
  }
  @bound
  async muteUserList(userList: string[]) {
    await this._fcrChatRoom.muteUserList({ userList });
    runInAction(() => {
      this.muteList = this.muteList.concat(userList);
    });
  }
  @bound
  async unmuteUserList(userList: string[]) {
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
}
