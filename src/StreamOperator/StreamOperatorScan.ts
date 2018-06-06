import { Stream } from '../Stream/Stream'
import { Operator } from '../Stream/StreamTypes'

export function scan<T>(
  accumulate: (accumulatedValue: T, value: T, index: number) => T
): Operator<T, T>
export function scan<T, U>(
  accumulate: (accumulatedValue: U, value: T, index: number) => U,
  seed: U
): Operator<T, U>
export function scan<T, U>(
  accumulate: (accumulatedValue: U, value: T, index: number) => U,
  seed?: U
): Operator<T, U> {
  const hasSeed = arguments.length > 1
  return stream => {
    let index = -1
    let accumulatedValue = seed
    return new Stream(subject => {
      if (hasSeed) {
        subject.next(seed!)
        accumulatedValue = seed
        index++
      }
      return stream.subscribe(subject, {
        onNextValue: value => {
          index++
          if (index >= 1) {
            accumulatedValue = accumulate(accumulatedValue!, value, index)
            subject.next(accumulatedValue)
          } else {
            accumulatedValue = (value as any) as U
            subject.next(accumulatedValue)
          }
        }
      })
    })
  }
}
