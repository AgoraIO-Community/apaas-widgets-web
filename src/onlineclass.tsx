import { AgoraHXChatWidget as FcrChatroom } from './gallery/onlineclass/chatroom';
import { FcrPollingWidget } from './gallery/onlineclass/polling';
import { FcrBoardWidget as FcrBoardWidgetV2 } from './gallery/onlineclass/whiteboard-v2';
import { FcrWebviewWidget } from './gallery/onlineclass/webview';
import { FcrStreamMediaPlayerWidget } from './gallery/onlineclass/stream-media';
import { FcrCountdownWidget } from './gallery/onlineclass/countdown';
export {
  FcrChatroom,
  FcrBoardWidgetV2,
  FcrPollingWidget,
  FcrWebviewWidget,
  FcrStreamMediaPlayerWidget,
  FcrCountdownWidget,
};
import tailwindConfig from '../tailwind.config';
import { setTailwindConfig } from '@ui-kit-utils/tailwindcss';
import '@ui-kit-utils/preflight.css';
import './thirdparty-preset';
setTailwindConfig(tailwindConfig);
