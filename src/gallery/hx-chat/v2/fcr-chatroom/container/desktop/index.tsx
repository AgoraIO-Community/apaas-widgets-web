import { useStore } from '../../hooks/useStore';
import { BaseDialog } from '@components/dialog';
import { observer } from 'mobx-react';
import { DialogToolTip } from '@components/tooltip/dialog';
import { Tabs } from '@components/tabs';

import './index.css';
import { useEffect, useRef, useState } from 'react';
import { FcrChatContainer } from './chat';
import { FcrChatMemberContainer } from './member';

import { Scheduler } from 'agora-rte-sdk';
import { AgoraIMTextMessage } from '../../../../../im/wrapper/typs';
import { generateShortUserName } from '../../utils/name';
export const FcrChatRoomDesktop = () => {
  return (
    <div className="fcr-chatroom-container">
      <FcrChatroomDialog></FcrChatroomDialog>
      <FcrChatroomTooltip></FcrChatroomTooltip>
    </div>
  );
};
const FcrChatroomDialog = observer(() => {
  const {
    userStore: { userList },
    roomStore: { chatDialogVisible, setChatDialogVisible },
  } = useStore();
  const [tab, setTab] = useState<'chat' | 'member'>('chat');
  return (
    <BaseDialog
      onClose={() => {
        setChatDialogVisible(false);
      }}
      maskClosable={false}
      wrapClassName="fcr-chatroom-dialog-wrap"
      width={387}
      mask={false}
      visible={chatDialogVisible}>
      <div className="fcr-chatroom-dialog-content">
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
    </BaseDialog>
  );
});

const FcrChatroomTooltip = observer(() => {
  const {
    roomStore: { chatDialogVisible },
    messageStore: { lastUnreadTextMessage },
  } = useStore();
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const tooltipVisibelTaskRef = useRef<Scheduler.Task | null>(null);
  const hideToolTip = () => {
    setTooltipVisible(false);
    tooltipVisibelTaskRef.current?.stop();
  };

  useEffect(() => {
    if (chatDialogVisible) {
      hideToolTip();
    } else {
      if (lastUnreadTextMessage) {
        tooltipVisibelTaskRef.current?.stop();
        setTooltipVisible(true);
        tooltipVisibelTaskRef.current = Scheduler.shared.addDelayTask(hideToolTip, 6000);
      }
    }
    return hideToolTip;
  }, [lastUnreadTextMessage, chatDialogVisible]);
  return (
    <DialogToolTip
      content={
        <FcrChatroomTooltipContent message={lastUnreadTextMessage}></FcrChatroomTooltipContent>
      }
      visible={tooltipVisible}
      onClose={hideToolTip}>
      <div></div>
    </DialogToolTip>
  );
});
const FcrChatroomTooltipContent = ({ message }: { message: AgoraIMTextMessage | null }) => {
  return (
    <div className="fcr-chatroom-tooltip-content">
      <div className="fcr-chatroom-avatar">
        {generateShortUserName(message?.ext?.nickName || '')}
      </div>
      <div className="fcr-chatroom-tooltip-content-text">
        <div className="fcr-chatroom-tooltip-content-from">From {message?.ext?.nickName}</div>
        <div className="fcr-chatroom-tooltip-content-from">{message?.msg}</div>
      </div>
    </div>
  );
};
