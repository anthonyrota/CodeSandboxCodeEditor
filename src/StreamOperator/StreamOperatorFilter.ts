import { Stream } from '../Stream/Stream'
import { Operator } from '../Stream/StreamTypes'

export const filter = <T>(
  predicate: (value: T) => boolean
): Operator<T, T> => stream =>
  new Stream(source =>
    stream.subscribe(source, {
      onNextValue: value => {
        if (predicate(value)) {
          source.next(value)
        }
      }
    })
  )
