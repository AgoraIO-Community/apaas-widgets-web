import { addResourceBundle } from 'agora-common-libs';
import en from './en';
import zh from './zh';

export const addResource = async () => {
  await addResourceBundle('zh', zh);
  await addResourceBundle('en', en);
};
