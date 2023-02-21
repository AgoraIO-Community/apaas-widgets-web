import { observer } from 'mobx-react';
import { useRef, useState } from 'react';
import { OrientationEnum } from '@classroom/infra/stores/common/type';
import { useStore } from '../../hooks/useStore';
import { FcrChatRoomH5Inputs } from './components/input';
import { MessageList } from './components/message-list';
import { RoomInfoContainer } from './components/room-info';
import { UserJoined } from './components/user-joined';
import './index.css';

export const FcrChatRoomH5 = observer(() => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);

  const {
    roomStore: { orientation, forceLandscape },
  } = useStore();
  return orientation === OrientationEnum.landscape || forceLandscape ? (
    <RoomInfoContainer ref={containerRef} landscape>
      <>
        <UserJoined></UserJoined>
        <MessageList></MessageList>
        <div
          className={`fcr-chatroom-mobile-landscape-input-container ${
            showEmoji ? 'fcr-chatroom-mobile-landscape-input-container-emoji-open' : ''
          }`}>
          <FcrChatRoomH5Inputs
            emojiContainer={containerRef.current?.parentNode as HTMLDivElement}
            showEmoji={showEmoji}
            onShowEmojiChanged={setShowEmoji}></FcrChatRoomH5Inputs>
        </div>
      </>
    </RoomInfoContainer>
  ) : (
    <RoomInfoContainer
      ref={containerRef}
      classNames={showEmoji ? 'fcr-chatroom-mobile-room-info-emoji-open' : ''}>
      <>
        <div className="fcr-chatroom-mobile-container">
          <UserJoined></UserJoined>
          <div className="fcr-chatroom-mobile-mask"></div>
          <MessageList></MessageList>
        </div>
        <FcrChatRoomH5Inputs
          emojiContainer={containerRef.current?.parentNode as HTMLDivElement}
          showEmoji={showEmoji}
          onShowEmojiChanged={setShowEmoji}></FcrChatRoomH5Inputs>
      </>
    </RoomInfoContainer>
  );
});
