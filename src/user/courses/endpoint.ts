import { RequestHandler } from 'express';
import { ReqDto } from './dto';
import { getRootElement, WebErrorType, withSession } from '../../common/web';
import {
  CoursesErrorType,
  invalidSessionError,
  makeNetworkError,
  makeScrapeError,
} from './errors';
import { scrapeSemesterList } from './scrapers';

const HomePageUrl = 'https://ecampus.fhstp.ac.at';

const tryGetHomePage = (session: string) =>
  getRootElement(HomePageUrl, [withSession(session)]).mapError((error) =>
    error.type === WebErrorType.MAX_REDIRECT
      ? invalidSessionError
      : makeNetworkError(error)
  );

const tryScrapeSemesterList = (rootElement: HTMLHtmlElement) =>
  scrapeSemesterList(rootElement).mapError(makeScrapeError);

const endpoint: RequestHandler = async (req, res) => {
  const reqDto: ReqDto = req.body;

  const semesterList = await tryGetHomePage(reqDto.session)
    .bind(tryScrapeSemesterList)
    .run();

  semesterList.iter(
    (semesterList) => res.send(semesterList),
    (error) => {
      console.log(`/user/courses: ${JSON.stringify(error)}`);
      switch (error.type) {
        case CoursesErrorType.NETWORK:
          return res.sendStatus(504);
        case CoursesErrorType.INVALID_SESSION:
          return res.sendStatus(401);
        default:
          return res.sendStatus(500);
      }
    }
  );
};

export default endpoint;
