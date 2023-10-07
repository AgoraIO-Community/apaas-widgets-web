import { FcrChatroomWidget as FcrChatroom } from './gallery/scene/chatroom';
import { FcrPollingWidget } from './gallery/scene/polling';
import { FcrBoardWidget } from './gallery/scene/whiteboard';
import { FcrWebviewWidget } from './gallery/scene/webview';
import { FcrStreamMediaPlayerWidget } from './gallery/scene/stream-media';
import { FcrCountdownWidget } from './gallery/scene/countdown';
import { FcrPopupQuizWidget } from './gallery/scene/quiz';
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
