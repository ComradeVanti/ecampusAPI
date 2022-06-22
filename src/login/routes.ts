import express from 'express';
import { LoginReqDto, LoginSuccessResDto } from './dto';
import FormData from 'form-data';
import {
  withSession,
  get,
  makeDoc,
  postForm,
  tryGetRedirectUrl,
  tryGetCookie,
  WebError,
  noRedirect,
  keepAlive,
} from '../common/web';
import { scrapeLoginToken } from './scrapers';
import { ScrapeError } from '../scrapers/scraper';
import { Html } from '../common/domain';
import { Operation } from '../common/operation';
import { Either } from '../common/either';
import { AxiosResponse } from 'axios';

export const enum LoginErrorType {
  NETWORK = 'Network',
  SCRAPE = 'Scrape',
  NO_SESSION = 'No session',
  NO_REDIRECT = 'No redirect',
  INVALID_CREDENTIALS = 'Invalid credentials',
}

export type LoginError =
  | { type: LoginErrorType.NETWORK; error: WebError }
  | { type: LoginErrorType.SCRAPE; error: ScrapeError }
  | { type: LoginErrorType.NO_SESSION }
  | { type: LoginErrorType.NO_REDIRECT }
  | { type: LoginErrorType.INVALID_CREDENTIALS };

const makeNetworkError = (error: WebError): LoginError => ({
  type: LoginErrorType.NETWORK,
  error,
});

const makeScrapeError = (error: ScrapeError): LoginError => ({
  type: LoginErrorType.SCRAPE,
  error,
});

const noSessionError: LoginError = { type: LoginErrorType.NO_SESSION };

const noRedirectError: LoginError = { type: LoginErrorType.NO_REDIRECT };

const invalidCredentialsError: LoginError = {
  type: LoginErrorType.INVALID_CREDENTIALS,
};

const router = express.Router();
const LoginPageUrl = 'https://ecampus.fhstp.ac.at/login/index.php';

const getRootElement = (doc: Document) =>
  doc.documentElement as HTMLHtmlElement;

const tryGetLoginPage = () =>
  get<Html>(LoginPageUrl, [keepAlive()]).mapError(makeNetworkError);

const tryGetLoginToken = (pageRoot: HTMLHtmlElement) =>
  scrapeLoginToken(pageRoot).mapError(makeScrapeError);

const tryGetSession = (res: AxiosResponse, errorIfNotFound: LoginError) =>
  tryGetCookie(res, 'set-cookie').toEither(errorIfNotFound);

const makeFormData = (username: string, password: string, token: string) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  formData.append('logintoken', token);
  return formData;
};

const postCredentials = (formData: FormData, session: string) =>
  postForm(LoginPageUrl, formData, [
    noRedirect(),
    keepAlive(),
    withSession(session),
  ]).mapError(makeNetworkError);

router.get('/', async (req, res) => {
  const { username, password }: LoginReqDto = req.body;

  const pageResponse = await tryGetLoginPage().run();
  const rootElement = pageResponse
    .map((it) => it.data)
    .map(makeDoc)
    .map(getRootElement);
  const token = await Operation.fromResult(rootElement)
    .bind(tryGetLoginToken)
    .run();
  const formData = token.map((token) =>
    makeFormData(username, password, token)
  );
  const preSession = pageResponse.bind((res) =>
    tryGetSession(res, noSessionError)
  );
  const loginResponse = await Operation.fromResult(
    Either.merge(formData, preSession)
  )
    .bindAsync(([formData, preSession]) =>
      postCredentials(formData, preSession)
    )
    .run();
  const redirectUrl = loginResponse.bind((res) =>
    tryGetRedirectUrl(res).toEither(noRedirectError)
  );

  const session = loginResponse.bind((res) =>
    tryGetSession(res, invalidCredentialsError)
  );

  const successDto = await Operation.fromResult(
    Either.merge(session, redirectUrl)
  )
    .bindAsync(([session, url]) =>
      get<Html>(url, [withSession(session), noRedirect(), keepAlive()])
        .mapError(makeNetworkError)
        .bind((res) =>
          res.status === 303
            ? Either.ok(session)
            : Either.error(noRedirectError)
        )
    )
    .map<LoginSuccessResDto>((session) => ({ session }))
    .run();

  successDto.iter(
    (dto) => res.send(dto),
    (error) => {
      console.log(`/login: ${JSON.stringify(error)}`);
      switch (error.type) {
        case LoginErrorType.INVALID_CREDENTIALS:
          return res.sendStatus(401);
        case LoginErrorType.NETWORK:
          return res.sendStatus(504);
        default:
          return res.sendStatus(500);
      }
    }
  );
});

export default router;
