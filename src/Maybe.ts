export abstract class Maybe<T> {
  abstract isEmpty(): boolean
  abstract hasValue(): boolean
  abstract or(maybe: Maybe<T>): Maybe<T>
  abstract orGet(getMaybe: () => Maybe<T>): Maybe<T>
  abstract orElse(value: T): Maybe<T>
  abstract orElseGet(getValue: () => T): Maybe<T>
  abstract getOrElse(value: T): T
  abstract getOrElseComputed(getValue: () => T): T
  abstract match<U>(outcomes: { some: (value: T) => U; none: () => U }): U
  abstract map<U>(transform: (value: T) => U): Maybe<U>
  abstract flatMap<U>(transform: (value: T) => Maybe<U>): Maybe<U>
  abstract filter(predicate: (value: T) => boolean): Maybe<T>
  abstract getOrThrow(): T
  abstract getOrThrowError(error: any): T
  abstract getOrThrowComputedError(getError: () => any): T

  static fromNullable<T>(valueOrNull: T | null | undefined): Maybe<T> {
    return valueOrNull == null ? new None<T>() : new Some<T>(valueOrNull)
  }

  static fromNonNullable<T>(valueOrNull: T | null | undefined): Maybe<T> {
    if (valueOrNull == null) {
      throw new TypeError('value is null')
    }
    return new Some<T>(valueOrNull)
  }

  static none<T>(): Maybe<T> {
    return new None<T>()
  }

  static some<T>(value: T): Maybe<T> {
    return new Some<T>(value)
  }
}

class Some<T> extends Maybe<T> {
  private __value: T

  constructor(value: T) {
    super()
    this.__value = value
  }

  isEmpty(): boolean {
    return false
  }

  hasValue(): boolean {
    return true
  }

  or(maybe: Maybe<T>): Maybe<T> {
    return this
  }

  orGet(getMaybe: () => Maybe<T>): Maybe<T> {
    return this
  }

  orElse(value: T): Maybe<T> {
    return this
  }

  orElseGet(getValue: () => T): Maybe<T> {
    return this
  }

  getOrElse(value: T): T {
    return this.__value
  }

  getOrElseComputed(getValue: () => T): T {
    return this.__value
  }

  match<U>(outcomes: { some: (value: T) => U; none: () => U }): U {
    return outcomes.some(this.__value)
  }

  map<U>(transform: (value: T) => U): Maybe<U> {
    return new Some(transform(this.__value))
  }

  flatMap<U>(transform: (value: T) => Maybe<U>): Maybe<U> {
    return transform(this.__value)
  }

  filter(predicate: (value: T) => boolean): Maybe<T> {
    return predicate(this.__value) ? this : new None<T>()
  }

  getOrThrow(): T {
    return this.__value
  }

  getOrThrowError(error: any): T {
    return this.__value
  }

  getOrThrowComputedError(getError: () => any): T {
    return this.__value
  }
}

class None<T> extends Maybe<T> {
  isEmpty(): boolean {
    return true
  }

  hasValue(): boolean {
    return false
  }

  or(maybe: Maybe<T>): Maybe<T> {
    return maybe
  }

  orGet(getMaybe: () => Maybe<T>): Maybe<T> {
    return getMaybe()
  }

  orElse(value: T): Maybe<T> {
    return new Some<T>(value)
  }

  orElseGet(getValue: () => T): Maybe<T> {
    return new Some<T>(getValue())
  }

  getOrElse(value: T): T {
    return value
  }

  getOrElseComputed(getValue: () => T): T {
    return getValue()
  }

  match<U>(outcomes: { some: (value: T) => U; none: () => U }): U {
    return outcomes.none()
  }

  map<U>(transform: (value: T) => U): Maybe<U> {
    return new None<U>()
  }

  flatMap<U>(transform: (value: T) => Maybe<U>): Maybe<U> {
    return new None<U>()
  }

  filter(predicate: (value: T) => boolean): Maybe<T> {
    return this
  }

  getOrThrow(): T {
    throw new TypeError('No value')
  }

  getOrThrowError(error: any): T {
    throw error
  }

  getOrThrowComputedError(getError: () => any): T {
    throw getError()
  }
}
