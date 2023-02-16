import { AgoraHXChatWidget } from '../..';
import { computed, observable, runInAction, action } from 'mobx';
import { EduRoleTypeEnum, iterateMap } from 'agora-edu-core';
import { AgoraIMBase, AgoraIMEvents, AgoraIMUserInfo } from '../../../im/wrapper/typs';
import { Scheduler, bound } from 'agora-rte-sdk';

enum UserMutedState {
  Unmuted = 0,
  Muted = 1,
}
export class UserStore {
  @observable userCarouselAnimDelay = 3000;
  @observable joinedUser?: AgoraIMUserInfo;
  @observable userMuted = false;

  constructor(private _widget: AgoraHXChatWidget, private _fcrChatRoom: AgoraIMBase) {
    this._addEventListeners();
    this._onUserJoined = this._onUserJoined.bind(this);
    this._initUserMuted();
  }
  @action.bound
  private _initUserMuted() {
    this.userMuted =
      this._widget.classroomStore.userStore.localUser?.userProperties.get('flexProps').mute ===
      UserMutedState.Muted;
  }
  private _addEventListeners() {
    this._fcrChatRoom.on(AgoraIMEvents.UserJoined, this._onUserJoined);
    this._fcrChatRoom.on(AgoraIMEvents.UserMuted, this._onUserMuted);
    this._fcrChatRoom.on(AgoraIMEvents.UserUnmuted, this._onUserUnmuted);
  }
  private _removeEventListeners() {
    this._fcrChatRoom.off(AgoraIMEvents.UserJoined, this._onUserJoined);
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
  private async _onUserJoined(user: string) {
    if (this.joinedUser) return;
    const userInfoList = await this._fcrChatRoom.getUserInfoList([user]);
    const joinedUser = userInfoList[0];
    if (joinedUser.ext.role !== EduRoleTypeEnum.student) return;
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

  destroy() {
    this._removeEventListeners();
  }
}
