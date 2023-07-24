import { Provider } from 'mobx-react';
import { useEffect, useMemo, useRef } from 'react';
import { AgoraHXChatWidget } from '..';
import { FcrChatRoomH5 } from './container/mobile';
import { FcrChatRoomStore } from './store';
import im_CN from '../locales/zh_CN';
import im_US from '../locales/en_US';
import { addResourceBundle } from 'agora-common-libs';

export const FcrChatRoomApp = ({ widget }: { widget: AgoraHXChatWidget }) => {
  const { platform } = widget.classroomConfig;
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
  return platform === 'H5' ? (
    <Provider store={storeRef.current}>
      <FcrChatRoomH5></FcrChatRoomH5>
    </Provider>
  ) : null;
};
