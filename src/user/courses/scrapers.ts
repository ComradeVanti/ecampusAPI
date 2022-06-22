import { Course, Season, Semester } from '../../common/domain';
import { Find, makeScrapeError, Parse } from '../../common/scraper';
import { readAfter, tryParseInt } from '../../common/scrapeUtil';
import { Either } from '../../common/either';

export type CourseScrapeData = Course;

export type SemesterScrapeData = {
  semester: Semester;
  courses: CourseScrapeData[];
};

const courseInfoRegex =
  /^[- ]*(?<name>.+) ((?<format>[A-Z]{2,3})|-).*\((?<lecturers>.*)\)/;
const semesterIdRegex = /(?<season>WS|SS)(?<year>\d{4})/;
const semesterElementSelector =
  '.block_navigation>.card-body>.card-text>ul>li>ul>li:nth-child(3)>ul>li:nth-child(n+3)';

const scrapeCourse = Find.context<HTMLDivElement>()
  .next(Find.firstMatching<HTMLAnchorElement>('a'))
  .compoundScrapeFirst<CourseScrapeData>({
    id: (link) => {
      const idString = readAfter(link.href, '=');
      return Either.fromNullable(
        tryParseInt(idString),
        makeScrapeError(`Could not parse course-id "${idString}".`)
      );
    },
    name: (link) => {
      const info = link.title;
      const match = courseInfoRegex.exec(info);
      return Either.fromNullable(
        match?.groups?.name ?? null,
        makeScrapeError(`Could not parse course-info from "${info}".`)
      );
    },
  });

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

const scrapeSemester =
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
