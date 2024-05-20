import { AgoraCountdown } from './gallery/classroom/counter';
import { AgoraHXChatWidget } from './gallery/classroom/hx-chat';
import { AgoraPolling } from './gallery/classroom/vote';
import { FcrWatermarkWidget } from './gallery/classroom/watermark';
import { FcrBoardWidget } from './gallery/classroom/whiteboard';
import { FcrStreamMediaPlayerWidget } from './gallery/classroom/stream-media';
import { FcrWebviewWidget } from './gallery/classroom/webview';
import tailwindConfig from '../tailwind.config';
import { setTailwindConfig } from '@ui-kit-utils/tailwindcss';
import './thirdparty-preset';
setTailwindConfig(tailwindConfig);

export { AgoraCountdown, AgoraHXChatWidget, AgoraPolling, FcrWatermarkWidget, FcrBoardWidget, FcrStreamMediaPlayerWidget, FcrWebviewWidget };
