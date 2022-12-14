import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
dayjs.extend(duration);
export { AgoraCountdown } from './gallery/counter';
export { AgoraPolling } from './gallery/vote';
export { AgoraSelector } from './gallery/answer';
export { AgoraHXChatWidget } from './gallery/hx-chat';
export { FcrWebviewWidget } from './gallery/webview';
export { FcrBoardWidget } from './gallery/whiteboard';
export { FcrStreamMediaPlayerWidget } from './gallery/stream-media';
export { FcrWatermarkWidget } from './gallery/watermark';
