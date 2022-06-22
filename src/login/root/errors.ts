import { WebError } from '../../common/web';
import { ScrapeError } from '../../common/scraper';

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

export const makeNetworkError = (error: WebError): LoginError => ({
  type: LoginErrorType.NETWORK,
  error,
});

export const makeScrapeError = (error: ScrapeError): LoginError => ({
  type: LoginErrorType.SCRAPE,
  error,
});

export const noSessionError: LoginError = { type: LoginErrorType.NO_SESSION };

export const noRedirectError: LoginError = { type: LoginErrorType.NO_REDIRECT };

export const invalidCredentialsError: LoginError = {
  type: LoginErrorType.INVALID_CREDENTIALS,
};
