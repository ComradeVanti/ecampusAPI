import express from 'express';
import { LoginReqDto } from './dto';
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
} from '../common/web';
import { scrapeLoginToken } from './scrapers';
import { ScrapeError } from '../scrapers/scraper';
import { Html } from '../common/domain';
import { Operation } from '../common/operation';

export const enum LoginErrorType {
  NETWORK = 'Network',
  SCRAPE = 'Scrape',
  NO_SESSION = 'No session',
  NO_REDIRECT = 'No redirect',
}

export type LoginError =
  | { type: LoginErrorType.NETWORK; error: WebError }
  | { type: LoginErrorType.SCRAPE; error: ScrapeError }
  | { type: LoginErrorType.NO_SESSION }
  | { type: LoginErrorType.NO_REDIRECT };

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

const router = express.Router();
const LoginPageUrl = 'https://ecampus.fhstp.ac.at/login/index.php';

const getRootElement = (doc: Document) =>
  doc.documentElement as HTMLHtmlElement;

const tryGetLoginPage = () =>
  get<Html>(LoginPageUrl).mapError(makeNetworkError);

const tryGetLoginToken = (pageRoot: HTMLHtmlElement) =>
  scrapeLoginToken(pageRoot).mapError(makeScrapeError);

const makeFormData = (username: string, password: string, token: string) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  formData.append('logintoken', token);
  return formData;
};

const postCredentials = (formData: FormData, session: string) =>
  postForm(LoginPageUrl, formData, [
    withSession(session),
    noRedirect(),
  ]).mapError(makeNetworkError);

router.get('/', async (req, res) => {
  const { username, password }: LoginReqDto = req.body;

  const pageResponse = tryGetLoginPage();
  const token = pageResponse
    .map((it) => it.data)
    .map(makeDoc)
    .map(getRootElement)
    .bind(tryGetLoginToken);
  const formData = token.map((token) =>
    makeFormData(username, password, token)
  );
  const session = pageResponse.bind((response) =>
    tryGetCookie(response, 'set-cookie').toEither(noSessionError)
  );

  const testSessionUrl = Operation.combineTwo(formData, session)
    .bindAsync(([formData, session]) => postCredentials(formData, session))
    .bind((res) => tryGetRedirectUrl(res).toEither(noRedirectError));

  const loginResponse = Operation.combineTwo(session, testSessionUrl).bindAsync(
    ([session, url]) =>
      get<Html>(url, [withSession(session), noRedirect()]).mapError(
        makeNetworkError
      )
  );

  await loginResponse.iter(
    (res) => console.log(tryGetRedirectUrl(res)),
    console.log
  );

  res.sendStatus(200);
});

export default router;
