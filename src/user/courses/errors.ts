import { WebError } from '../../common/web';
import { ScrapeError } from '../../common/scraper';

export const enum CoursesErrorType {
  NETWORK = 'Network',
  SCRAPE = 'Scrape',
  INVALID_SESSION = 'Invalid session',
}

export type CoursesError =
  | { type: CoursesErrorType.NETWORK; error: WebError }
  | { type: CoursesErrorType.SCRAPE; error: ScrapeError }
  | { type: CoursesErrorType.INVALID_SESSION };

export const makeNetworkError = (error: WebError): CoursesError => ({
  type: CoursesErrorType.NETWORK,
  error,
});

export const makeScrapeError = (error: ScrapeError): CoursesError => ({
  type: CoursesErrorType.SCRAPE,
  error,
});

export const invalidSessionError: CoursesError = {
  type: CoursesErrorType.INVALID_SESSION,
};
