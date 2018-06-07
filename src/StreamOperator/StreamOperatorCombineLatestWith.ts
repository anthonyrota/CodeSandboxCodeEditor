import { Stream } from '../Stream/Stream'
import { Operator } from '../Stream/StreamTypes'
import { combineLatest } from '../StreamConstructor/StreamConstructorCombineLatest'

export function combineLatestWith<T, T1>(stream1: Stream<T1>): Operator<T, [T1]>
export function combineLatestWith<T, T1, T2>(
  stream1: Stream<T1>,
  stream2: Stream<T2>
): Operator<T, [T1, T2]>
export function combineLatestWith<T, T1, T2, T3>(
  stream1: Stream<T1>,
  stream2: Stream<T2>,
  stream3: Stream<T3>
): Operator<T, [T1, T2, T3]>
export function combineLatestWith<T, T1, T2, T3, T4>(
  stream1: Stream<T1>,
  stream2: Stream<T2>,
  stream3: Stream<T3>,
  stream4: Stream<T4>
): Operator<T, [T1, T2, T3, T4]>
export function combineLatestWith<T, T1, T2, T3, T4, T5>(
  stream1: Stream<T1>,
  stream2: Stream<T2>,
  stream3: Stream<T3>,
  stream4: Stream<T4>,
  stream5: Stream<T5>
): Operator<T, [T1, T2, T3, T4, T5]>
export function combineLatestWith<T, T1, T2, T3, T4, T5, T6>(
  stream1: Stream<T1>,
  stream2: Stream<T2>,
  stream3: Stream<T3>,
  stream4: Stream<T4>,
  stream5: Stream<T5>,
  stream6: Stream<T6>
): Operator<T, [T1, T2, T3, T4, T5, T6]>
export function combineLatestWith<T, T1, T2, T3, T4, T5, T6, T7>(
  stream1: Stream<T1>,
  stream2: Stream<T2>,
  stream3: Stream<T3>,
  stream4: Stream<T4>,
  stream5: Stream<T5>,
  stream6: Stream<T6>,
  stream7: Stream<T7>
): Operator<T, [T1, T2, T3, T4, T5, T6, T7]>
export function combineLatestWith<T, T1, T2, T3, T4, T5, T6, T7, T8>(
  stream1: Stream<T1>,
  stream2: Stream<T2>,
  stream3: Stream<T3>,
  stream4: Stream<T4>,
  stream5: Stream<T5>,
  stream6: Stream<T6>,
  stream7: Stream<T7>,
  stream8: Stream<T8>
): Operator<T, [T1, T2, T3, T4, T5, T6, T7, T8]>
export function combineLatestWith<T, T1, T2, T3, T4, T5, T6, T7, T8, T9>(
  stream1: Stream<T1>,
  stream2: Stream<T2>,
  stream3: Stream<T3>,
  stream4: Stream<T4>,
  stream5: Stream<T5>,
  stream6: Stream<T6>,
  stream7: Stream<T7>,
  stream8: Stream<T8>,
  stream9: Stream<T9>
): Operator<T, [T1, T2, T3, T4, T5, T6, T7, T8, T9]>
export function combineLatestWith<T, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
  stream1: Stream<T1>,
  stream2: Stream<T2>,
  stream3: Stream<T3>,
  stream4: Stream<T4>,
  stream5: Stream<T5>,
  stream6: Stream<T6>,
  stream7: Stream<T7>,
  stream8: Stream<T8>,
  stream9: Stream<T9>,
  stream10: Stream<T10>
): Operator<T, [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>
export function combineLatestWith<T>(...streams: Stream<T>[]): Operator<T, T>
export function combineLatestWith(
  ...streams: Stream<any>[]
): Operator<any, any> {
  return stream => combineLatest(stream, ...streams)
}
