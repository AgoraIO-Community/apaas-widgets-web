import ReactDOM from 'react-dom';
import { App } from './app';
import type { AgoraWidgetController } from 'agora-edu-core';
import { FcrUISceneWidget, bound, transI18n } from 'agora-common-libs';
import { AgoraExtensionRoomEvent, AgoraExtensionWidgetEvent } from '../../../events';
import { SvgIconEnum } from '@components/svg-img';
import { addResource } from './i18n/config';
import { message } from 'antd';

export class FcrRttboxWidget extends FcrUISceneWidget {
  private static _installationDisposer?: CallableFunction;
  private _dom?: HTMLElement;
  private _privilege = false;
  get zContainer(): 0 | 10 {
    return 10;
  }
  get widgetName() {
    return 'rttbox';
  }
  get hasPrivilege() {
    const { role } = this.classroomConfig.sessionInfo;
    return [1, 3].includes(role) || this._privilege;
  }
  get dragHandleClassName(): string {
    return 'fcr-rtt-box-widget-container';
  }
  get draggable(): boolean {
    return true;
  }
  get resizable(): boolean {
    return true;
  }
  get defaultRect(): { x: number; y: number; width: number; height: number } {
    const clientRect = document.body.getBoundingClientRect();
    return {
      width: this.defaultWidth,
      height: this.defaultHeight,
      x: clientRect.width - this.defaultWidth - 20,
      y: clientRect.height / 2 - this.defaultHeight / 2,
    };
  }

  defaultWidth = 320;
  defaultHeight = 600;
  get minimizedProperties() {
    
    return {
      minimized:true,
      minimizedTooltip: transI18n('fcr_rtt_tips_title'),
      minimizedIcon: SvgIconEnum.FCR_V2_RTT,
      minimizedKey: this.widgetId,
      minimizedCollapsed: false
    };
    
   
  }
  async onInstall(controller: AgoraWidgetController) {
    await addResource();
    controller.broadcast(AgoraExtensionWidgetEvent.RegisterCabinetTool, {
      id: this.widgetName,
      name: transI18n('fcr_rtt_button_open'),
      iconType: SvgIconEnum.FCR_V2_RTT,
    });
  }
  onPropertiesUpdate(properties: any): void {
    // 获取下发数据
    console.log("更新数据了",properties)
    
    this.widgetController.broadcast(AgoraExtensionWidgetEvent.ChangeRttlanguage, {
      widgetId: this.widgetId,
      message: properties,
    });
  }
  @bound
  onCreate(properties: any) {
    this.setVisible(true);
    this.widgetController.broadcast(AgoraExtensionWidgetEvent.RegisterCabinetTool, {
      id: this.widgetName,
      name: transI18n('fcr_subtitles_button_close'),
      iconType: SvgIconEnum.FCR_V2_RTT,
    });
  }
  @bound
  setVisible(visible: boolean) {
    this.widgetController.broadcast(AgoraExtensionWidgetEvent.SetVisible, {
      widgetId: this.widgetId,
      visible: visible,
    });
  }
  @bound
  private _handleGranted(grantedUsers: Set<string>) {
    const { userUuid } = this.classroomConfig.sessionInfo;

    this._privilege = grantedUsers.has(userUuid);
  }

  render(dom: HTMLElement) {
    this._dom = dom;
    ReactDOM.render(<App widget={this} />, dom);
    //动态添加设置按钮，需要延迟一定时间，让界面先渲染下
    setTimeout(() => {
      this.widgetController.broadcast(AgoraExtensionRoomEvent.RttShowSetting, { targetClsName: "fcr_rtt_settings_show", buttonView: <button className="settings-button">{transI18n('fcr_rtt_settings')} <span className="settings-button-arrow-down"></span></button> })
    }, 200);
  }
  @bound
  clsoe() {
    this.widgetController.broadcast(AgoraExtensionWidgetEvent.WidgetBecomeInactive, this.widgetId);
    this.deleteWidget();
  }
  unload() {
    if (this._dom) {
      ReactDOM.unmountComponentAtNode(this._dom);
      this._dom = undefined;
    }
  }

  onDestroy() {
    this.widgetController.broadcast(AgoraExtensionWidgetEvent.RegisterCabinetTool, {
      id: this.widgetName,
      name: transI18n('fcr_rtt_button_open'),
      iconType: SvgIconEnum.FCR_V2_RTT,
    });
  }

  onUninstall(controller: AgoraWidgetController) {
    if (FcrRttboxWidget._installationDisposer) {
      FcrRttboxWidget._installationDisposer();
    }
  }
}
