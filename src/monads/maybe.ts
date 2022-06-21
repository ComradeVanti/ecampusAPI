import { Either } from './either';

export class Maybe<T> {
  private constructor(private readonly value: T | null) {}

  static some = <T>(value: NonNullable<T>) => new Maybe(value);

  static none = () => new Maybe<any>(null);

  static fromNullable = <T>(valueOrNull: T | null) => new Maybe(valueOrNull);

  match = <TMapped>(onSome: (value: T) => TMapped, onNone: () => TMapped) =>
    this.value !== null ? onSome(this.value) : onNone();

  toEitherWith = <TError>(onNone: () => TError): Either<T, TError> =>
    this.match(
      (value) => Either.ok(value),
      () => Either.error(onNone())
    );

  toEither = <TError>(onNone: TError) => this.toEitherWith(() => onNone);
}
