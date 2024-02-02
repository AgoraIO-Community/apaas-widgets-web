import type { AgoraWidgetController } from 'agora-edu-core';

import classNames from 'classnames';
import { observer } from 'mobx-react';
import ReactDOM from 'react-dom';
import { WaterMark } from '../../../components/watermark';
import { WidgetWatermarkUIStore } from './store';
import { AgoraCloudClassWidget } from 'agora-common-libs';
const App = observer(({ widget }: { widget: FcrWatermarkWidget }) => {
  const widgetStore = widget.widgetStore as WidgetWatermarkUIStore;
  return widgetStore.visible ? (
    <WaterMark
      className="fcr-h-full"
      markClassName="fcr-h-full"
      zIndex={999}
      content={widgetStore.content}></WaterMark>
  ) : null;
});

export class FcrWatermarkWidget extends AgoraCloudClassWidget {
  private _dom?: HTMLElement;
  private _widgetStore = new WidgetWatermarkUIStore(this);
  private _rendered = false;
  get hasPrivilege() {
    const { role } = this.classroomConfig.sessionInfo;
    return [1, 3].includes(role);
  }

  onInstall(controller: AgoraWidgetController): void {}
  get widgetName(): string {
    return 'watermark';
  }
  get widgetStore() {
    return this._widgetStore;
  }

  onCreate(properties: any, userProperties: any) {
    // 更新文字和visible状态
    const { visible, content } = properties;
    if (content !== undefined) {
      this._widgetStore.setContent(String(content));
    }
    if (properties.visible !== undefined) {
      this._widgetStore.setVisible(Boolean(visible));
    }
    this._renderApp();
  }

  onPropertiesUpdate(properties: any) {
    // 更新文字和visible状态
    this._renderApp();
  }

  onUserPropertiesUpdate(userProperties: any) {
    this._renderApp();
  }

  onDestroy(): void {}

  private _renderApp() {
    if (!this._rendered && this._dom) {
      this._rendered = true;
      ReactDOM.render(<App widget={this} />, this._dom);
    }
  }

  locate() {
    return document.querySelector('.widget-slot-watermark') as HTMLElement;
  }

  render(dom: HTMLElement): void {
    this._dom = dom;
    const cls = classNames({
      'fcr-h-full': 1,
    });
    this._dom.className = cls;
    this._renderApp();
  }

  unload(): void {
    if (this._dom) {
      ReactDOM.unmountComponentAtNode(this._dom);
      this._dom = undefined;
    }
  }

  onUninstall(controller: AgoraWidgetController): void {}
}
