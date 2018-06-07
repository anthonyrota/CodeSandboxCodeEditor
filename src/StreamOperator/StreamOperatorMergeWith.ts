import { Stream } from '../Stream/Stream'
import { Operator } from '../Stream/StreamTypes'
import { merge } from '../StreamConstructor/StreamConstructorMerge'

export const mergeWith = <T>(
  ...streams: Stream<T>[]
): Operator<T, T> => stream => merge(...streams, stream)
