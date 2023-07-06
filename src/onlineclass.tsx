import { AgoraHXChatWidget as FcrChatroom } from './gallery/onlineclass/chatroom';
import { FcrPollingWidget } from './gallery/onlineclass/polling';
import { FcrBoardWidget as FcrBoardWidgetV2 } from './gallery/onlineclass/whiteboard-v2';
import { FcrWebviewWidget } from './gallery/onlineclass/webview';
import { FcrStreamMediaPlayerWidget } from './gallery/onlineclass/stream-media';

export {
  FcrChatroom,
  FcrBoardWidgetV2,
  FcrPollingWidget,
  FcrWebviewWidget,
  FcrStreamMediaPlayerWidget,
};
import tailwindConfig from '../tailwind.config';
import { setTailwindConfig } from '@ui-kit-utils/tailwindcss';
import '@ui-kit-utils/preflight.css';

setTailwindConfig(tailwindConfig);
