import ReactDOM from 'react-dom';
import { observable, action } from 'mobx';

import type { AgoraWidgetController } from 'agora-edu-core';

import { FcrUISceneWidget,  transI18n } from 'agora-common-libs';
import { AgoraExtensionWidgetEvent } from '../../../events';
import { FcrCountdownApp } from './app';
import { SvgIconEnum } from '@components/svg-img';
import { addResource } from './i18n/config';

export class FcrCountdownWidget extends FcrUISceneWidget {
  @observable
  roomProperties: any = {};
  @observable
  userProperties: any = {};
  private _dom?: HTMLElement;
  private _width = 230;
  private _height = 242;
  get minimizedProperties() {
    return {
      minimizedTooltip: transI18n('fcr_countdown_timer_title'),
      minimizedIcon: SvgIconEnum.FCR_V2_TIMER,
      minimizedKey: this.widgetId,
      minimizedCollapsed: false,
      extra: {
        current: 0,
      },
    };
  }
  get defaultRect() {
    const clientRect = document.body.getBoundingClientRect();
    return {
      width: this._width,
      height: this._height,
      x: this.isAudience
        ? clientRect.width - this._width - 10
        : clientRect.width / 2 - this._width / 2,
      y: this.isAudience ? 45 : clientRect.height / 2 - this._height / 2,
    };
  }
  get isAudience() {
    const { role } = this.classroomConfig.sessionInfo;
    return role === 0;
  }
  get widgetName(): string {
    return 'countdownTimer';
  }

  get zContainer(): 0 | 10 {
    return 0;
  }

  get dragHandleClassName(): string {
    return 'fcr-countdown-container';
  }

  get dragCancelClassName() {
    return 'fcr-countdown';
  }
  get hasPrivilege() {
    const { role } = this.classroomConfig.sessionInfo;
    return role === 1 || role === 3;
  }
  onInstall(controller: AgoraWidgetController) {
    addResource();
    controller.broadcast(AgoraExtensionWidgetEvent.RegisterCabinetTool, {
      id: this.widgetName,
      name: transI18n('fcr_countdown_timer_title'),
      iconType: SvgIconEnum.FCR_V2_TIMER,
    });
  }

  onUninstall(controller: AgoraWidgetController) {
    controller.broadcast(AgoraExtensionWidgetEvent.UnregisterCabinetTool, this.widgetName);
  }

  @action
  onCreate(properties: any, userProperties: any) {
    this.widgetController.broadcast(AgoraExtensionWidgetEvent.SetVisible, {
      widgetId: this.widgetId,
      visible: true,
    });
    this.roomProperties = properties;
    this.userProperties = userProperties;
  }

  @action
  onPropertiesUpdate(properties: any) {
    this.roomProperties = properties;
  }
  @action
  onUserPropertiesUpdate(userProperties: any) {
    this.userProperties = userProperties;
  }

  render(dom: HTMLElement) {
    this._dom = dom;
    ReactDOM.render(<FcrCountdownApp widget={this}></FcrCountdownApp>, dom);
  }
  locate() {
    return null;
  }
  unload() {
    if (this._dom) {
      ReactDOM.unmountComponentAtNode(this._dom);
      this._dom = undefined;
    }
  }

  onDestroy() {}
}
