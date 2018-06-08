import { Stream } from '../Stream/Stream'
import { Operator } from '../Stream/StreamTypes'

export const takeWhile = <T>(
  predicate: (value: T) => boolean
): Operator<T, T> => stream =>
  new Stream<T>(source =>
    stream.subscribe(source, {
      onNextValue: value => {
        if (!predicate(value)) {
          source.complete()
          return
        }
        source.next(value)
      }
    })
  )
