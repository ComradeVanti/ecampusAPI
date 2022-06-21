import { Operation } from './operation';
import axios, { AxiosResponse, AxiosRequestConfig} from 'axios';
import setCookie from 'set-cookie-parser';
import { Maybe } from './maybe';
import { Html } from './domain';
import { JSDOM } from 'jsdom';
import FormData from 'form-data';

export const enum WebErrorType {
  GENERIC = 'GENERIC',
}

export type WebError = { type: WebErrorType.GENERIC; reason: any };

export const makeDoc = (html: Html): Document =>
  new JSDOM(html).window.document;

export const withSession = <T>(session: string): AxiosRequestConfig<T> => ({
  headers: {
    Cookie: `MoodleSession=${session}`,
  },
  withCredentials: true,
  maxRedirects: 0,
  validateStatus: (code) => code >= 200 && code <= 303,
});

export const tryGetRedirectUrl = (response: AxiosResponse): Maybe<string> =>
  Maybe.fromNullable(response.request.res.responseUrl ?? null);

export const post = <TData, TPost = any>(
  url: string,
  data?: TPost,
  config?: AxiosRequestConfig<TPost>
): Operation<AxiosResponse<TData, TPost>, WebError> =>
  Operation.fromPromise<AxiosResponse<TData, TPost>, WebError>(
    axios.post(url, data, config),
    (reason) => ({ type: WebErrorType.GENERIC, reason })
  );

export const postForm = <TData>(
  url: string,
  form: FormData,
  config?: AxiosRequestConfig<FormData>
) => post<TData, FormData>(url, form, config);

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
) => getHtml(url, config).map(makeDoc);

export const tryGetCookie = (response: AxiosResponse, cookie: string) => {
  const rawCookies = response.headers[cookie] ?? [];
  const cookies = setCookie.parse(rawCookies);
  return Maybe.fromNullable(cookies[0].value ?? null);
};
