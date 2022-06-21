export class Either<TOk, TError> {
  private constructor(
    private readonly valueOrError: TOk | TError,
    private readonly isOk: boolean
  ) {}

  get value(): TOk {
    if (this.isOk) return this.valueOrError as TOk;
    else throw Error('Access R on error-either');
  }

  get error(): TError {
    if (!this.isOk) return this.valueOrError as TError;
    else throw Error('Access L on ok-either');
  }

  static ok = <TOk>(value: TOk) => new Either<TOk, any>(value, true);

  static error = <TError>(error: TError) =>
    new Either<any, TError>(error, false);

  static collect = <TOk, TError>(
    eithers: Either<TOk, TError>[]
  ): Either<TOk[], TError> =>
    eithers
      .map((either) => either.map(Array.of))
      .reduce((acc, either) =>
        acc.bind((accValue) => either.map((value) => accValue.concat(value)))
      );

  static collectFromObject = <TOk, TError>(
    obj: Record<string, Either<TOk, TError>>
  ): Either<Record<string, TOk>, TError> => {
    const entries = Object.entries(obj).map(([key, either]) =>
      either.map((value) => [key, value])
    );
    return Either.collect(entries).map(Object.fromEntries);
  };

  static fromNullable = <TOk, TError>(
    value: TOk | null,
    errorOnNull: TError
  ): Either<TOk, TError> =>
    value !== null ? Either.ok(value) : Either.error(errorOnNull);

  map = <TMapped>(mapF: (value: TOk) => TMapped): Either<TMapped, TError> =>
    this.isOk ? Either.ok(mapF(this.value)) : Either.error(this.error);

  bind = <TMapped>(
    bindF: (value: TOk) => Either<TMapped, TError>
  ): Either<TMapped, TError> =>
    this.isOk ? bindF(this.value) : Either.error(this.error);

  mapError = <TMapped>(
    mapF: (error: TError) => TMapped
  ): Either<TOk, TMapped> =>
    this.isOk ? Either.ok(this.value) : Either.error(mapF(this.error));

  match = <TMapped>(
    mapValue: (value: TOk) => TMapped,
    mapError: (error: TError) => TMapped
  ): TMapped => (this.isOk ? mapValue(this.value) : mapError(this.error));
}
