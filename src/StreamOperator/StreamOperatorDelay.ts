import { Stream } from '../Stream/Stream'
import { Operator } from '../Stream/StreamTypes'
import { CompositeDisposable } from '../Disposable/CompositeDisposable'

export const delay = <T>(milliseconds: number): Operator<T, T> => stream =>
  new Stream(source => {
    const disposable = new CompositeDisposable()

    stream.subscribe(source, {
      onNextValue: value => {
        const timeoutId = setTimeout(() => {
          source.next(value)
        })
        disposable.add({
          dispose: () => clearTimeout(timeoutId)
        })
      }
    })

    return disposable
  })
