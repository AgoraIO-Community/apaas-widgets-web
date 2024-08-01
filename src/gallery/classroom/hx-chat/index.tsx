import {
  chatEmojiEnabled,
  chatMuteAllEnabled,
  chatPictureEnabled,
  AgoraCloudClassWidget,
} from 'agora-common-libs';
import {
  HXChatRoom,
  dispatchVisibleUI,
  dispatchShowChat,
  dispatchShowMiniIcon,
  dispatchMemberCountChange,
} from './legacy';
import type { AgoraWidgetController, FetchUserParam } from 'agora-edu-core';
import classNames from 'classnames';
import { autorun, IReactionDisposer, reaction } from 'mobx';
import { observer } from 'mobx-react';
import { useCallback, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { WidgetChatUIStore } from './store';
import { FcrChatRoomApp } from './fcr-chatroom';
import createStore from './legacy/redux/store';

const App = observer(({ widget }: { widget: AgoraHXChatWidget }) => {
  const widgetStore = widget.widgetStore as WidgetChatUIStore;
  const [minimize, toggleChatMinimize] = useState<boolean>(false);
  const [searchKeyword, setSearchKeyword] = useState<string>();
  const isFullScreen = false; // todo from uistore

  const { appId, host, sessionInfo, platform } = widget.classroomConfig;

  const {
    visibleEmoji,
    visibleBtnSend,
    inputBoxStatus,
    visibleMuteAll,
    visibleScreenCapture,
    imgIcon,
  } = widget.imUIConfig;

  const { currentSubRoom } = widget.classroomStore.groupStore;

  const localUserInfo = {
    userUuid: widget.easemobUserId,
    userName: sessionInfo.userName,
    roleType: sessionInfo.role,
    token: sessionInfo.token,
  };

  const roomInfo = {
    roomUuid: sessionInfo.roomUuid,
    roomName: sessionInfo.roomName,
    roomType: sessionInfo.roomType,
  };

  const globalContext = {
    isFullScreen,
    showChat: widgetStore.showChat,
    isShowMiniIcon: !widgetStore.showChat,
    configUIVisible: {
      showInputBox: sessionInfo.role !== 0 && sessionInfo.role !== 4, // 输入UI
      memebers: sessionInfo.roomType !== 0, // 成员 tab
      announcement: !currentSubRoom && sessionInfo.roomType !== 0, //公告 tab
      allMute: visibleMuteAll && sessionInfo.roomType !== 0, // 全体禁言按钮
      showQuestionBox: sessionInfo.roomType === 2 && sessionInfo.role === 2, //大班课课的学生显示提问
      isFullSize: widgetStore.isFullSize,
      emoji: visibleEmoji,
      btnSend: visibleBtnSend,
      inputBox: inputBoxStatus,
      platform,
      screenshotIcon: visibleScreenCapture,
      imgIcon,
    },
  };

  useEffect(() => {
    if ((isFullScreen && !minimize) || (!isFullScreen && minimize)) {
      // 第一个条件 点击全屏默认聊天框最小化
      // 第二个条件，全屏幕最小化后，点击恢复（非全屏），恢复聊天框
      toggleChatMinimize((pre: boolean) => !pre);
    }
  }, [isFullScreen]);

  useEffect(() => {
    widgetStore.addOrientationchange();
    widgetStore.handleOrientationchange();

    const disposers: IReactionDisposer[] = [];

    disposers.push(
      autorun(() => {
        dispatchVisibleUI({ isFullSize: widgetStore.isFullSize });
      }),
    );

    disposers.push(
      reaction(
        () => widgetStore.showChat,
        (value) => {
          dispatchShowChat(value);
          dispatchShowMiniIcon(!value);
        },
      ),
    );
    disposers.push(
      reaction(
        () => widget.classroomStore.userStore.userCount,
        (value) => {
          dispatchMemberCountChange(value);
        },
      ),
    );
    return () => {
      widgetStore.removeOrientationchange();
      disposers.forEach((d) => d());
    };
  }, []);

  useEffect(() => {
    widget.setHide(widgetStore.showChat);
  }, [widgetStore.showChat]);

  const hxStore = {
    globalContext,
    context: { ...widget.imUIConfig, ...widget.imConfig, ...roomInfo, ...localUserInfo },
  };

  const getAgoraChatToken = useCallback(async () => {
    const { token } = await widget.classroomStore.api.getAgoraChatToken({
      roomUuid: sessionInfo.roomUuid,
      userUuid: sessionInfo.userUuid,
    });
    return token;
  }, []);

  return (
    <div id="hx-chatroom" style={{ display: 'flex', width: '100%', height: '100%' }}>
      <HXChatRoom
        theme={widget.theme}
        pluginStore={hxStore}
        agoraTokenData={{
          appId,
          host,
          roomUuid: sessionInfo.roomUuid,
          userUuid: sessionInfo.userUuid,
          token: sessionInfo.token,
          getAgoraChatToken,
        }}
        userList={widgetStore.userList}
        searchKeyword={searchKeyword}
        keyWordChangeHandle={(data: string) => {
          setSearchKeyword(data);
          widgetStore.onKeyWordChange(data);
        }}
        hasMoreUsers={widgetStore.hasMoreUsers}
        fetchNextUsersList={(data: Partial<FetchUserParam> | undefined, reset: boolean) =>
          widgetStore.fetchNextUsersList(data, reset)
        }
        startAutoFetch={() => {
          widget.enableAutoFetch(true);
        }}
        stopAutoFetch={() => {
          widget.enableAutoFetch(false);
        }}
        chatStore={widget.chatStore}
      />
    </div>
  );
});

export class AgoraHXChatWidget extends AgoraCloudClassWidget {
  private _imConfig?: { chatRoomId: string; appName: string; orgName: string };
  private _easemobUserId?: string;
  private _dom?: HTMLElement;
  private _widgetStore = new WidgetChatUIStore(this);
  private _rendered = false;
  private _timer: NodeJS.Timeout | null = null; //定时器请求数据

  chatStore = createStore();

  get widgetName(): string {
    return 'easemobIM';
  }
  get hasPrivilege() {
    return false;
  }

  get imUIConfig() {
    let visibleBtnSend = true;
    let visibleEmoji = true;
    let inputBoxStatus = undefined;
    let visibleMuteAll = true;
    let visibleScreenCapture = true;
    let imgIcon = true;

    if (!chatEmojiEnabled(this.uiConfig)) {
      visibleEmoji = false;
    }
    if (!chatMuteAllEnabled(this.uiConfig)) {
      visibleMuteAll = false;
    }
    if (!chatPictureEnabled(this.uiConfig)) {
      visibleScreenCapture = false;
      imgIcon = false;
    }

    if (this.classroomConfig.platform === 'H5') {
      visibleBtnSend = false;
      visibleEmoji = false;
      inputBoxStatus = 'inline';
    }

    return {
      visibleEmoji,
      visibleBtnSend,
      inputBoxStatus,
      visibleMuteAll,
      visibleScreenCapture,
      imgIcon,
    };
  }

  get imConfig() {
    return this._imConfig;
  }

  get easemobUserId() {
    return this._easemobUserId;
  }

  get widgetStore() {
    return this._widgetStore;
  }

  onCreate(properties: any, userProperties: any) {
    this._easemobUserId = userProperties?.userId;
    this._imConfig = properties?.extra;
    this._renderApp();
  }

  onPropertiesUpdate(properties: any) {
    this._imConfig = properties.extra;
    this._renderApp();
  }

  onUserPropertiesUpdate(userProperties: any) {
    this._easemobUserId = userProperties.userId;
    this._renderApp();
  }

  onDestroy(): void {
    this.enableAutoFetch(false);
  }

  private _renderApp() {
    const { platform } = this.classroomConfig;
    if (!this._rendered && this.imConfig && this.easemobUserId && this._dom) {
      if (platform === 'H5') {
        ReactDOM.render(<FcrChatRoomApp widget={this} />, this._dom);
      } else {
        ReactDOM.render(<App widget={this} />, this._dom);
      }

      this._rendered = true;
    }
  }

  locate() {
    const { platform } = this.classroomConfig;
    if (platform === 'H5') {
      return document.querySelector('.widget-slot-chat-mobile') as HTMLElement;
    }
    return document.querySelector('.widget-slot-chat') as HTMLElement;
  }

  render(dom: HTMLElement): void {
    const { platform } = this.classroomConfig;

    this._dom = dom;

    const cls = classNames({ 'chat-panel': platform !== 'H5' }, 'fcr-h-full');

    this._dom.className = cls;

    this._renderApp();
  }

  setHide(hide: boolean) {
    const dom = this._dom;
    if (dom) {
      if (hide) {
        dom.classList.add('fcr-min-w-0');
      } else {
        dom.classList.remove('fcr-min-w-0');
      }
    }
  }

  unload(): void {
    if (this._dom) {
      ReactDOM.unmountComponentAtNode(this._dom);
      this._dom = undefined;
    }
  }

  enableAutoFetch(enabled: boolean) {
    // if the local user is teacher
    if (this.classroomConfig.sessionInfo.role === 1) {
      if (enabled) {
        console.log('enableAutoFetch: true');
        //清除定时器
        if (this._timer) {
          clearInterval(this._timer);
          this._timer = null;
        }
        this._timer = setInterval(() => {
          //每10s刷新一次列表
          this.widgetStore.fetchNextUsersList({}, true);
        }, 10000);
      } else {
        console.log('enableAutoFetch: false');
        //清除定时器
        if (this._timer) {
          clearInterval(this._timer);
          this._timer = null;
        }
      }
    }
  }

  onInstall(controller: AgoraWidgetController): void {}

  onUninstall(controller: AgoraWidgetController): void {}
}
