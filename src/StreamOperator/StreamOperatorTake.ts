import { Stream } from '../Stream/Stream'
import { Operator } from '../Stream/StreamTypes'

export const take = <T>(count: number): Operator<T, T> => stream =>
  new Stream(source => {
    if (count === 0) {
      source.complete()
      return
    }
    return stream.subscribe(source, {
      onNextValue: value => {
        source.next(value)
        if (--count === 0) {
          source.complete()
        }
      }
    })
  })
