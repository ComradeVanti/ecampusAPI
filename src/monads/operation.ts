import { Either } from './either';

export class Operation<TOk, TError> {
  static fromPromise<TOk, TError>(
    promise: Promise<TOk>,
    reasonToError: (reason: any) => TError
  ) {
    return new Operation<TOk, TError>(
      promise
        .then((result) => Either.ok(result))
        .catch((reason) => {
          const error = reasonToError(reason);
          return Either.error(error);
        })
    );
  }

  static fromEither<TOk, TError>(either: Either<TOk, TError>) {
    return new Operation<any, TError>(Promise.resolve(either));
  }

  static fromValue<TOk>(value: TOk) {
    return this.fromEither(Either.ok(value));
  }

  static fromError<TError>(error: TError) {
    return this.fromEither(Either.error(error));
  }

  private constructor(private readonly promise: Promise<Either<TOk, TError>>) {}

  map = <TMapped>(mapF: (value: TOk) => TMapped) =>
    new Operation(this.promise.then((either) => either.map(mapF)));

  bind = <TMapped>(bindF: (value: TOk) => Either<TMapped, TError>) =>
    new Operation(this.promise.then((either) => either.bind(bindF)));

  bindAsync = <TMapped>(
    bindF: (value: TOk) => Operation<TMapped, TError>
  ): Operation<TMapped, TError> =>
    new Operation(
      this.promise.then(
        (either) =>
          either.match(bindF, (error) => Operation.fromError(error)).promise
      )
    );

  mapError = <TMapped>(mapF: (error: TError) => TMapped) =>
    new Operation(this.promise.then((either) => either.mapError(mapF)));
}
