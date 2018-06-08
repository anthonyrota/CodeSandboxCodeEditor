import { Stream } from '../Stream/Stream'
import { Operator } from '../Stream/StreamTypes'
import { interval } from '../StreamConstructor/StreamOperatorInterval'
import { throttle } from './StreamOperatorThrottle'

export const throttleTime = <T>(
  milliseconds: number
): Operator<T, T> => stream =>
  new Stream(source => {
    const intervalStream = interval(milliseconds)
    stream.pipe(throttle(() => intervalStream)).subscribe(source)
    return intervalStream
  })
