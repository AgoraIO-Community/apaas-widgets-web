import { useStore } from '../../hooks/useStore';
import { BaseDialog } from '@components/dialog';
import { observer } from 'mobx-react';
import { DialogToolTip } from '@components/tooltip/dialog';
import { Tabs } from '@components/tabs';
import { Avatar } from '@components/avatar';
import { ToastApiFactory } from '@components/toast';
import './index.css';
import { createContext, useEffect, useReducer, useRef, useState } from 'react';
import { FcrChatContainer } from './chat';
import { FcrChatMemberContainer } from './member';

import { Scheduler } from 'agora-rte-sdk';
import { AgoraIMTextMessage } from '../../../../../im/wrapper/typs';
export const FcrChatRoomDesktop = () => {
  return (
    <div className="fcr-chatroom-container">
      <FcrChatroomDialog></FcrChatroomDialog>
      <FcrChatroomTooltip></FcrChatroomTooltip>
    </div>
  );
};
export const FcrChatroomToastContext = createContext<ToastApiFactory | null>(null);
const FcrChatroomDialog = observer(() => {
  const {
    userStore: { userList },
    roomStore: { chatDialogVisible, setChatDialogVisible },
  } = useStore();
  const dialogContentRef = useRef<HTMLDivElement | null>(null);
  const toastRef = useRef<ToastApiFactory | null>(null);

  const [tab, setTab] = useState<'chat' | 'member'>('chat');
  useEffect(() => {
    if (dialogContentRef.current) {
      toastRef.current = new ToastApiFactory({
        toastPlacement: 'bottom',
        renderContainer: dialogContentRef.current,
      });
    }
  }, []);
  return (
    <BaseDialog
      onClose={() => {
        setChatDialogVisible(false);
      }}
      maskClosable={false}
      wrapClassName="fcr-chatroom-dialog-wrap"
      width={330}
      mask={false}
      visible={chatDialogVisible}>
      <FcrChatroomToastContext.Provider value={toastRef.current}>
        <div ref={dialogContentRef} className="fcr-chatroom-dialog-content">
          <div className="fcr-chatroom-dialog-title">
            <Tabs
              onChange={(key) => setTab(key as 'chat' | 'member')}
              activeKey={tab}
              items={[
                {
                  label: 'Chat',
                  key: 'chat',
                },
                {
                  label: `Member (${userList.length})`,
                  key: 'member',
                },
              ]}></Tabs>
          </div>
          <div className="fcr-chatroom-dialog-tab-inner">
            {tab === 'chat' && <FcrChatContainer></FcrChatContainer>}
            {tab === 'member' && <FcrChatMemberContainer></FcrChatMemberContainer>}
          </div>
        </div>
      </FcrChatroomToastContext.Provider>
    </BaseDialog>
  );
});

const FcrChatroomTooltip = observer(() => {
  const {
    roomStore: { chatDialogVisible, setChatDialogVisible },
    messageStore: { lastUnreadTextMessage, messageListScrollToBottom },
  } = useStore();
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const tooltipVisibelTaskRef = useRef<Scheduler.Task | null>(null);
  const hideToolTip = () => {
    setTooltipVisible(false);
    tooltipVisibelTaskRef.current?.stop();
  };
  useEffect(() => {
    if (!chatDialogVisible && lastUnreadTextMessage) {
      tooltipVisibelTaskRef.current?.stop();
      setTooltipVisible(true);
      tooltipVisibelTaskRef.current = Scheduler.shared.addDelayTask(hideToolTip, 6000);
    }
  }, [lastUnreadTextMessage]);
  useEffect(() => {
    if (chatDialogVisible) {
      hideToolTip();
      messageListScrollToBottom();
    }
    return hideToolTip;
  }, [chatDialogVisible]);
  return (
    <DialogToolTip
      content={
        <FcrChatroomTooltipContent
          onClick={() => setChatDialogVisible(true)}
          message={lastUnreadTextMessage}></FcrChatroomTooltipContent>
      }
      visible={tooltipVisible}
      onClose={hideToolTip}>
      <div></div>
    </DialogToolTip>
  );
});
const FcrChatroomTooltipContent = ({
  message,
  onClick,
}: {
  message: AgoraIMTextMessage | null;
  onClick: () => void;
}) => {
  return (
    <div className="fcr-chatroom-tooltip-content" onClick={onClick}>
      <Avatar size={32} textSize={10} nickName={message?.ext?.nickName || ''}></Avatar>

      <div className="fcr-chatroom-tooltip-content-text">
        <div className="fcr-chatroom-tooltip-content-from">From {message?.ext?.nickName}</div>
        <div className="fcr-chatroom-tooltip-content-from">{message?.msg}</div>
      </div>
    </div>
  );
};
