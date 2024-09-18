import { observer } from 'mobx-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../../hooks/useStore';
import { FcrChatRoomH5Inputs } from './components/input';
// import { MessageList } from './components/message-list';
import { RoomInfoContainer } from './components/room-info';
import { UserJoined } from './components/user-joined';
import classNames from 'classnames';

import './index.css';
import { OrientationEnum } from '../../../type';

export const FcrChatRoomH5 = observer(() => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);

  const {
    roomStore: { orientation, forceLandscape,screenShareStream },
  } = useStore();
  const isLandscape = orientation === OrientationEnum.landscape || forceLandscape;
  return (
    <RoomInfoContainer
      ref={containerRef}
      landscape={isLandscape}
      classNames={classNames({
        'fcr-chatroom-mobile-room-info-emoji-open': !isLandscape && showEmoji,
      })}>
      <>
        {isLandscape ? (
          <>
            <UserJoined></UserJoined>
            {/* <MessageList></MessageList> */}
          </>
        ) : (
          <div className="fcr-chatroom-mobile-container">
            <UserJoined></UserJoined>
            <div className="fcr-chatroom-mobile-mask"></div>
            {/* <MessageList></MessageList> */}
          </div>
        )}
        <PollMobile />
        {isLandscape ? (
          createPortal(
            <div
              className={classNames(
                { 'fcr-chatroom-mobile-landscape-input-container': isLandscape },
                {
                  'fcr-chatroom-mobile-landscape-input-container-emoji-open':
                    isLandscape && showEmoji,
                },
              )}>
              <FcrChatRoomH5Inputs
                emojiContainer={ document.querySelector('.fcr-chatroom-mobile-landscape-input-container') as HTMLDivElement}
                showEmoji={showEmoji}
                screenShareStream={screenShareStream}
                onShowEmojiChanged={setShowEmoji}></FcrChatRoomH5Inputs>
              <PollMobile />
            </div>,
            document.querySelector('.landscape-bottom-tools')!,
          )
        ) : (
          <div
            className={classNames(
              { 'fcr-chatroom-mobile-landscape-input-container': isLandscape },
              {
                'fcr-chatroom-mobile-landscape-input-container-emoji-open':
                  isLandscape && showEmoji,
              },
              'fcr-chatroom-mobile-input-container'
            )}>
            <FcrChatRoomH5Inputs
              emojiContainer={containerRef.current?.parentNode as HTMLDivElement}
              showEmoji={showEmoji}
              screenShareStream={screenShareStream}
              onShowEmojiChanged={setShowEmoji}></FcrChatRoomH5Inputs>
          </div>
        )}
      </>
    </RoomInfoContainer>
  );
});

export const PollMobile = observer(() => {
  const {
    messageStore: { unreadMessageCount },
    roomStore: { isLandscape, messageVisible },
  } = useStore();
  const [width, setWidth] = useState('0');
  useEffect(() => {
    if (unreadMessageCount !== 0 && messageVisible) {
      setWidth('40%');
    } else {
      setWidth('0');
    }
  }, [unreadMessageCount, messageVisible, isLandscape]);
  return <div className={`${isLandscape ? '' : 'fcr-relative'}`} style={{ left: width }}></div>;
});
