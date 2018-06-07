import { Operator } from '../Stream/StreamTypes'
import { of } from '../StreamConstructor/StreamConstructorOf'
import { merge } from '../StreamConstructor/StreamConstructorMerge'

export const startWith = <T>(...values: T[]): Operator<T, T> => stream =>
  merge(of(...values), stream)
