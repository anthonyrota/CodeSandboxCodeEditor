import { Stream } from '../Stream/Stream'

export const of = <T>(...values: T[]) =>
  new Stream<T>(source => values.forEach(value => source.next(value)))
