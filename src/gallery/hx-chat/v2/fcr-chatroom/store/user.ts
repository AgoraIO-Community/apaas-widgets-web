import { AgoraHXChatWidget } from '../..';
import { computed, observable, runInAction, action } from 'mobx';
import { EduRoleTypeEnum, iterateMap } from 'agora-edu-core';
import { AgoraIMBase, AgoraIMEvents, AgoraIMUserInfo } from '../../../../im/wrapper/typs';
import { bound } from 'agora-rte-sdk';

enum UserMutedState {
  Unmuted = 0,
  Muted = 1,
}
export class UserStore {
  @observable muteList: string[] = [];
  @observable searchKey = '';
  @action.bound
  setSearchKey(key: string) {
    this.searchKey = key;
  }
  @observable userMap: Map<string, AgoraIMUserInfo> = new Map();
  @observable userCarouselAnimDelay = 3000;
  @observable joinedUser?: AgoraIMUserInfo;
  @observable userMuted = false;

  @computed
  get userList() {
    return iterateMap(this.userMap, {
      onMap(_key, item) {
        return item;
      },
    }).list;
  }

  @computed
  get searchUserList() {
    return this.userList
      .filter((user) => user.nickName.includes(this.searchKey))
      .sort((a, b) => {
        if (a.ext.role === EduRoleTypeEnum.teacher) return -1;

        if (this.muteList.includes(a.userId) && b.ext.role !== EduRoleTypeEnum.teacher) return -1;

        return 0;
      });
  }
  constructor(private _widget: AgoraHXChatWidget, private _fcrChatRoom: AgoraIMBase) {
    this._addEventListeners();
    this._initUserMuted();
  }
  @bound
  async updateUsers(userUuids: string[]) {
    const users = await this._fcrChatRoom.getUserInfoList(userUuids);
    runInAction(() => {
      users.forEach((user) => {
        if (
          user.ext.role === EduRoleTypeEnum.teacher ||
          user.ext.role === EduRoleTypeEnum.student
        ) {
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
  }
  private _removeEventListeners() {
    this._fcrChatRoom.off(AgoraIMEvents.UserJoined, this._onUserJoined);
    this._fcrChatRoom.off(AgoraIMEvents.UserLeft, this._onUserLeft);

    this._fcrChatRoom.off(AgoraIMEvents.UserMuted, this._onUserMuted);
    this._fcrChatRoom.off(AgoraIMEvents.UserUnmuted, this._onUserUnmuted);
  }

  private _updateUserMutedState(muted: UserMutedState) {
    const { userUuid } = this._widget.classroomConfig.sessionInfo;
    const { updateUserProperties } = this._widget.classroomStore.userStore;
    updateUserProperties([
      {
        userUuid,
        properties: {
          mute: muted,
        },
        cause: {
          mute: muted ? 'mute' : 'unmute',
        },
      },
    ]);
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
  private async _onUserJoined(userUuid: string) {
    this.updateUsers([userUuid]);
  }
  @action.bound
  private async _onUserLeft(userUuid: string) {
    this.userMap.delete(userUuid);
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
        !userList.includes(user);
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
