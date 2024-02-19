import { AgoraHXChatWidget } from '../..';
import { computed, observable, runInAction, action } from 'mobx';

import { AgoraIMBase, AgoraIMEvents, AgoraIMUserInfo } from '../../../../../common/im/wrapper/typs';
import { Scheduler, bound } from 'agora-common-libs';
import { AgoraExtensionRoomEvent, AgoraExtensionWidgetEvent } from '../../../../../events';
import { CustomMessageHandsUpState } from '../../type';

enum UserMutedState {
  Unmuted = 0,
  Muted = 1,
}
export class UserStore {
  @observable userCarouselAnimDelay = 3000;
  @observable joinedUser?: AgoraIMUserInfo;
  @observable userMuted = false;
  @observable isRaiseHand = false;
  @observable raiseHandTooltipVisible = false;
  private _raiseHandTooltipTask: Scheduler.Task | null = null;
  constructor(private _widget: AgoraHXChatWidget, private _fcrChatRoom: AgoraIMBase) {
    this._addEventListeners();
    this._onUserJoined = this._onUserJoined.bind(this);
    this._initUserMuted();
  }
  @action.bound
  private _initUserMuted() {
    this.userMuted =
      this._widget.classroomStore.userStore.localUser?.userProperties.get('flexProps')?.mute ===
      UserMutedState.Muted;
  }
  private _addEventListeners() {
    this._fcrChatRoom.on(AgoraIMEvents.UserJoined, this._onUserJoined);
    this._fcrChatRoom.on(AgoraIMEvents.UserMuted, this._onUserMuted);
    this._fcrChatRoom.on(AgoraIMEvents.UserUnmuted, this._onUserUnmuted);
    this._widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RaiseHandStateChanged,
      onMessage: this._onRaiseHandStateChanged,
    });
  }
  private _removeEventListeners() {
    this._fcrChatRoom.off(AgoraIMEvents.UserJoined, this._onUserJoined);
    this._fcrChatRoom.off(AgoraIMEvents.UserMuted, this._onUserMuted);
    this._fcrChatRoom.off(AgoraIMEvents.UserUnmuted, this._onUserUnmuted);
    this._widget.removeBroadcastListener({
      messageType: AgoraExtensionRoomEvent.RaiseHandStateChanged,
      onMessage: this._onRaiseHandStateChanged,
    });
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

  destroy() {
    this._removeEventListeners();
  }
}
