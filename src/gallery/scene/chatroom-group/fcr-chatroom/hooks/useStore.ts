import { MobXProviderContext } from 'mobx-react';
import { useContext } from 'react';
import { FcrChatRoomStore } from '../store';
export const useStore = () => {
  const context = useContext(MobXProviderContext);
  return context.store as FcrChatRoomStore;
};
