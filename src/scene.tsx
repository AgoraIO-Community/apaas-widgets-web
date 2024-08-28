import { FcrChatroomWidget as FcrChatroom } from './gallery/scene/chatroom';
import { FcrPollingWidget } from './gallery/scene/polling';
import { FcrRTTWidget } from './gallery/scene/rtt';
import {FcrRttboxWidget} from './gallery/scene/rttbox';
import { FcrBoardWidget } from './gallery/scene/whiteboard';
import { FcrWebviewWidget } from './gallery/scene/webview';
import { FcrStreamMediaPlayerWidget } from './gallery/scene/stream-media';
import { FcrCountdownWidget } from './gallery/scene/countdown';
import { FcrPopupQuizWidget } from './gallery/scene/quiz';
export {
  FcrChatroom,
  FcrBoardWidget,
  FcrPollingWidget,
  FcrRTTWidget,
  FcrRttboxWidget,
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
