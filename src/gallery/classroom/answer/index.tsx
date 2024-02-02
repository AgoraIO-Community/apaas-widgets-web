import { observable, action } from 'mobx';
import { Provider } from 'mobx-react';
import ReactDOM from 'react-dom';
import App from './app';
import Clock from './Clock';
import { PluginStore } from './store';
import { addResource } from './i18n/config';
import { AgoraEduToolWidget } from '../../../common/edu-tool-widget';
import { WidgetModal } from '../../../components/modal';
import type { AgoraWidgetController } from 'agora-edu-core';
import { transI18n, ThemeProvider } from 'agora-common-libs';
import { AgoraExtensionWidgetEvent } from '../../../events';

export class AgoraSelector extends AgoraEduToolWidget {
  private _dom?: HTMLElement;
  private _store?: PluginStore;
  @observable
  roomProperties: any = {};
  @observable
  userProperties: any = {};

  get widgetName(): string {
    return 'popupQuiz';
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
    return 150;
  }

  async onInstall(controller: AgoraWidgetController) {
    await addResource();
    if (controller.classroomConfig.sessionInfo.roomType !== 2) {
      controller.broadcast(AgoraExtensionWidgetEvent.RegisterCabinetTool, {
        id: this.widgetName,
        name: transI18n('widget_selector.appName'),
        iconType: 'answer',
      });
    }
  }

  @action
  onCreate(properties: any, userProperties: any) {
    this._store = new PluginStore(this);
    this.roomProperties = properties;
    this.userProperties = userProperties;
  }

  @action
  onPropertiesUpdate(properties: any): void {
    this.roomProperties = properties;
  }

  @action
  onUserPropertiesUpdate(userProperties: any): void {
    this.userProperties = userProperties;
  }

  render(dom: HTMLElement) {
    this._dom = dom;
    ReactDOM.render(
      <Provider store={this._store}>
        <ThemeProvider value={this.theme}>
          <WidgetModal
            title={transI18n('widget_selector.appName')}
            closable={this.controlled}
            onCancel={this.handleClose}
            onResize={this.handleResize}
            header={<Clock />}>
            <App />
          </WidgetModal>
        </ThemeProvider>
      </Provider>,
      dom,
    );
  }

  unload() {
    if (this._dom) {
      ReactDOM.unmountComponentAtNode(this._dom);
      this._dom = undefined;
    }
  }

  onDestroy() {
    if (this._store) {
      this._store.resetStore();
    }
  }

  onUninstall(controller: AgoraWidgetController) {
    controller.broadcast(AgoraExtensionWidgetEvent.UnregisterCabinetTool, this.widgetName);
  }
}
