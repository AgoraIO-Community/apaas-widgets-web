import { addResourceBundle } from 'agora-common-libs/lib/i18n';
import en from './en';
import zh from './zh';

export const addResource = () => {
  addResourceBundle('zh', zh);
  addResourceBundle('en', en);
};
