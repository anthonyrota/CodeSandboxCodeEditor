import { Stream } from '../Stream/Stream'
import { CompositeDisposable } from '../Disposable/CompositeDisposable'

export function combineLatest<T1>(stream1: Stream<T1>): Stream<[T1]>
export function combineLatest<T1, T2>(
  stream1: Stream<T1>,
  stream2: Stream<T2>
): Stream<[T1, T2]>
export function combineLatest<T1, T2, T3>(
  stream1: Stream<T1>,
  stream2: Stream<T2>,
  stream3: Stream<T3>
): Stream<[T1, T2, T3]>
export function combineLatest<T1, T2, T3, T4>(
  stream1: Stream<T1>,
  stream2: Stream<T2>,
  stream3: Stream<T3>,
  stream4: Stream<T4>
): Stream<[T1, T2, T3, T4]>
export function combineLatest<T1, T2, T3, T4, T5>(
  stream1: Stream<T1>,
  stream2: Stream<T2>,
  stream3: Stream<T3>,
  stream4: Stream<T4>,
  stream5: Stream<T5>
): Stream<[T1, T2, T3, T4, T5]>
export function combineLatest<T1, T2, T3, T4, T5, T6>(
  stream1: Stream<T1>,
  stream2: Stream<T2>,
  stream3: Stream<T3>,
  stream4: Stream<T4>,
  stream5: Stream<T5>,
  stream6: Stream<T6>
): Stream<[T1, T2, T3, T4, T5, T6]>
export function combineLatest<T1, T2, T3, T4, T5, T6, T7>(
  stream1: Stream<T1>,
  stream2: Stream<T2>,
  stream3: Stream<T3>,
  stream4: Stream<T4>,
  stream5: Stream<T5>,
  stream6: Stream<T6>,
  stream7: Stream<T7>
): Stream<[T1, T2, T3, T4, T5, T6, T7]>
export function combineLatest<T1, T2, T3, T4, T5, T6, T7, T8>(
  stream1: Stream<T1>,
  stream2: Stream<T2>,
  stream3: Stream<T3>,
  stream4: Stream<T4>,
  stream5: Stream<T5>,
  stream6: Stream<T6>,
  stream7: Stream<T7>,
  stream8: Stream<T8>
): Stream<[T1, T2, T3, T4, T5, T6, T7, T8]>
export function combineLatest<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
  stream1: Stream<T1>,
  stream2: Stream<T2>,
  stream3: Stream<T3>,
  stream4: Stream<T4>,
  stream5: Stream<T5>,
  stream6: Stream<T6>,
  stream7: Stream<T7>,
  stream8: Stream<T8>,
  stream9: Stream<T9>
): Stream<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>
export function combineLatest<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
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
): Stream<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>
export function combineLatest<T>(...streams: Stream<T>[]): Stream<T[]>
export function combineLatest(...streams: Stream<any>[]) {
  return new Stream<any>(source => {
    if (streams.length === 0) {
      source.complete()
      return
    }

    const latestValues = Array(streams.length)
    const valuesReceived = Array(streams.length)
    let amountReceived = 0

    return new CompositeDisposable(
      streams.map((stream, index) =>
        stream.subscribe(source, {
          onNextValue: value => {
            if (!valuesReceived[index]) {
              valuesReceived[index] = true
              amountReceived++
            }
            latestValues[index] = value
            if (amountReceived >= streams.length) {
              source.next(latestValues)
            }
          }
        })
      )
    )
  })
}
