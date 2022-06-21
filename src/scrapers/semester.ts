import { Season, Semester } from '../common/domain';
import { CourseScrapeData, scrapeCourse } from './course';
import { Find, makeScrapeError, Parse } from './scraper';
import { tryParseInt } from './scrapeUtil';
import { Either } from '../common/either';

export type SemesterScrapeData = {
  semester: Semester;
  courses: CourseScrapeData[];
};

const semesterIdRegex = /(?<season>WS|SS)(?<year>\d{4})/;
const semesterElementSelector =
  '.block_navigation>.card-body>.card-text>ul>li>ul>li:nth-child(3)>ul>li:nth-child(n+3)';

const tryParseSeason: Parse<Season> = (s) => {
  if (s === Season.SUMMER) return Season.SUMMER;
  else if (s === Season.WINTER) return Season.WINTER;
  return null;
};

const tryParseSemester: Parse<Semester> = (s) => {
  const match = semesterIdRegex.exec(s);
  if (match === null) return null;

  const year = tryParseInt(match.groups!.year);
  const season = tryParseSeason(match.groups!.season);

  if (year === null || season === null) return null;

  return { year, season };
};

export const scrapeSemester =
  Find.context<HTMLOListElement>().compoundScrapeFirst<SemesterScrapeData>({
    semester: Find.firstMatching<HTMLSpanElement>('p span').scrapeFirst(
      (label) => {
        const semesterText = label.innerHTML;
        return Either.fromNullable(
          tryParseSemester(semesterText),
          makeScrapeError(`Could not parse semester from "${semesterText}"`)
        );
      }
    ),
    courses: Find.firstMatching('ul')
      .childrenAs<HTMLDivElement>()
      .scrapeEach(scrapeCourse),
  });

export const scrapeSemesterList = Find.rootContext
  .next(Find.allMatching<HTMLOListElement>(semesterElementSelector))
  .scrapeEach(scrapeSemester);
