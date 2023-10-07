import { useStore } from '../../hooks/useStore';
import { observer } from 'mobx-react';
import { Tabs } from '@components/tabs';
import { ToastApiFactory } from '@components/toast';
import './index.css';
import { createContext, useEffect, useRef, useState } from 'react';
import { FcrChatContainer } from './chat';
import { FcrChatMemberContainer } from './member';
import { useI18n } from 'agora-common-libs';

import { SvgIconEnum, SvgImg } from '@components/svg-img';
export const FcrChatRoomDesktop = () => {
  return (
    <div className="fcr-chatroom-container">
      <FcrChatroomDialog></FcrChatroomDialog>
    </div>
  );
};
export const FcrChatroomToastContext = createContext<ToastApiFactory | null>(null);
const FcrChatroomDialog = observer(() => {
  const {
    widget,
    userStore: { userList },
    roomStore: { chatDialogVisible, setChatDialogVisible },
    messageStore: { currentChatTab, setTab },
  } = useStore();
  const dialogContentRef = useRef<HTMLDivElement | null>(null);
  const [toastInstance, setToastInstance] = useState<ToastApiFactory | null>(null);
  useEffect(() => {
    if (chatDialogVisible) {
      if (dialogContentRef.current) {
        setToastInstance(
          new ToastApiFactory({
            toastPlacement: 'bottom',
            renderContainer: dialogContentRef.current,
          }),
        );
      }
    } else {
      setToastInstance(null);
    }
  }, [chatDialogVisible]);

  const transI18n = useI18n();
  return (
    <FcrChatroomToastContext.Provider value={toastInstance}>
      <div className="fcr-chatroom-dialog-wrapper">
        <div
          ref={dialogContentRef}
          style={{ width: widget.defaultRect.width, height: widget.defaultRect.height }}
          className="fcr-chatroom-dialog-content">
          <div className="fcr-chatroom-dialog-title">
            <div
              className="fcr-chatroom-dialog-title-close"
              onClick={() => setChatDialogVisible(false)}>
              <SvgImg type={SvgIconEnum.FCR_CLOSE} size={16}></SvgImg>
            </div>
            <Tabs
              onChange={(key) => setTab(key as 'chat' | 'member')}
              activeKey={currentChatTab}
              items={[
                {
                  label: transI18n('fcr_chat_option_chat'),
                  key: 'chat',
                },
                {
                  label: transI18n('fcr_chat_option_member', { reason1: `${userList.length}` }),
                  key: 'member',
                },
              ]}></Tabs>
          </div>
          <div className="fcr-chatroom-dialog-tab-inner">
            {currentChatTab === 'chat' && <FcrChatContainer></FcrChatContainer>}
            {currentChatTab === 'member' && <FcrChatMemberContainer></FcrChatMemberContainer>}
          </div>
        </div>
      </div>
    </FcrChatroomToastContext.Provider>
  );
});
