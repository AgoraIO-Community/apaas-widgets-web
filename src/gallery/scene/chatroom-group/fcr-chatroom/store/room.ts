import { FcrChatroomWidget } from '../..';
import { computed, observable, action, runInAction } from 'mobx';
import { AgoraIMBase, AgoraIMEvents } from '../../../../../common/im/wrapper/typs';
import dayjs from 'dayjs';
import { AgoraExtensionRoomEvent, AgoraExtensionWidgetEvent } from '../../../../../events';
import { Logger, bound } from 'agora-common-libs';

export class RoomStore {
  constructor(private _widget: FcrChatroomWidget, private _fcrChatRoom: AgoraIMBase) {
    this._addEventListeners();
  }

  roomName = this._widget.classroomConfig.sessionInfo.roomName;

  isHost =
    this._widget.classroomConfig.sessionInfo.role === 1 ||
    this._widget.classroomConfig.sessionInfo.role === 3;

  @observable chatDialogVisible = false;
  @action.bound
  setChatDialogVisible(visible: boolean) {
    this._widget.broadcast(AgoraExtensionWidgetEvent.SetVisible, {
      widgetId: this._widget.widgetId,
      visible,
    });
  }
  @bound
  openChatDialog() {
    this.setChatDialogVisible(true);
  }
  @bound
  closeChatDialog() {
    this.setChatDialogVisible(false);
  }
  @action.bound
  private _handleWidgetVisibleChanged(message: { widgetId: string; visible: boolean }) {
    if (message.widgetId === this._widget.widgetId) {
      this.chatDialogVisible = message.visible;
    }
  }
  @observable
  allMuted = false;

  private _addEventListeners() {
    this._fcrChatRoom.on(AgoraIMEvents.AllUserMuted, this._handleAllUserMuted);
    this._fcrChatRoom.on(AgoraIMEvents.AllUserUnmuted, this._handleAllUserUnmuted);
    this._widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.VisibleChanged,
      onMessage: this._handleWidgetVisibleChanged,
    });
  }
  private _removeEventListeners() {
    this._fcrChatRoom.off(AgoraIMEvents.AllUserMuted, this._handleAllUserMuted);
    this._fcrChatRoom.off(AgoraIMEvents.AllUserUnmuted, this._handleAllUserUnmuted);
    this._widget.removeBroadcastListener({
      messageType: AgoraExtensionRoomEvent.VisibleChanged,
      onMessage: this._handleWidgetVisibleChanged,
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
        case 0:
          if (classroomSchedule.startTime !== undefined) {
            duration = Math.max(classroomSchedule.startTime - this.calibratedTime, 0);
          }
          break;
        case 1:
          if (classroomSchedule.startTime !== undefined) {
            duration = Math.max(this.calibratedTime - classroomSchedule.startTime, 0);
          }
          break;
        case 2:
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
      case 1:
        return `${this.formatCountDown(duration)}`;
      case 2:
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
  @bound
  async setAllMute(mute: boolean) {
    try {
      if (mute) {
        await this._fcrChatRoom.muteAllUserList();
      } else {
        await this._fcrChatRoom.unmuteAllUserList();
      }
      runInAction(() => {
        this.allMuted = mute;
      });
    } catch (err) {
      Logger.error('[Fcr-chatroom] set all mute error', err);
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
