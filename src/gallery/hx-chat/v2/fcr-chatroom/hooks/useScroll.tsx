import { throttle } from 'lodash';
import { useCallback, useEffect, useRef } from 'react';
import { useStore } from './useStore';
import { List, ScrollParams } from 'react-virtualized';
export const useScroll = () => {
  const {
    fcrChatRoom,
    messageStore: {
      setMessageListRef,
      messageList,
      isBottom,
      messageListScrollToBottom,
      setIsBottom,
    },
  } = useStore();
  const listRef = useRef<List>(null);
  useEffect(() => {
    if (listRef.current) {
      setMessageListRef(listRef.current);
    }
  }, []);
  useEffect(() => {
    listRef.current?.recomputeRowHeights(0);
  }, [messageList.length]);
  const handleScroll = throttle((scrollParams: ScrollParams) => {
    const { scrollHeight, scrollTop, clientHeight } = scrollParams;
    if (scrollTop + clientHeight <= scrollHeight - 2) {
      setIsBottom(false);
    } else {
      setIsBottom(true);
    }
  }, 200);
  return {
    listRef,
    handleScroll,
  };
};
