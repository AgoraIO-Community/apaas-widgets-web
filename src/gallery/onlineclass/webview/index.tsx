import ReactDOM from 'react-dom';
import { App } from './app';
import { EduRoleTypeEnum } from 'agora-edu-core/lib/type';
import type { AgoraWidgetController } from 'agora-edu-core';
import {
  AgoraOnlineclassSDKDialogWidget,
  AgoraOnlineclassSDKWidgetBase,
  AgoraWidgetTrackMode,
  bound,
} from 'agora-common-libs';
import { AgoraExtensionRoomEvent, AgoraExtensionWidgetEvent } from '../../../events';
import { SvgIconEnum } from '@components/svg-img';

export class FcrWebviewWidget
  extends AgoraOnlineclassSDKWidgetBase
  implements AgoraOnlineclassSDKDialogWidget
{
  private static _installationDisposer?: CallableFunction;
  private _dom?: HTMLElement;
  private _webviewUrl?: string;
  private _webviewTitle?: string;
  private _privilege = false;

  get widgetName() {
    return 'webView';
  }
  get hasPrivilege() {
    const { role } = this.classroomConfig.sessionInfo;
    return [EduRoleTypeEnum.teacher, EduRoleTypeEnum.assistant].includes(role) || this._privilege;
  }
  get displayName() {
    return this.webviewTitle;
  }

  closeable = true;
  minimizable = true;
  fullscreenable = true;
  refreshable = true;
  defaultWidth = 800;
  defaultHeight = 600;
  minimizeProperties = {
    minimizedIcon: SvgIconEnum.FCR_FILE_ALF,
    minimizedKey: 'Online Course',
    minimizedCollapsed: true,
    minimizedCollapsedIcon: SvgIconEnum.FCR_ALF2,
  };
  get minWidth() {
    return 400;
  }
  get minHeight() {
    return 300;
  }
  get trackMode() {
    return AgoraWidgetTrackMode.TrackPositionAndDimensions;
  }

  get webviewUrl() {
    return this._webviewUrl;
  }

  get webviewTitle() {
    return this._webviewTitle;
  }

  onInstall(controller: AgoraWidgetController) {
    const handleOpen = ({
      url,
      resourceUuid,
      title,
    }: {
      url: string;
      resourceUuid: string;
      title: string;
    }) => {
      const widgetId = `webView-${resourceUuid}`;
      const extra = {
        webviewTitle: title,
        webViewUrl: url,
        zIndex: 0,
      };

      // 打开远端
      controller.setWidegtActive(widgetId, {
        extra,
      });
      // 打开本地
      controller.broadcast(AgoraExtensionWidgetEvent.WidgetBecomeActive, {
        widgetId,
        defaults: {
          properties: { extra },
        },
      });
    };

    controller.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.OpenWebview,
      onMessage: handleOpen,
    });

    FcrWebviewWidget._installationDisposer = () => {
      controller.removeBroadcastListener({
        messageType: AgoraExtensionRoomEvent.OpenWebview,
        onMessage: handleOpen,
      });
    };
  }

  onCreate(properties: any) {
    const url = properties.extra?.webViewUrl;
    const title = properties.extra?.webviewTitle;

    if (url) {
      this._webviewUrl = url;
    }
    if (title) {
      this._webviewTitle = title;
    }

    this.addBroadcastListener({
      messageType: AgoraExtensionWidgetEvent.BoardGrantedUsersUpdated,
      onMessage: this._handleGranted,
    });

    this.addMessageListener({
      messageType: AgoraExtensionRoomEvent.ResponseGrantedList,
      onMessage: this._handleGranted,
    });

    this.broadcast(AgoraExtensionWidgetEvent.RequestGrantedList, this.widgetId);
  }

  @bound
  private _handleGranted(grantedUsers: Set<string>) {
    const { userUuid } = this.classroomConfig.sessionInfo;

    this._privilege = grantedUsers.has(userUuid);
  }

  render(dom: HTMLElement) {
    this._dom = dom;
    dom.classList.add('fcr-h-full');
    ReactDOM.render(<App widget={this} />, dom);
  }

  unload() {
    if (this._dom) {
      ReactDOM.unmountComponentAtNode(this._dom);
      this._dom = undefined;
    }
  }

  onDestroy() {
    this.removeBroadcastListener({
      messageType: AgoraExtensionWidgetEvent.BoardGrantedUsersUpdated,
      onMessage: this._handleGranted,
    });

    this.removeMessageListener({
      messageType: AgoraExtensionRoomEvent.ResponseGrantedList,
      onMessage: this._handleGranted,
    });
  }

  onUninstall(controller: AgoraWidgetController) {
    if (FcrWebviewWidget._installationDisposer) {
      FcrWebviewWidget._installationDisposer();
    }
  }
}
