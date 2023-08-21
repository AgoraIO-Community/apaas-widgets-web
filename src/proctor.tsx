import { FcrWebviewWidget } from './gallery/proctor/webview';
export { FcrWebviewWidget };
import '@ui-kit-utils/preflight.css';
import tailwindConfig from '../tailwind.config';
import { setTailwindConfig } from '@ui-kit-utils/tailwindcss';
import './thirdparty-preset';
setTailwindConfig(tailwindConfig);
