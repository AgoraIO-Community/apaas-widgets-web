import ReactDOM from 'react-dom';
import { App } from './app';
import type { AgoraWidgetController } from 'agora-edu-core';
import { FcrUISceneWidget, bound } from 'agora-common-libs';
import { AgoraExtensionRoomEvent, AgoraExtensionWidgetEvent } from '../../../events';
import { SvgIconEnum } from '@components/svg-img';

export class FcrWebviewWidget extends FcrUISceneWidget {
  private static _installationDisposer?: CallableFunction;
  private _dom?: HTMLElement;
  private _webviewUrl?: string;
  private _webviewTitle = '';
  private _privilege = false;

  get widgetName() {
    return 'webView';
  }
  get hasPrivilege() {
    const { role } = this.classroomConfig.sessionInfo;
    return [1, 3].includes(role) || this._privilege;
  }
  get displayName(): string {
    return this.webviewTitle;
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
  locate() {
    const dom = document.querySelector(`.widget-slot-web-view-${this.widgetId}`);
    if (dom) {
      return dom as HTMLElement;
    }
  }

  onCreate(properties: any) {
    const url = properties.extra?.webViewUrl;
    const title = properties.extra?.webviewTitle;

    if (url) {
      const isGoogleDocs = /docs.google.com/.test(url);
      if (isGoogleDocs) {
        function convertToIframeUrl(url: string): string {
          const patterns: { [key: string]: string } = {
            // Presentation
            'https://docs.google.com/presentation/d/([^/]+)/edit':
              'https://docs.google.com/presentation/d/$1/embed',
            // Sheets
            'https://docs.google.com/spreadsheets/d/([^/]+)/edit':
              'https://docs.google.com/spreadsheets/d/$1/pubhtml',
            // Document
            'https://docs.google.com/document/d/([^/]+)/edit':
              'https://docs.google.com/document/d/$1/pub',
            // Forms (we need to check for viewform format)
            'https://docs.google.com/forms/d/e/([^/]+)/viewform':
              'https://docs.google.com/forms/d/e/$1/viewform',
          };

          for (const pattern in patterns) {
            const regex = new RegExp(pattern);
            if (regex.test(url)) {
              // Replace the URL path to convert it to an embed URL
              const newUrl = url.replace(regex, patterns[pattern]);

              // Parse the new and original URLs
              const newUrlObj = new URL(newUrl);
              const originalUrlObj = new URL(url);

              // Copy search parameters from the original URL to the new URL, if they don't already exist
              originalUrlObj.searchParams.forEach((value, key) => {
                if (!newUrlObj.searchParams.has(key)) {
                  newUrlObj.searchParams.append(key, value);
                }
              });

              return newUrlObj.toString();
            }
          }

          return url;
        }
        this._webviewUrl = convertToIframeUrl(url);
      } else {
        this._webviewUrl = url;
      }
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
    this.widgetController.broadcast(AgoraExtensionWidgetEvent.SetVisible, {
      widgetId: this.widgetId,
      visible: true,
    });
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
