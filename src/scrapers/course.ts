import { Course } from '../common/domain';
import { Find, makeScrapeError } from './scraper';
import { readAfter, tryParseInt } from './scrapeUtil';
import { Either } from '../common/either';

export type CourseScrapeData = Course;

const courseInfoRegex =
  /^[- ]*(?<name>.+) ((?<format>[A-Z]{2,3})|-).*\((?<lecturers>.*)\)/;

export const scrapeCourse = Find.context<HTMLDivElement>()
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
