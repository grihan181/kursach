import axios from 'axios';
import axiosRetry from 'axios-retry';
import { AppConfig } from './config.js';

export function createHttpClient(config: AppConfig) {
  const client = axios.create({
    timeout: config.httpTimeoutMs
  });

  axiosRetry(client, {
    retries: config.httpRetryCount,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) =>
      axiosRetry.isNetworkOrIdempotentRequestError(error) || error.code === 'ECONNABORTED'
  });

  return client;
}
