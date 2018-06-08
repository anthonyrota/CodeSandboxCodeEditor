import { Stream } from '../Stream/Stream'
import { Operator } from '../Stream/StreamTypes'
import { CompositeDisposable } from '../Disposable/CompositeDisposable'

export const throttle = <T>(
  getDurationStream: (value: T) => Stream<any>
): Operator<T, T> => stream =>
  new Stream(source => {
    const durationDisposable = new CompositeDisposable()

    return new CompositeDisposable([
      durationDisposable,
      stream.subscribe(source, {
        onNextValue: value => {
          durationDisposable.dispose()

          const distributeValue = () => {
            durationDisposable.dispose()
            source.next(value)
          }

          durationDisposable.add(
            getDurationStream(value).subscribe({
              onNextValue: distributeValue,
              onError: distributeValue,
              onComplete: distributeValue
            })
          )
        }
      })
    ])
  })
