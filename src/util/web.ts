import { Operation } from '../monads/operation';
import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';

export const enum WebErrorType {
  GENERIC = 'GENERIC',
}

export type WebError = { type: WebErrorType.GENERIC; reason: any };

export const get = <TData, TConfig = any>(
  url: string,
  config?: AxiosRequestConfig<TConfig>
): Operation<AxiosResponse<TData, TConfig>, WebError> =>
  Operation.fromPromise<AxiosResponse<TData, TConfig>, WebError>(
    axios.get(url, config),
    (reason) => ({ type: WebErrorType.GENERIC, reason })
  );

