import { Stream } from './Stream'
import { StreamSource } from './StreamSource'

export interface Operator<T, U> {
  (stream: Stream<T>): Stream<U>
}

export interface InitiateStreamFunction<T> {
  (source: StreamSource<T>): OnStreamDisposeFunction | void
}

export interface OnStreamDisposeFunction {
  (): void
}
