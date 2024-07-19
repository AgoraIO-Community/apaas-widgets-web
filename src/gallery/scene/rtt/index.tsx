import ReactDOM from 'react-dom';
import { App } from './app';
import type { AgoraWidgetController } from 'agora-edu-core';
import { FcrUISceneWidget, bound, transI18n } from 'agora-common-libs';
import { AgoraExtensionRoomEvent, AgoraExtensionWidgetEvent } from '../../../events';
import { SvgIconEnum } from '@components/svg-img';
import { addResource } from './i18n/config';
import { PopoverWithTooltip } from '@components/popover';
import { message } from 'antd';
import { fcrRttManager } from '../../../common/rtt/rtt-manager'
import { IAgoraUserData } from 'agora-rte-sdk/lib/core/processor/type';
import { IAgoraUserSessionInfo } from 'agora-edu-core/lib/stores/domain/common/user/struct';

export class FcrRTTWidget extends FcrUISceneWidget {
  private static _installationDisposer?: CallableFunction;
  private _dom?: HTMLElement;
  private _privilege = false;
  get zContainer(): 0 | 10 {
    return 10;
  }
  get widgetName() {
    return 'rtt';
  }
  get hasPrivilege() {
    const { role } = this.classroomConfig.sessionInfo;
    return [1, 3].includes(role) || this._privilege;
  }
  get dragHandleClassName(): string {
    return 'fcr-rtt-widget-container';
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
      x: clientRect.width / 2 - this.defaultWidth / 2,
      y: clientRect.height - 100 - this.defaultHeight,
    };
  }

  defaultWidth = 750;
  defaultHeight = 50;
  async onInstall(controller: AgoraWidgetController) {
    await addResource();
    controller.broadcast(AgoraExtensionWidgetEvent.RegisterCabinetTool, {
      id: this.widgetName,
      name: transI18n('fcr_subtitles_button_open'),
      iconType: SvgIconEnum.FCR_V2_SUBTITIES
    });
   
  }
  onPropertiesUpdate(properties: any,operator:IAgoraUserSessionInfo|null): void {
    // 获取下发数据
    console.log("更新数据了",properties + operator)
    fcrRttManager.onRoomWidgetPropertiesChange(properties,operator)
  }
  @bound
  onCreate(properties: any) {
    fcrRttManager.resetListener(this.widgetController)
    fcrRttManager.resetDefaultInfo(properties,this.classroomStore,this.classroomConfig)
    console.log("数据初始化了",properties)
    this.setVisible(true);
    // this.widgetController.broadcast(AgoraExtensionWidgetEvent.UnregisterCabinetTool, this.widgetName);
    this.widgetController.broadcast(AgoraExtensionWidgetEvent.RegisterCabinetTool, {
      id: this.widgetName,
      name: transI18n('fcr_subtitles_button_open'),
      iconType: SvgIconEnum.FCR_V2_SUBTITIES,
    });
    this.widgetController.addBroadcastListener( {
      messageType: AgoraExtensionRoomEvent.ToolboxChanged,
      onMessage: () => {
        this.setToolVisible(true)
      }
    }
    );
    this.widgetController.addBroadcastListener( {
      messageType: AgoraExtensionRoomEvent.RttboxChanged,
      onMessage: () => {
        // this.setRttVisible(true)
      }
    }
    );
  }
  @bound
  setVisible(visible: boolean) {
    this.widgetController.broadcast(AgoraExtensionWidgetEvent.SetVisible, {
      widgetId: this.widgetId,
      visible: visible,
    });
  }
  @bound
  setToolVisible(visible: boolean) {
    this.widgetController.broadcast(AgoraExtensionWidgetEvent.SetVisible, {
      widgetId: this.widgetId,
      visible: visible,
    });
  }
  @bound
  setRttVisible(visible: boolean) {
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
  }
  @bound
  clsoe() {
    this.widgetController.broadcast(AgoraExtensionWidgetEvent.RegisterCabinetTool, {
      id: this.widgetName,
      name: transI18n('fcr_subtitles_button_open'),
      iconType: SvgIconEnum.FCR_V2_SUBTITIES, 
    });
    this.deleteWidget();
  }
  unload() {
    if (this._dom) {
      ReactDOM.unmountComponentAtNode(this._dom);
      this._dom = undefined;
    }  
  }

  onDestroy() {
    fcrRttManager.release()
    this.widgetController.broadcast(AgoraExtensionWidgetEvent.RegisterCabinetTool, {
      id: this.widgetName,
      name: transI18n('fcr_subtitles_button_open'),
      iconType: SvgIconEnum.FCR_V2_SUBTITIES,
    });
  }

  onUninstall(controller: AgoraWidgetController) {
    if (FcrRTTWidget._installationDisposer) {
      FcrRTTWidget._installationDisposer();
    }
  }
}
