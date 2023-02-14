import { AgoraHXChatWidget } from '../..';
import { computed, observable, action, runInAction } from 'mobx';
import { AgoraIMBase, AgoraIMEvents } from '../../../im/wrapper/typs';
import { ClassState } from 'agora-edu-core';
import dayjs from 'dayjs';
import { OrientationEnum } from '../../../../../../agora-classroom-sdk/src/infra/stores/common/type';
import {
  AgoraExtensionRoomEvent,
  AgoraExtensionWidgetEvent,
} from '../../../../../../agora-classroom-sdk/src/infra/protocol/events';
import { AgoraRteEventType, bound, Scheduler } from 'agora-rte-sdk';
import { ThumbsUpAni } from '../container/mobile/components/thumbsup/thumbsup';
export class RoomStore {
  roomName = this._widget.classroomConfig.sessionInfo.roomName;
  @observable messageVisible = true;
  @observable orientation: OrientationEnum = OrientationEnum.portrait;
  @observable forceLandscape = false;
  @observable
  allMuted = false;
  @observable thumbsupRenderCache = 0;

  private _thumbsupCache = 0;
  private _thumbsupDiffCache = 0;
  private _thumbsupRenderCount = 0;
  private _thumbsupUpdateTask: Scheduler.Task | undefined = undefined;
  private _thumbsupRenderTask: Scheduler.Task | undefined = undefined;
  private _thumbsUpAni: ThumbsUpAni | undefined;

  constructor(private _widget: AgoraHXChatWidget, private _fcrChatRoom: AgoraIMBase) {
    this._addEventListeners();
    runInAction(() => {
      this.thumbsupRenderCache =
        this._widget.classroomStore.connectionStore.scene?.dataStore.roomProperties.get(
          'flexProps',
        )?.['thumbsup'] || 0;
    });
  }
  private _addEventListeners() {
    this._fcrChatRoom.on(AgoraIMEvents.AllUserMuted, this._handleAllUserMuted);
    this._fcrChatRoom.on(AgoraIMEvents.AllUserUnmuted, this._handleAllUserUnmuted);
    this._widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.OrientationStatesChanged,
      onMessage: this._handleOrientationChanged,
    });
    this._widget.broadcast(AgoraExtensionWidgetEvent.RequestOrientationStates, undefined);
    this._widget.classroomStore.connectionStore.scene?.on(
      AgoraRteEventType.RoomPropertyUpdated,
      this._handleClassRoomPropertiesChange,
    );
  }
  private _removeEventListeners() {
    this._fcrChatRoom.off(AgoraIMEvents.AllUserMuted, this._handleAllUserMuted);
    this._fcrChatRoom.off(AgoraIMEvents.AllUserUnmuted, this._handleAllUserUnmuted);
    this._widget.removeBroadcastListener({
      messageType: AgoraExtensionRoomEvent.OrientationStatesChanged,
      onMessage: this._handleOrientationChanged,
    });
    this._widget.classroomStore.connectionStore.scene?.off(
      AgoraRteEventType.RoomPropertyUpdated,
      this._handleClassRoomPropertiesChange,
    );
  }
  @computed
  get isLandscape() {
    return this.forceLandscape || this.orientation === OrientationEnum.landscape;
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
      return `-- : --`;
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

  @bound
  setThumbsUpAni(thumbsUpAni: ThumbsUpAni) {
    this._thumbsUpAni = thumbsUpAni;
  }

  @action.bound
  setMessageVisible(visible: boolean) {
    this._widget.broadcast(AgoraExtensionWidgetEvent.AddSingletonToast, {
      desc: visible ? 'Chat pop-up screen has been opened' : 'Chat pop-up screen has been closed',
      type: 'normal',
    });
    this.messageVisible = visible;
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
    const { mute } = await this._fcrChatRoom.getChatRoomDetails();
    runInAction(() => {
      this.allMuted = mute;
    });
  }
  @action.bound
  private _handleOrientationChanged(params: {
    orientation: OrientationEnum;
    forceLandscape: boolean;
  }) {
    this.orientation = params.orientation;
    this.forceLandscape = params.forceLandscape;
  }
  @bound
  quitForceLandscape() {
    this._widget.broadcast(AgoraExtensionWidgetEvent.QuitForceLandscape, undefined);
  }
  @action.bound
  thumbsup() {
    this._thumbsupCache += 1;
    this.thumbsupRenderCache += 1;
    this._thumbsupDiffCache += 1;
    this._updateThumbsupCount();
  }
  @bound
  _updateThumbsupCount() {
    if (!this._thumbsupUpdateTask) {
      this._thumbsupUpdateTask = Scheduler.shared.addIntervalTask(async () => {
        if (this._thumbsupCache <= 0) {
          this._thumbsupUpdateTask?.stop();
          this._thumbsupUpdateTask = undefined;
          return;
        }
        this._widget.classroomStore.roomStore.updateFlexProperties({
          increments: { thumbsup: this._thumbsupCache },
          cause: {
            thumbsup: 'thumbsup',
          },
          throttleTime: 2000,
        });
        this._thumbsupCache = 0;
      }, 2000);
    }
  }
  @bound
  private _handleClassRoomPropertiesChange(
    changedRoomProperties: string[],
    roomProperties: any,
    operator: any,
    cause: any,
  ) {
    if (cause.data?.thumbsup) {
      const count = roomProperties['flexProps']['thumbsup'];
      const diffCount = count - (this.thumbsupRenderCache - this._thumbsupDiffCache);

      if (diffCount > 0) {
        const renderCount = diffCount - this._thumbsupDiffCache;

        if (renderCount > 0) {
          this._handleRemoteThumbsupChanged(renderCount);
          this._thumbsupDiffCache = 0;
        } else {
          this._thumbsupDiffCache = this._thumbsupDiffCache - diffCount;
        }
        runInAction(() => {
          this.thumbsupRenderCache = count;
        });
      }
    }
  }
  @action.bound
  private _handleRemoteThumbsupChanged(count: number) {
    if (count <= 0) return;
    this._thumbsupRenderCount += count;
    if (!this._thumbsupRenderTask) {
      this._thumbsupRenderTask = Scheduler.shared.addPollingTask(
        () => {
          if (this._thumbsupRenderCount <= 0) {
            this._thumbsupRenderTask?.stop();
            this._thumbsupRenderTask = undefined;
            return;
          }
          this._thumbsUpAni?.start();
          this._thumbsupRenderCount -= 1;
        },
        100,
        false,
      );
    }
  }
  destroy() {
    this._removeEventListeners();
  }
}
