import { Provider } from 'mobx-react';
import { useEffect } from 'react';
import { AgoraHXChatWidget } from '..';
import { FcrChatRoomDesktop } from './container/desktop';
import { addResource } from './i18n';

export const FcrChatRoomApp = ({ widget }: { widget: AgoraHXChatWidget }) => {
  useEffect(() => {
    addResource();
  }, []);
  return (
    <Provider store={widget.store}>
      <FcrChatRoomDesktop></FcrChatRoomDesktop>
    </Provider>
  );
};
