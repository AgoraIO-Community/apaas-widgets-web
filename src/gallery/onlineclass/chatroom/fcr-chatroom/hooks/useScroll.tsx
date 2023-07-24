import throttle from 'lodash/throttle';
import { useEffect, useRef } from 'react';
import { useStore } from './useStore';
import { List, ScrollParams } from 'react-virtualized';
export const useScroll = () => {
  const {
    roomStore: { chatDialogVisible },
    messageStore: {
      setMessageListRef,
      messageList,
      setIsBottom,

      reRenderMessageList,
    },
  } = useStore();
  const isBottomRef = useRef(true);
  const listRef = useRef<List>(null);

  useEffect(() => {
    if (listRef.current) {
      setMessageListRef(listRef.current);
    }
  }, []);
  useEffect(reRenderMessageList, [messageList.length]);
  useEffect(() => {
    chatDialogVisible && setTimeout(reRenderMessageList, 600);
  }, [chatDialogVisible]);
  const handleScroll = throttle((scrollParams: ScrollParams) => {
    const { scrollHeight, scrollTop, clientHeight } = scrollParams;
    const isBottom = clientHeight === 0 || Math.abs(scrollHeight - clientHeight - scrollTop) < 1;
    setIsBottom(isBottom);
    isBottomRef.current = isBottom;
  }, 200);
  return {
    listRef,
    handleScroll,
  };
};
