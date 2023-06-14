import { Provider } from 'mobx-react';
import { useEffect, useMemo, useRef } from 'react';
import { AgoraHXChatWidget } from '..';
import { FcrChatRoomStore } from './store';
import im_CN from '../../hx-chat/locales/zh_CN';
import im_US from '../../hx-chat/locales/en_US';
import { addResourceBundle } from 'agora-common-libs';
import { FcrChatRoomDesktop } from './container/desktop';

export const FcrChatRoomApp = ({ widget }: { widget: AgoraHXChatWidget }) => {
  const { imConfig } = widget;
  const appKey = useMemo(() => {
    return imConfig?.orgName + '#' + imConfig?.appName;
  }, [imConfig?.appName, imConfig?.orgName]);
  const storeRef = useRef<FcrChatRoomStore>(
    new FcrChatRoomStore(widget, appKey, imConfig?.chatRoomId || ''),
  );
  useEffect(() => {
    addResourceBundle('zh', im_CN);
    addResourceBundle('en', im_US);
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
