import { WebIM } from '../utils/WebIM';
export class LoginAPI {
  store = null;
  constructor(store) {
    this.store = store;
  }

  // token 登陆
  loginWithToken = async (appkey, userUuid) => {
    const { getAgoraChatToken } = this.store.getState().agoraTokenConfig;
    const token = await getAgoraChatToken();

    WebIM.conn.open({
      user: userUuid,
      accessToken: token,
      appKey: appkey,
    });
  };
}
