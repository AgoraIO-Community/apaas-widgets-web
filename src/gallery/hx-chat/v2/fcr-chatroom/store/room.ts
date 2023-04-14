import { AgoraHXChatWidget } from '../..';
import { computed, observable, action, runInAction } from 'mobx';
import { AgoraIMBase, AgoraIMEvents } from '../../../../im/wrapper/typs';
import { ClassState, EduRoleTypeEnum } from 'agora-edu-core';
import dayjs from 'dayjs';
import { AgoraExtensionRoomEvent } from '../../../../../events';
import { bound } from 'agora-rte-sdk';

export class RoomStore {
  constructor(private _widget: AgoraHXChatWidget, private _fcrChatRoom: AgoraIMBase) {
    this._addEventListeners();
  }

  roomName = this._widget.classroomConfig.sessionInfo.roomName;

  isHost = this._widget.classroomConfig.sessionInfo.role === EduRoleTypeEnum.teacher;

  @observable chatDialogVisible = false;
  @action.bound
  setChatDialogVisible(visible: boolean) {
    this.chatDialogVisible = visible;
  }
  @bound
  openChatDialog() {
    this.setChatDialogVisible(true);
  }
  @observable
  allMuted = false;

  private _addEventListeners() {
    this._widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.OpenChatDialog,
      onMessage: this.openChatDialog,
    });
    this._fcrChatRoom.on(AgoraIMEvents.AllUserMuted, this._handleAllUserMuted);
    this._fcrChatRoom.on(AgoraIMEvents.AllUserUnmuted, this._handleAllUserUnmuted);
  }
  private _removeEventListeners() {
    this._fcrChatRoom.off(AgoraIMEvents.AllUserMuted, this._handleAllUserMuted);
    this._fcrChatRoom.off(AgoraIMEvents.AllUserUnmuted, this._handleAllUserUnmuted);
    this._widget.removeBroadcastListener({
      messageType: AgoraExtensionRoomEvent.OpenChatDialog,
      onMessage: this.openChatDialog,
    });
  }
  @computed
  get userCount() {
    const isTeacherInClass = this._widget.classroomStore.userStore.teacherList.size > 0;
    return Math.max(
      this._widget.classroomStore.userStore.userCount - (isTeacherInClass ? 1 : 0),
      0,
    );
  }

  @computed
  get calibratedTime() {
    const { clockTime, clientServerTimeShift } = this._widget.classroomStore.roomStore;
    return clockTime + clientServerTimeShift;
  }
  @computed
  get classTimeDuration(): number {
    const { classroomSchedule } = this._widget.classroomStore.roomStore;
    let duration = -1;
    if (classroomSchedule) {
      switch (classroomSchedule.state) {
        case ClassState.beforeClass:
          if (classroomSchedule.startTime !== undefined) {
            duration = Math.max(classroomSchedule.startTime - this.calibratedTime, 0);
          }
          break;
        case ClassState.ongoing:
          if (classroomSchedule.startTime !== undefined) {
            duration = Math.max(this.calibratedTime - classroomSchedule.startTime, 0);
          }
          break;
        case ClassState.afterClass:
          if (
            classroomSchedule.startTime !== undefined &&
            classroomSchedule.duration !== undefined
          ) {
            duration = Math.max(this.calibratedTime - classroomSchedule.startTime, 0);
          }
          break;
      }
    }
    return duration;
  }
  @computed
  get classStatusText() {
    const duration = this.classTimeDuration || 0;

    if (duration < 0) {
      return ``;
    }
    const {
      classroomSchedule: { state },
    } = this._widget.classroomStore.roomStore;

    switch (state) {
      case ClassState.ongoing:
        return `${this.formatCountDown(duration)}`;
      case ClassState.afterClass:
        return `${this.formatCountDown(duration)}`;
      default:
        return ``;
    }
  }
  private formatCountDown(ms: number): string {
    const duration = dayjs.duration(ms);

    if (duration.days() > 0) {
      const mmss = duration.format('mm:ss');
      const h = Math.floor(duration.asHours());
      return `${h}:${mmss}`;
    }

    const seconds = Math.floor(ms / 1000);
    if (seconds < 60 * 60) {
      return duration.format('mm:ss');
    }

    return duration.format('HH:mm:ss');
  }
  async setAllMute(mute: boolean) {
    if (mute) {
      await this._fcrChatRoom.muteAllUserList();
    } else {
      await this._fcrChatRoom.unmuteAllUserList();
    }
  }
  @action.bound
  private _handleAllUserMuted() {
    this.allMuted = true;
  }
  @action.bound
  private _handleAllUserUnmuted() {
    this.allMuted = false;
  }
  async getChatRoomDetails() {
    const { mute, affiliations } = await this._fcrChatRoom.getChatRoomDetails();
    runInAction(() => {
      this.allMuted = mute;
    });
    return {
      mute,
      affiliations,
    };
  }

  destroy() {
    this._removeEventListeners();
  }
}
