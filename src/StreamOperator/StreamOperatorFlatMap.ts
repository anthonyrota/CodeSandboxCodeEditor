import { Stream } from '../Stream/Stream'
import { Operator } from '../Stream/StreamTypes'
import { CompositeDisposable } from '../Disposable/CompositeDisposable'

export const flatMap = <T, U>(
  transform: (value: T) => Stream<U>
): Operator<T, U> => stream =>
  new Stream(source => {
    const disposable = new CompositeDisposable([
      stream.subscribe(source, {
        onNextValue: value => {
          const newStream = transform(value)
          disposable.add(newStream)
          newStream.subscribe(source)
        }
      })
    ])
    return disposable
  })
