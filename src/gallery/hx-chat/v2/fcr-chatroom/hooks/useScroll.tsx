import { throttle } from 'lodash';
import { useCallback, useEffect, useRef } from 'react';
import { useStore } from './useStore';

export const useScroll = () => {
  const {
    fcrChatRoom,
    messageStore: {
      setMessageListDom,
      messageList,
      isBottom,
      messageListScrollToBottom,
      setIsBottom,
    },
  } = useStore();
  const messageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const messageContainer = messageContainerRef.current;
    if (messageContainer) {
      messageContainer.addEventListener('scroll', handleScroll);

      setMessageListDom(messageContainer);
    }
    return () => {
      if (messageContainerRef.current) {
        messageContainerRef.current.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);
  useEffect(() => {
    if (isBottom) {
      messageListScrollToBottom();
    }
  }, [isBottom, messageList.length, messageListScrollToBottom]);
  const handleScroll = useCallback(
    throttle(() => {
      if (messageContainerRef.current)
        if (
          messageContainerRef.current.scrollTop + messageContainerRef.current.clientHeight <=
          messageContainerRef.current.scrollHeight - 2
        ) {
          setIsBottom(false);
        } else {
          setIsBottom(true);
        }
    }, 200),
    [],
  );
  return {
    messageContainerRef,
  };
};
