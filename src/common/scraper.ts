import { Either } from './either';
import { collectArrays } from './arrayUtil';
import { mapValues } from './objectUtil';

export type ScrapeError = { msg: string; inner: ScrapeError | null };

export type Parse<T> = (s: string) => T | null;

export type SearchFunc<T extends HTMLElement, U extends HTMLElement> = (
  ctx: T
) => Either<U[], ScrapeError>;

export type ScrapeFunc<T extends HTMLElement, U> = (
  ctx: T
) => Either<U, ScrapeError>;

export const makeScrapeError = (
  msg: string,
  inner?: ScrapeError
): ScrapeError => ({
  msg,
  inner: inner ?? null,
});

export class Find<T extends HTMLElement, U extends HTMLElement> {
  private constructor(private readonly withFunc: SearchFunc<T, U>) {}

  static using = <T extends HTMLElement, U extends HTMLElement>(
    searchFunc: SearchFunc<T, U>
  ) => new Find(searchFunc);

  static context<T extends HTMLElement>(): Find<T, T> {
    return this.using((ctx) => Either.ok([ctx]));
  }

  static rootContext = Find.context<HTMLHtmlElement>();

  static firstMatching = <U extends HTMLElement>(selector: string) =>
    Find.using((ctx) => {
      const element = ctx.querySelector<U>(selector);
      return element !== null
        ? Either.ok([element])
        : Either.error(
            makeScrapeError(
              `Could not find any element with selector "${selector}".`
            )
          );
    });

  static allMatching = <U extends HTMLElement>(
    selector: string,
    canBeZero = false
  ) =>
    Find.using((ctx) => {
      const elements = Array.from(ctx.querySelectorAll(selector)) as U[];
      return elements.length > 0 || canBeZero
        ? Either.ok(elements)
        : Either.error(
            makeScrapeError(`Found no elements with selector "${selector}".`)
          );
    });

  static body: Find<HTMLHtmlElement, HTMLBodyElement> =
    Find.firstMatching<HTMLBodyElement>('body');

  searchIn = (ctx: T) => this.withFunc(ctx);

  childrenAs = <V extends HTMLElement>(): Find<T, V> =>
    Find.using<T, V>((ctx) =>
      this.searchIn(ctx).map((elements) =>
        elements.flatMap((it) => Array.from(it.children) as V[])
      )
    );

  next = <V extends HTMLElement>(find: Find<U, V>) =>
    Find.using<T, V>((ctx) =>
      this.searchIn(ctx).bind((elements) => {
        const elementsOrErrors = elements.map((e) => find.searchIn(e));
        return Either.collect(elementsOrErrors).map(collectArrays);
      })
    );

  scrapeFirst =
    <V>(scrape: ScrapeFunc<U, V>): ScrapeFunc<T, V> =>
    (ctx) =>
      this.searchIn(ctx).bind((elements) =>
        elements.length >= 1
          ? scrape(elements[0])
          : Either.error(makeScrapeError('No element to scrape'))
      );

  scrapeEach =
    <V>(scrape: ScrapeFunc<U, V>): ScrapeFunc<T, V[]> =>
    (ctx) =>
      this.searchIn(ctx).bind((elements) =>
        Either.collect(elements.map(scrape))
      );

  compoundScrapeFirst =
    <V extends Object>(
      scrapes: Record<keyof V, ScrapeFunc<U, any>>
    ): ScrapeFunc<T, V> =>
    (ctx) => {
      return this.searchIn(ctx).bind((elements) => {
        if (elements.length === 0)
          return Either.error(
            makeScrapeError('No elements to compound-scrape')
          );
        const element = elements[0];
        return Either.collectFromObject(
          mapValues(scrapes, (scrape) => scrape(element))
        );
      });
    };
}
