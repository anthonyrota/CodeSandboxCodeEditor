import { Stream } from '../Stream/Stream'
import { StreamSource } from '../Stream/StreamSource'
import { Message } from './Message'

export class MessageStreamInput<T extends Message> {
  __stream: Stream<T>
  __source: StreamSource<T>

  constructor(stream: Stream<T>, source: StreamSource<T>) {
    this.__stream = stream
    this.__source = source
  }

  public next(value: T): void {
    this.__source.next(value)
  }

  public error(error: any): void {
    this.__source.error(error)
  }

  public isActive(): boolean {
    return this.__stream.isActive()
  }
}
