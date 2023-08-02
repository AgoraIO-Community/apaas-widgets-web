import ReactDOM from 'react-dom';
import { observable, action } from 'mobx';

import type { AgoraWidgetController } from 'agora-edu-core';
import { EduRoleTypeEnum } from 'agora-edu-core';

import {
  AgoraDraggableWidget,
  AgoraOnlineclassSDKWidgetBase,
  AgoraWidgetLifecycle,
  bound,
  transI18n,
} from 'agora-common-libs';
import { AgoraExtensionWidgetEvent } from '../../../events';
import { FcrCountdownApp } from './app';
import { SvgIconEnum } from '@components/svg-img';

export class FcrCountdownWidget
  extends AgoraOnlineclassSDKWidgetBase
  implements AgoraWidgetLifecycle, AgoraDraggableWidget
{
  @observable
  roomProperties: any = {};
  @observable
  userProperties: any = {};
  private _dom?: HTMLElement;
  private _width = 230;
  private _height = 242;

  get defaultRect() {
    const clientRect = document.body.getBoundingClientRect();
    return {
      width: this._width,
      height: this._height,
      x: clientRect.width / 2 - this._width / 2,
      y: clientRect.height / 2 - this._height / 2,
    };
  }
  get widgetName(): string {
    return 'countdown';
  }

  get zContainer(): 0 | 10 {
    return 0;
  }
  get dragCancelClassName() {
    return 'fcr-countdown';
  }
  get hasPrivilege() {
    const { role } = this.classroomConfig.sessionInfo;
    return role === EduRoleTypeEnum.teacher;
  }
  onInstall(controller: AgoraWidgetController) {
    controller.broadcast(AgoraExtensionWidgetEvent.RegisterCabinetTool, {
      id: this.widgetName,
      name: transI18n('widget_countdown.appName'),
      iconType: 'countdown',
    });
  }

  onUninstall(controller: AgoraWidgetController) {
    controller.broadcast(AgoraExtensionWidgetEvent.UnregisterCabinetTool, this.widgetName);
  }

  @action
  onCreate(properties: any, userProperties: any) {
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
  @bound
  setMinimize(
    minimized = true,
    extra: {
      current: number;
    },
  ) {
    if (minimized) {
      this.widgetController.broadcast(AgoraExtensionWidgetEvent.Minimize, {
        minimized: true,
        widgetId: this.widgetId,
        minimizeProperties: {
          minimizedTooltip: transI18n('fcr_poll_title'),
          minimizedIcon: SvgIconEnum.FCR_V2_TIMER,
          minimizedKey: this.widgetId,
          minimizedCollapsed: false,
          extra,
        },
      });
    } else {
      this.broadcast(AgoraExtensionWidgetEvent.Minimize, {
        minimized: false,
        widgetId: this.widgetId,
        minimizeProperties: {
          minimizedCollapsed: false,
        },
      });
    }
  }
  @bound
  handleClose() {
    this.widgetController.broadcast(AgoraExtensionWidgetEvent.WidgetBecomeInactive, this.widgetId);

    this.deleteWidget();
  }
  onDestroy() {}
}
