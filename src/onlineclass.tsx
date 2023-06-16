import { AgoraHXChatWidget as FcrChatroom } from './gallery/chatroom';
import { FcrPollingWidget } from './gallery/polling';
import { FcrBoardWidget as FcrBoardWidgetV2 } from './gallery/whiteboard-v2';
export { FcrChatroom, FcrBoardWidgetV2, FcrPollingWidget };
import tailwindConfig from '../tailwind.config';
import { setTailwindConfig } from '@ui-kit-utils/tailwindcss';
import '@ui-kit-utils/preflight.css';

setTailwindConfig(tailwindConfig);