import {
  get,
  keepAlive,
  makeDoc,
  noRedirect,
  postForm,
  tryGetCookie,
  tryGetRedirectUrl,
  withSession,
} from '../../common/web';
import { Html } from '../../common/domain';
import {
  invalidCredentialsError,
  LoginError,
  LoginErrorType,
  makeNetworkError,
  makeScrapeError,
  noRedirectError,
  noSessionError,
} from './errors';
import { scrapeLoginToken } from './scrapers';
import { AxiosResponse } from 'axios';
import FormData from 'form-data';
import { ReqDto, SuccessResDto } from './dto';
import { Operation } from '../../common/operation';
import { Either } from '../../common/either';
import { RequestHandler } from 'express';

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

const endPoint: RequestHandler = async (req, res) => {
  const { username, password }: ReqDto = req.body;

  const pageResponse = await tryGetLoginPage().run();
  const formData = pageResponse
    .map((it) => it.data)
    .map(makeDoc)
    .map(getRootElement)
    .bind(tryGetLoginToken)
    .map((token) => makeFormData(username, password, token));
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
        .bind<SuccessResDto>((res) =>
          res.status === 303
            ? Either.ok({ session })
            : Either.error(noRedirectError)
        )
    )
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
};

export default endPoint;
