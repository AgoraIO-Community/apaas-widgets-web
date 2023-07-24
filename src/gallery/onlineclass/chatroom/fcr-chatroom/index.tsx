import { Provider } from 'mobx-react';
import { useEffect, useMemo, useRef } from 'react';
import { AgoraHXChatWidget } from '..';
import { FcrChatRoomStore } from './store';
import { FcrChatRoomDesktop } from './container/desktop';
import { addResource } from './i18n';

export const FcrChatRoomApp = ({ widget }: { widget: AgoraHXChatWidget }) => {
  const { imConfig } = widget;
  const appKey = useMemo(() => {
    return imConfig?.orgName + '#' + imConfig?.appName;
  }, [imConfig?.appName, imConfig?.orgName]);
  const storeRef = useRef<FcrChatRoomStore>(
    new FcrChatRoomStore(widget, appKey, imConfig?.chatRoomId || ''),
  );
  useEffect(() => {
    addResource();
    return () => {
      storeRef.current.destroy();
    };
  }, []);
  return (
    <Provider store={storeRef.current}>
      <FcrChatRoomDesktop></FcrChatRoomDesktop>
    </Provider>
  );
};
