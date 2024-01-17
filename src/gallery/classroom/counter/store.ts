import { action, autorun, computed, observable } from 'mobx';
import { AgoraCountdown } from '.';
import { AgoraExtensionRoomEvent, AgoraExtensionWidgetEvent } from '../../../events';
import { OrientationEnum } from '../hx-chat/type';

export class PluginStore {
  constructor(private _widget: AgoraCountdown) {
    autorun(() => {
      if (!this.isController) {
        this.setShowSetting(false);
      }
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
  }

  @observable
  number: number | null = 60;
  @observable landscapeToolBarVisible = false;
  @observable
  showSetting = true;
  @observable orientation: OrientationEnum = OrientationEnum.portrait;
  @observable forceLandscape = false;
  @computed
  get isLandscape() {
    return this.forceLandscape || this.orientation === OrientationEnum.landscape;
  }
  @action.bound
  private _handleMobileLandscapeToolBarStateChanged(visible: boolean) {
    this.landscapeToolBarVisible = visible;
  }
  @action.bound
  private _handleOrientationChanged(params: {
    orientation: OrientationEnum;
    forceLandscape: boolean;
  }) {
    this.orientation = params.orientation;
    this.forceLandscape = params.forceLandscape;
  }
  @action.bound
  setNumber(number: number | null) {
    this.number = number;
  }

  @action.bound
  setShowSetting(value: boolean) {
    this.showSetting = value;
  }

  @action.bound
  handleSetting(enabled: boolean) {
    this.setShowSetting(enabled);
  }

  /**
   * reset store
   */

  @action.bound
  destroy() {
    this.setShowSetting(this.isController);
    this.number = 60;
    this._widget.removeBroadcastListener({
      messageType: AgoraExtensionRoomEvent.OrientationStatesChanged,
      onMessage: this._handleOrientationChanged,
    });
  }

  @computed
  get maskEnable() {
    return this.isController ? !this.showSetting && this.isController : false;
  }

  /**
   * 获取时间差
   */
  @computed
  get getTimestampGap() {
    return this._widget.classroomStore.roomStore.clientServerTimeShift;
  }

  @computed
  get isController() {
    const { role } = this._widget.classroomConfig.sessionInfo;
    return [1, 3].includes(role);
  }
}
