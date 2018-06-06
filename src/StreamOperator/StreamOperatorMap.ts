import { Stream } from '../Stream/Stream'
import { Operator } from '../Stream/StreamTypes'

export const map = <T, U>(
  transform: (value: T) => U
): Operator<T, U> => stream =>
  new Stream(source =>
    stream.subscribe(source, {
      onNextValue: value => source.next(transform(value))
    })
  )
