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
import {
  AgoraIMImageMessage,
  AgoraIMMessageType,
  AgoraIMTextMessage,
} from '../../../../../../common/im/wrapper/typs';
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
  return chatDialogVisible
    ? createPortal(
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
                {currentChatTab === 'chat' && <FcrChatContainer></FcrChatContainer>}
                {currentChatTab === 'member' && <FcrChatMemberContainer></FcrChatMemberContainer>}
              </div>
            </div>
          </div>
        </FcrChatroomToastContext.Provider>,
        document.querySelector('#fcr-chatroom-dialog-slot') as HTMLElement,
      )
    : null;
});

const FcrChatroomTooltip = observer(() => {
  const {
    roomStore: { chatDialogVisible, setChatDialogVisible },
    messageStore: { lastUnreadMessage, messageListScrollToBottom },
  } = useStore();
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const tooltipVisibelTaskRef = useRef<Scheduler.Task | null>(null);
  const hideToolTip = () => {
    setTooltipVisible(false);
    tooltipVisibelTaskRef.current?.stop();
  };
  useEffect(() => {
    if (!chatDialogVisible && lastUnreadMessage) {
      tooltipVisibelTaskRef.current?.stop();
      setTooltipVisible(true);
      tooltipVisibelTaskRef.current = Scheduler.shared.addDelayTask(hideToolTip, 6000);
    }
  }, [lastUnreadMessage]);
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
          message={lastUnreadMessage}></FcrChatroomTooltipContent>
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
  message: AgoraIMTextMessage | AgoraIMImageMessage | null;
  onClick: () => void;
}) => {
  const msg =
    message?.type === AgoraIMMessageType.Image
      ? '[Image Message]'
      : (message as AgoraIMTextMessage)?.msg;
  const isPrivateMessage = message?.ext?.receiverList && message?.ext?.receiverList.length > 0;
  return (
    <div className="fcr-chatroom-tooltip-content" onClick={onClick}>
      <Avatar size={32} textSize={10} nickName={message?.ext?.nickName || ''}></Avatar>

      <div className="fcr-chatroom-tooltip-content-text">
        <div className="fcr-chatroom-tooltip-content-from">
          <span>From {message?.ext?.nickName}</span>

          {isPrivateMessage && (
            <span className="fcr-chatroom-tooltip-content-from-private">&nbsp;(Private)</span>
          )}
        </div>
        <div className="fcr-chatroom-tooltip-content-from">
          <span>{msg}</span>
        </div>
      </div>
    </div>
  );
};
