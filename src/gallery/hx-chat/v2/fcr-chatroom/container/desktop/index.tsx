import { useStore } from '../../hooks/useStore';
import { observer } from 'mobx-react';
import { DialogToolTip } from '@components/tooltip/dialog';
import { Tabs } from '@components/tabs';
import { Avatar } from '@components/avatar';
import { ToastApiFactory } from '@components/toast';
import './index.css';
import { createContext, useEffect, useRef, useState } from 'react';
import { FcrChatContainer } from './chat';
import { FcrChatMemberContainer } from './member';
import { createPortal } from 'react-dom';
import { Scheduler } from 'agora-rte-sdk';
import { AgoraIMTextMessage } from '../../../../../im/wrapper/typs';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
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
    widget,
    userStore: { userList },
    roomStore: { chatDialogVisible, setChatDialogVisible },
  } = useStore();
  const dialogContentRef = useRef<HTMLDivElement | null>(null);
  const [toastInstance, setToastInstance] = useState<ToastApiFactory | null>(null);
  const [tab, setTab] = useState<'chat' | 'member'>('chat');
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
      </div>
    </FcrChatroomToastContext.Provider>
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
  return createPortal(
    <DialogToolTip
      content={
        <FcrChatroomTooltipContent
          onClick={() => setChatDialogVisible(true)}
          message={lastUnreadTextMessage}></FcrChatroomTooltipContent>
      }
      visible={tooltipVisible}
      onClose={hideToolTip}>
      <div></div>
    </DialogToolTip>,
    document.querySelector('#fcr-chatroom-slot') as HTMLElement,
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
