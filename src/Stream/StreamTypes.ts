import { IDisposable } from './IDisposable'
import { Stream } from './Stream'
import { StreamSource } from './StreamSource'

export interface Operator<T, U> {
  (stream: Stream<T>): Stream<U>
}

export interface InitiateStreamFunction<T> {
  (source: StreamSource<T>): OnStreamDisposeFunction | IDisposable | void
}

export interface OnStreamDisposeFunction {
  (): void
}
