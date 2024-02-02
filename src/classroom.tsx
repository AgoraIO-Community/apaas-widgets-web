import { AgoraSelector } from './gallery/classroom/answer';
import { AgoraCountdown } from './gallery/classroom/counter';
import { AgoraHXChatWidget } from './gallery/classroom/hx-chat';
import { FcrStreamMediaPlayerWidget } from './gallery/classroom/stream-media';
import { AgoraPolling } from './gallery/classroom/vote';
import { FcrWatermarkWidget } from './gallery/classroom/watermark';
import { FcrWebviewWidget } from './gallery/classroom/webview';
import { FcrBoardWidget } from './gallery/classroom/whiteboard';
import tailwindConfig from '../tailwind.config';

import { setTailwindConfig } from '@ui-kit-utils/tailwindcss';
import './thirdparty-preset';
setTailwindConfig(tailwindConfig);

export {
  AgoraSelector,
  AgoraCountdown,
  AgoraHXChatWidget,
  FcrStreamMediaPlayerWidget,
  AgoraPolling,
  FcrWatermarkWidget,
  FcrWebviewWidget,
  FcrBoardWidget,
};
