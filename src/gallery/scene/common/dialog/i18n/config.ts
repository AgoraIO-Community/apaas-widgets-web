import { addResourceBundle } from 'agora-common-libs';

import en from './en';
import zh from './zh';

export const addResource = () => {
  addResourceBundle('zh', zh);
  addResourceBundle('en', en);
};
