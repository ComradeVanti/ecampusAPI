import { Operation } from './operation';
import axios, { AxiosResponse, AxiosRequestConfig} from 'axios';
import setCookie from 'set-cookie-parser';
import { Maybe } from './maybe';
import { Html } from './domain';
import { JSDOM } from 'jsdom';
import FormData from 'form-data';

export type ConfigMod<T> = (
  config: AxiosRequestConfig<T>
) => AxiosRequestConfig<T>;

export const enum WebErrorType {
  GENERIC = 'GENERIC',
}

export type WebError = { type: WebErrorType.GENERIC; reason: any };

export const makeDoc = (html: Html): Document =>
  new JSDOM(html).window.document;

const makeConfigWith = <TReq>(
  mods: ConfigMod<TReq>[]
): AxiosRequestConfig<TReq> => {
  let config: AxiosRequestConfig<TReq> = {};
  mods.forEach((mod) => (config = mod(config)));
  return config;
};

export const withSession =
  <TReq>(session: string): ConfigMod<TReq> =>
  (config) => ({
    ...config,
    headers: {
      Cookie: `MoodleSession=${session}`,
    },
    withCredentials: true,
  });

export const noRedirect =
  <TReq>(): ConfigMod<TReq> =>
  (config) => ({
    ...config,
    maxRedirects: 0,
    validateStatus: (code) => code >= 200 && code <= 303,
  });

export const tryGetRedirectUrl = (response: AxiosResponse): Maybe<string> =>
  Maybe.fromNullable(response.headers['location'] ?? null);

export const post = <TRes, TReq>(
  url: string,
  data?: TReq,
  mods: ConfigMod<TReq>[] = []
): Operation<AxiosResponse<TRes, TReq>, WebError> =>
  Operation.fromPromise<AxiosResponse<TRes, TReq>, WebError>(
    axios.post(url, data, makeConfigWith(mods)),
    (reason) => ({ type: WebErrorType.GENERIC, reason })
  );

export const postForm = <TRes>(
  url: string,
  form: FormData,
  mods: ConfigMod<FormData>[] = []
) => post<TRes, FormData>(url, form, mods);

export const get = <TRes, TReq = any>(
  url: string,
  mods: ConfigMod<TReq>[] = []
): Operation<AxiosResponse<TRes, TReq>, WebError> =>
  Operation.fromPromise<AxiosResponse<TRes, TReq>, WebError>(
    axios.get(url, makeConfigWith(mods)),
    (reason) => ({ type: WebErrorType.GENERIC, reason })
  );

export const getHtml = <TReq = any>(
  url: string,
  mods: ConfigMod<TReq>[] = []
) => get<Html, TReq>(url, mods).map<Html>((response) => response.data);

export const getDocument = <TReq = any>(
  url: string,
  mods: ConfigMod<TReq>[] = []
) => getHtml<TReq>(url, mods).map(makeDoc);

export const tryGetCookie = (response: AxiosResponse, cookie: string) => {
  const rawCookies = response.headers[cookie] ?? [];
  const cookies = setCookie.parse(rawCookies);
  return Maybe.fromNullable(cookies[0].value ?? null);
};
