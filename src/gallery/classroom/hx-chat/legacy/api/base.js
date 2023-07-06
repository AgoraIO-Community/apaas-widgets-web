import axios from 'axios';

const httpClient = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setCredential = (uid, token) => {
  httpClient.defaults.headers['x-agora-uid'] = uid;
  httpClient.defaults.headers['x-agora-token'] = token;
  httpClient.defaults.headers['authorization'] = `agora token="${token}"`;
};

export default httpClient;
