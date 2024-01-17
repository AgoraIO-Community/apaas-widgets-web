import { Provider } from 'mobx-react';
import ReactDOM from 'react-dom';
import App from './app';
import { PluginStore } from './store';
import { observable, action } from 'mobx';
import { WidgetModal } from '../../../components/modal';
import { AgoraEduToolWidget } from '../../../common/edu-tool-widget';
import type { AgoraWidgetController } from 'agora-edu-core';
import { transI18n, ThemeProvider } from 'agora-common-libs';
import { addResource } from './i18n/config';
import { PollH5 } from './mobile/app';
import { AgoraExtensionWidgetEvent } from '../../../events';

export class AgoraPolling extends AgoraEduToolWidget {
  private _store?: PluginStore;
  private _dom?: HTMLElement;
  @observable
  roomProperties: any = {};
  @observable
  userProperties: any = {};

  get widgetName(): string {
    return 'poll';
  }
  get zContainer(): 0 | 10 {
    return 10;
  }
  get hasPrivilege() {
    const { role } = this.classroomConfig.sessionInfo;
    return [1, 3].includes(role);
  }

  get minWidth() {
    return 360;
  }
  get minHeight() {
    return 283;
  }

  async onInstall(controller: AgoraWidgetController) {
    await addResource();
    if (controller.classroomConfig.sessionInfo.roomType !== 0) {
      controller.broadcast(AgoraExtensionWidgetEvent.RegisterCabinetTool, {
        id: this.widgetName,
        name: transI18n('widget_polling.appName'),
        iconType: 'vote',
      });
    }
  }

  @action
  onCreate(properties: any, userProperties: any) {
    this._store = new PluginStore(this);
    this.roomProperties = properties;
    this.userProperties = userProperties;
    this.widgetController.broadcast(AgoraExtensionWidgetEvent.PollActiveStateChanged, true);
  }
  @action
  onPropertiesUpdate(properties: any): void {
    this.roomProperties = properties;
  }

  @action
  onUserPropertiesUpdate(userProperties: any): void {
    this.userProperties = userProperties;
  }

  onDestroy(): void {
    this.widgetController.broadcast(AgoraExtensionWidgetEvent.PollActiveStateChanged, false);

    if (this._store) {
      this._store.destroy();
    }
  }
  locate(): HTMLElement | null | undefined {
    const { platform } = this.classroomConfig;
    if (platform === 'H5') return document.querySelector('.fcr-poll-mobile-widget') as HTMLElement;
  }
  render(dom: HTMLElement) {
    this._dom = dom;
    const { platform } = this.classroomConfig;
    if (platform === 'H5') {
      ReactDOM.render(
        <Provider store={this._store}>
          <ThemeProvider value={this.theme}>
            <PollH5 />
          </ThemeProvider>
        </Provider>,
        dom,
      );
    } else {
      ReactDOM.render(
        <Provider store={this._store}>
          <ThemeProvider value={this.theme}>
            <WidgetModal
              title={transI18n('widget_polling.appName')}
              closable={this.controlled}
              onCancel={this.handleClose}
              onResize={this.handleResize}>
              <App />
            </WidgetModal>
          </ThemeProvider>
        </Provider>,
        dom,
      );
    }
  }

  unload() {
    if (this._dom) {
      ReactDOM.unmountComponentAtNode(this._dom);
      this._dom = undefined;
    }
  }

  onUninstall(controller: AgoraWidgetController) {
    controller.broadcast(AgoraExtensionWidgetEvent.UnregisterCabinetTool, this.widgetName);
  }
}
