import { Stream } from '../Stream/Stream'

export const empty = () => new Stream<void>(source => source.complete())
