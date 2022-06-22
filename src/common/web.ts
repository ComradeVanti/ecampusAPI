import { Operation } from './operation';
import axios, { AxiosResponse, AxiosRequestConfig, AxiosError } from 'axios';
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
  MAX_REDIRECT = 'Maximum redirects',
}

export type WebError =
  | { type: WebErrorType.GENERIC; reason: string }
  | { type: WebErrorType.MAX_REDIRECT };

const makeGenericError = (reason: string): WebError => ({
  type: WebErrorType.GENERIC,
  reason,
});

const maxRedirectError: WebError = { type: WebErrorType.MAX_REDIRECT };

const handleError = (error: AxiosError): WebError => {
  switch (error.code) {
    case AxiosError.ERR_FR_TOO_MANY_REDIRECTS:
      return maxRedirectError;
    default:
      return makeGenericError(error.message);
  }
};

export const makeDoc = (html: Html): Document =>
  new JSDOM(html).window.document;

export const extendConfig =
  <TReq>(other: AxiosRequestConfig<TReq>): ConfigMod<TReq> =>
  (config) => ({
    ...config,
    ...other,
  });

export const addHeader =
  <TReq>(name: string, value: string): ConfigMod<TReq> =>
  (config) => {
    const copy = { ...config };
    copy.headers = copy.headers ?? {};
    copy.headers[name] = value;
    return copy;
  };

export const mergeMods =
  <TReq>(mods: ConfigMod<TReq>[]): ConfigMod<TReq> =>
  (config) => {
    let acc = config;
    mods.forEach((mod) => (acc = mod(acc)));
    return acc;
  };

const makeConfigWith = <TReq>(
  mods: ConfigMod<TReq>[]
): AxiosRequestConfig<TReq> => {
  let config: AxiosRequestConfig<TReq> = {};
  let merged = mergeMods(mods);
  return merged(config);
};

export const withSession = <TReq>(session: string) =>
  mergeMods([
    extendConfig<TReq>({
      withCredentials: true,
    }),
    addHeader('Cookie', `MoodleSession=${session}`),
  ]);

export const noRedirect = <TReq>() =>
  extendConfig<TReq>({
    maxRedirects: 0,
    validateStatus: (code) => code >= 200 && code <= 303,
  });

export const keepAlive = <TReq>() =>
  addHeader<TReq>('Connection', 'keep-alive');

export const withQueryParams = <TReq>(params: Record<string, any>) =>
  extendConfig<TReq>({
    params,
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
    handleError
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
    handleError
  );

export const getHtml = <TReq = any>(
  url: string,
  mods: ConfigMod<TReq>[] = []
) => get<Html, TReq>(url, mods).map<Html>((response) => response.data);

export const getDocument = <TReq = any>(
  url: string,
  mods: ConfigMod<TReq>[] = []
) => getHtml<TReq>(url, mods).map(makeDoc);

export const getRootElement = <TReq = any>(
  url: string,
  mods: ConfigMod<TReq>[] = []
) =>
  getDocument<TReq>(url, mods).map(
    (doc) => doc.documentElement as HTMLHtmlElement
  );

export const tryGetCookie = (response: AxiosResponse, cookie: string) => {
  const rawCookies = response.headers[cookie] ?? [];
  const cookies = setCookie.parse(rawCookies);
  return Maybe.fromNullable(cookies[0]?.value ?? null);
};
