import { Stream } from '../Stream/Stream'

export const interval = (milliseconds: number) =>
  new Stream<void>(source => {
    const intervalId = setInterval(() => source.next(undefined), milliseconds)
    return () => clearInterval(intervalId)
  })
