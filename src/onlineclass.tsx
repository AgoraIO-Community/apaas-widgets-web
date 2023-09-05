import { FcrChatroomWidget as FcrChatroom } from './gallery/onlineclass/chatroom';
import { FcrPollingWidget } from './gallery/onlineclass/polling';
import { FcrBoardWidget } from './gallery/onlineclass/whiteboard';
import { FcrWebviewWidget } from './gallery/onlineclass/webview';
import { FcrStreamMediaPlayerWidget } from './gallery/onlineclass/stream-media';
import { FcrCountdownWidget } from './gallery/onlineclass/countdown';
import { FcrPopupQuizWidget } from './gallery/onlineclass/quiz';
export {
  FcrChatroom,
  FcrBoardWidget,
  FcrPollingWidget,
  FcrWebviewWidget,
  FcrStreamMediaPlayerWidget,
  FcrCountdownWidget,
  FcrPopupQuizWidget,
};
import tailwindConfig from '../tailwind.config';
import { setTailwindConfig } from '@ui-kit-utils/tailwindcss';
import '@ui-kit-utils/preflight.css';
import './thirdparty-preset';
setTailwindConfig(tailwindConfig);
