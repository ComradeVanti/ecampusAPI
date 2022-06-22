import { Find } from '../../scrapers/scraper';
import { Either } from '../../common/either';

export const scrapeLoginToken = Find.rootContext
  .next(Find.body)
  .next(Find.firstMatching('form'))
  .next(Find.firstMatching<HTMLInputElement>("input[name='logintoken']"))
  .scrapeFirst((input) => Either.ok(input.value));
