import { AgoraChat } from 'agora-chat';
import {
  AgoraIMImageMessage,
  AgoraIMMessageExt,
  AgoraIMMessageType,
  AgoraIMTextMessage,
  AgoraIMCustomMessage,
  AgoraIMCmdActionEnum,
} from './typs';

export const retryHandler = async (
  fn: () => Promise<unknown>,
  count = -1,
  maxRetryTimes = -1,
  retryDelay = 0,
): Promise<unknown> => {
  try {
    return await fn();
  } catch (e) {
    if (count < maxRetryTimes || count === -1 || maxRetryTimes === -1) {
      await new Promise((r) => {
        setTimeout(r, retryDelay);
      });
      return retryHandler(fn, count === -1 ? -1 : count + 1, maxRetryTimes);
    } else {
      return Promise.reject(-1);
    }
  }
};
export const convertHXHistoryMessage = (msg: AgoraChat.MessageBody) => {
  switch (msg.type) {
    case 'txt':
      return new AgoraIMTextMessage({
        id: msg.id,
        from: msg.from || '',
        to: msg.to,
        type: AgoraIMMessageType.Text,
        msg: msg.msg,
        ext: { ...msg.ext } as AgoraIMMessageExt,
      });
    case 'img':
      return new AgoraIMImageMessage({
        id: msg.id,
        from: msg.from || '',
        to: msg.to,
        type: AgoraIMMessageType.Image,

        file: msg.file?.data,
        url: msg.url,
        ext: { ...msg.ext } as AgoraIMMessageExt,
      });
    case 'cmd':
      return new AgoraIMCustomMessage({
        id: msg.id,
        from: msg.from || '',
        to: msg.to,
        type: AgoraIMMessageType.Custom,

        action: msg.action as AgoraIMCmdActionEnum,
        ext: { ...msg.ext } as AgoraIMMessageExt,
      });
    default:
      return new AgoraIMTextMessage({
        id: msg.id,
        from: msg.from || '',
        to: msg.to,
        type: AgoraIMMessageType.Text,
        msg: '',
      });
  }
};
export const convertHXMessage = (msg: AgoraChat.MessageBody) => {
  //@ts-ignore
  switch (msg.contentsType) {
    case 'TEXT':
      return new AgoraIMTextMessage({
        id: msg.id,
        from: msg.from || '',
        to: msg.to,
        type: AgoraIMMessageType.Text,
        //@ts-ignore
        msg: msg.data,
        //@ts-ignore
        ext: { ...msg.ext } as AgoraIMMessageExt,
        //@ts-ignore

        ts: parseInt(msg.time),
      });
    case 'IMAGE':
      return new AgoraIMImageMessage({
        id: msg.id,
        from: msg.from || '',
        to: msg.to,
        type: AgoraIMMessageType.Image,
        //@ts-ignore
        file: msg.file?.data,
        //@ts-ignore
        url: msg.url,
        //@ts-ignore
        ext: { ...msg.ext } as AgoraIMMessageExt,
        //@ts-ignore

        ts: parseInt(msg.time),
      });
    case 'COMMAND':
      return new AgoraIMCustomMessage({
        id: msg.id,
        from: msg.from || '',
        to: msg.to,
        type: AgoraIMMessageType.Custom,
        //@ts-ignore
        action: msg.action as AgoraIMCmdActionEnum,
        //@ts-ignore
        ext: { ...msg.ext } as AgoraIMMessageExt,
        //@ts-ignore

        ts: parseInt(msg.time),
      });
    default:
      return new AgoraIMTextMessage({
        id: msg.id,
        from: msg.from || '',
        to: msg.to,
        type: AgoraIMMessageType.Text,
        msg: '',
        //@ts-ignore

        ts: parseInt(msg.time),
      });
  }
};
