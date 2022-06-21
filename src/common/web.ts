import { Operation } from './operation';
import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import setCookie from 'set-cookie-parser';
import { Maybe } from './maybe';
import { Html } from './domain';
import { JSDOM } from 'jsdom';

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

export const getHtml = <TConfig = any>(
  url: string,
  config?: AxiosRequestConfig<TConfig>
) => get<Html, TConfig>(url, config).map<Html>((response) => response.data);

export const getDocument = <TConfig = any>(
  url: string,
  config?: AxiosRequestConfig<TConfig>
) =>
  getHtml(url, config).map<Document>((html) => new JSDOM(html).window.document);

export const tryGetCookieFrom = (response: AxiosResponse, cookie: string) => {
  const rawCookies = response.headers[cookie] ?? [];
  const cookies = setCookie.parse(rawCookies);
  return Maybe.fromNullable(cookies[0].value ?? null);
};
