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
      messageListScrollToBottom,
      setIsBottom,
      listCache,
      renderableMessageList,
    },
  } = useStore();
  const isBottomRef = useRef(false);
  const listRef = useRef<List>(null);
  const recomputedList = () => {
    listCache.clearAll();
    listRef.current?.recomputeRowHeights(renderableMessageList.length);
  };
  useEffect(() => {
    if (listRef.current) {
      setMessageListRef(listRef.current);
    }
  }, []);
  useEffect(() => {
    recomputedList();
    if (isBottomRef.current) {
      messageListScrollToBottom();
    }
  }, [messageList.length, messageListScrollToBottom]);
  const handleScroll = throttle((scrollParams: ScrollParams) => {
    const { scrollHeight, scrollTop, clientHeight } = scrollParams;
    if (scrollTop + clientHeight <= scrollHeight - 2) {
      setIsBottom(false);
      isBottomRef.current = false;
    } else {
      setIsBottom(true);
      isBottomRef.current = true;
    }
  }, 200);
  return {
    listRef,
    handleScroll,
  };
};
