import { AgoraHXChatWidget } from '../..';
import { computed, observable, action, runInAction } from 'mobx';
import { AgoraIMBase, AgoraIMEvents } from '../../../../../common/im/wrapper/typs';
import dayjs from 'dayjs';
import { ThumbsUpAni } from '../container/mobile/components/thumbs-up/thumbs-up';
import { transI18n, bound, Scheduler } from 'agora-common-libs';
import { AgoraExtensionRoomEvent, AgoraExtensionWidgetEvent } from '../../../../../events';
import { OrientationEnum } from '../../type';
export enum MobileCallState {
  Initialize = 'initialize',
  Processing = 'processing',
  VoiceCall = 'voiceCall',
  VideoCall = 'videoCall',
  VideoAndVoiceCall = 'videoAndVoiceCall',
  DeviceOffCall = 'deviceOffCall',
}
export class RoomStore {
  roomName = this._widget.classroomConfig.sessionInfo.roomName;
  @observable mobileCallState: MobileCallState = MobileCallState.Initialize;
  @observable messageVisible = true;
  @observable orientation: OrientationEnum = OrientationEnum.portrait;
  @observable forceLandscape = false;
  @observable
  allMuted = false;

  @observable landscapeToolBarVisible = false;

  //用于本地展示点赞数
  @observable thumbsUpRenderCache = 0;
  //缓存本地点赞要上报的个数
  private _thumbsUpCache = 0;
  //缓存本地点赞了多少次，用于和服务端下发的总数进行diff，判断远端用户点赞多少次
  private _thumbsUpDiffCache = 0;
  //缓存上一次服务端下发的点赞总数
  private _thumbsUpCountCache = 0;
  //远端用户点赞数渲染缓存
  private _thumbsUpRenderCount = 0;
  private _thumbsUpUpdateTask: Scheduler.Task | undefined = undefined;
  private _thumbsUpRenderTask: Scheduler.Task | undefined = undefined;
  private _thumbsUpAni: ThumbsUpAni | undefined;

  constructor(private _widget: AgoraHXChatWidget, private _fcrChatRoom: AgoraIMBase) {
    this._addEventListeners();
    this._initializeThumbsCount();
  }

  @action.bound
  private _initializeThumbsCount() {
    const thumbsUpCount =
      (
        this._widget.classroomStore.connectionStore.scene?.dataStore.roomProperties.get(
          'flexProps',
        ) as { thumbsUp: number }
      )?.['thumbsUp'] || 0;
    runInAction(() => {
      this.thumbsUpRenderCache = thumbsUpCount;
    });
    this._thumbsUpCountCache = thumbsUpCount;
  }

  @action.bound
  private _handleMobileLandscapeToolBarStateChanged(visible: boolean) {
    this.landscapeToolBarVisible = visible;
  }
  @action.bound
  private _handleMobileCallStateChanged(state: MobileCallState) {
    this.mobileCallState = state;
  }
  private _addEventListeners() {
    this._fcrChatRoom.on(AgoraIMEvents.AllUserMuted, this._handleAllUserMuted);
    this._fcrChatRoom.on(AgoraIMEvents.AllUserUnmuted, this._handleAllUserUnmuted);
    this._widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.MobileCallStateChanged,
      onMessage: this._handleMobileCallStateChanged,
    });
    this._widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.MobileLandscapeToolBarVisibleChanged,
      onMessage: this._handleMobileLandscapeToolBarStateChanged,
    });
    this._widget.broadcast(
      AgoraExtensionWidgetEvent.RequestMobileLandscapeToolBarVisible,
      undefined,
    );

    this._widget.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.OrientationStatesChanged,
      onMessage: this._handleOrientationChanged,
    });
    this._widget.broadcast(AgoraExtensionWidgetEvent.RequestOrientationStates, undefined);
    this._widget.classroomStore.connectionStore.scene?.on(
      'room-property-updated',
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
      'room-property-updated',
      this._handleClassRoomPropertiesChange,
    );
    this._widget.removeBroadcastListener({
      messageType: AgoraExtensionRoomEvent.MobileCallStateChanged,
      onMessage: this._handleMobileCallStateChanged,
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
  setThumbsUpAni(thumbsUpAni: ThumbsUpAni) {
    this._thumbsUpAni = thumbsUpAni;
  }

  @action.bound
  setMessageVisible(visible: boolean) {
    this._widget.broadcast(AgoraExtensionWidgetEvent.AddSingletonToast, {
      desc: visible ? transI18n('fcr_H5_tips_chat_display') : transI18n('fcr_H5_tips_chat_hidden'),
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
  thumbsUp() {
    this._thumbsUpCache += 1;
    this.thumbsUpRenderCache += 1;
    this._thumbsUpDiffCache += 1;
    this._updateThumbsUpCount();
  }
  @bound
  _updateThumbsUpCount() {
    if (!this._thumbsUpUpdateTask) {
      this._thumbsUpUpdateTask = Scheduler.shared.addIntervalTask(async () => {
        if (this._thumbsUpCache <= 0) {
          this._thumbsUpUpdateTask?.stop();
          this._thumbsUpUpdateTask = undefined;
          return;
        }
        this._widget.classroomStore.roomStore.updateIncrementProperties(
          { thumbsUp: this._thumbsUpCache },
          {
            thumbsUp: 'thumbsUp',
          },
          2000,
        );
        this._thumbsUpCache = 0;
      }, 2000);
    }
  }
  @action.bound
  private _handleClassRoomPropertiesChange(
    changedRoomProperties: string[],
    roomProperties: any,
    operator: any,
    cause: any,
  ) {
    if (cause.data?.thumbsUp) {
      const count = roomProperties['flexProps']['thumbsUp'];

      //远端用户点赞个数 = 服务端点赞总数 - 上一次服务端点赞总数 - 本地点赞个数
      const diffCount = count - this._thumbsUpCountCache - this._thumbsUpDiffCache;
      if (diffCount > 0) {
        //除去本地点赞个数后，如果还有剩余，说明有远端用户点赞，渲染动画
        this._handleRemoteThumbsupChanged(diffCount);
      }
      this._thumbsUpDiffCache = Math.max(
        this._thumbsUpDiffCache - Math.abs(count - this._thumbsUpCountCache),
        0,
      );
      this.thumbsUpRenderCache = Math.max(count, this.thumbsUpRenderCache);
      this._thumbsUpCountCache = count;
    }
  }
  @action.bound
  private _handleRemoteThumbsupChanged(count: number) {
    if (count <= 0) return;
    this._thumbsUpRenderCount += count;
    if (!this._thumbsUpRenderTask) {
      this._thumbsUpRenderTask = Scheduler.shared.addPollingTask(
        () => {
          if (this._thumbsUpRenderCount <= 0) {
            this._thumbsUpRenderTask?.stop();
            this._thumbsUpRenderTask = undefined;
            return;
          }
          this._thumbsUpAni?.start();
          this._thumbsUpRenderCount -= 1;
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
