import { Provider } from 'mobx-react';
import { useEffect } from 'react';
import { FcrChatroomWidget } from '..';
import { FcrChatRoomDesktop } from './container/desktop';
import { addResource } from './i18n';

export const FcrChatRoomApp = ({ widget }: { widget: FcrChatroomWidget }) => {
  useEffect(() => {
    addResource();
  }, []);
  return (
    <Provider store={widget.store}>
      <FcrChatRoomDesktop></FcrChatRoomDesktop>
    </Provider>
  );
};
