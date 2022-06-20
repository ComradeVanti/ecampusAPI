import { Find } from '../scraper';
import { Either } from '../monads/either';

export const scrapeLoginToken = Find.rootContext
  .next(Find.body)
  .next(Find.firstMatching('form'))
  .next(Find.firstMatching<HTMLInputElement>("input[name='logintoken']"))
  .scrapeFirst((input) => Either.ok(input.value));
