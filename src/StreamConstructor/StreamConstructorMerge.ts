import { Stream } from '../Stream/Stream'
import { CompositeDisposable } from '../Disposable/CompositeDisposable'

export const merge = <T>(...streams: Stream<T>[]) =>
  new Stream<T>(
    source =>
      new CompositeDisposable(streams.map(stream => stream.subscribe(source)))
  )
