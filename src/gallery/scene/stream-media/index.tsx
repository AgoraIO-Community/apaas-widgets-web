import ReactDOM from 'react-dom';
import { App } from './app';
import type { AgoraWidgetController } from 'agora-edu-core';
import { observable, computed } from 'mobx';
import { AgoraExtensionRoomEvent, AgoraExtensionWidgetEvent } from '../../../events';
import { FcrUISceneWidget, bound } from 'agora-common-libs';
import { SvgIconEnum } from '@components/svg-img';

export class FcrStreamMediaPlayerWidget extends FcrUISceneWidget {
  private static _installationDisposer?: CallableFunction;
  private _dom?: HTMLElement;
  private _webviewUrl?: string;
  private _webviewTitle = '';
  private _privilege = false;
  @observable
  private _state?: {
    currentTime: number;
    isPlaying: boolean;
    isMuted: boolean;
    volume: number;
    operatorId: string;
  };

  get widgetName() {
    return 'mediaPlayer';
  }

  @computed
  get hasPrivilege() {
    const { role } = this.classroomConfig.sessionInfo;
    return [1, 3].includes(role) || this._privilege;
  }
  get displayName() {
    return this.webviewTitle;
  }

  get defaultRect(): { x: number; y: number; width: number; height: number } {
    const clientRect = document.body.getBoundingClientRect();
    return {
      width: this.defaultWidth,
      height: this.defaultHeight,
      x: clientRect.width / 2 - this.defaultWidth / 2,
      y: clientRect.height / 2 - this.defaultHeight / 2,
    };
  }
  defaultWidth = 800;
  defaultHeight = 600;
  get minimizedProperties() {
    return {
      minimizedIcon: SvgIconEnum.FCR_FILE_ALF,
      minimizedKey: 'Online Course',
      minimizedCollapsed: true,
      minimizedCollapsedIcon: SvgIconEnum.FCR_ALF2,
      minimizedTooltip: this.displayName,
    };
  }
  get resizable(): boolean {
    return true;
  }
  get minWidth() {
    return 400;
  }
  get minHeight() {
    return 300;
  }

  get webviewUrl() {
    return this._webviewUrl;
  }

  get webviewTitle() {
    return this._webviewTitle;
  }

  get operatorId() {
    return this.classroomConfig.sessionInfo.userUuid;
  }

  @computed
  get state() {
    return this._state;
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
      const widgetId = `mediaPlayer-${resourceUuid}`;
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
      messageType: AgoraExtensionRoomEvent.OpenStreamMediaPlayer,
      onMessage: handleOpen,
    });

    FcrStreamMediaPlayerWidget._installationDisposer = () => {
      controller.removeBroadcastListener({
        messageType: AgoraExtensionRoomEvent.OpenStreamMediaPlayer,
        onMessage: handleOpen,
      });
    };
  }

  onCreate(properties: any) {
    this._handleStateUpdate(properties);

    this.addBroadcastListener({
      messageType: AgoraExtensionWidgetEvent.BoardGrantedUsersUpdated,
      onMessage: this._handleGranted,
    });

    this.addMessageListener({
      messageType: AgoraExtensionRoomEvent.ResponseGrantedList,
      onMessage: this._handleGranted,
    });

    this.broadcast(AgoraExtensionWidgetEvent.RequestGrantedList, this.widgetId);
    this.widgetController.broadcast(AgoraExtensionWidgetEvent.SetVisible, {
      widgetId: this.widgetId,
      visible: true,
    });
  }

  onPropertiesUpdate(properties: any) {
    this._handleStateUpdate(properties);
  }

  private _handleStateUpdate(properties: any) {
    const { webViewUrl, webviewTitle, ...state } = properties.extra;

    if (webViewUrl) {
      this._webviewUrl = webViewUrl;
    }
    if (webviewTitle) {
      this._webviewTitle = webviewTitle;
    }

    this._state = state;
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
    if (FcrStreamMediaPlayerWidget._installationDisposer) {
      FcrStreamMediaPlayerWidget._installationDisposer();
    }
  }
}
