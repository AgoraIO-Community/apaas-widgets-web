import { AgoraSelector } from './gallery/classroom/answer';
import { AgoraHXChatWidget as FcrChatroom } from './gallery/onlineclass/chatroom';
import { AgoraCountdown } from './gallery/classroom/counter';
import { AgoraHXChatWidget } from './gallery/classroom/hx-chat';
import { FcrPollingWidget } from './gallery/onlineclass/polling';
import { FcrStreamMediaPlayerWidget } from './gallery/classroom/stream-media';
import { AgoraPolling } from './gallery/classroom/vote';
import { FcrWatermarkWidget } from './gallery/classroom/watermark';
import { FcrWebviewWidget } from './gallery/classroom/webview';
import { FcrBoardWidget } from './gallery/classroom/whiteboard';
import { FcrBoardWidget as FcrBoardWidgetV2 } from './gallery/onlineclass/whiteboard-v2';
import tailwindConfig from '../tailwind.config';
import '@ui-kit-utils/preflight.css';

import { setTailwindConfig } from '@ui-kit-utils/tailwindcss';
setTailwindConfig(tailwindConfig);
export {
  AgoraSelector,
  FcrChatroom,
  AgoraCountdown,
  AgoraHXChatWidget,
  FcrPollingWidget,
  FcrStreamMediaPlayerWidget,
  AgoraPolling,
  FcrWatermarkWidget,
  FcrWebviewWidget,
  FcrBoardWidget,
  FcrBoardWidgetV2,
};
