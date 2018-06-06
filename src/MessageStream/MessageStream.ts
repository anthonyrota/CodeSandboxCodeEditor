import { Disposable } from '../Disposable/Disposable'
import { Stream } from '../Stream/Stream'
import { StreamDistributor } from '../Stream/StreamDistributor'
import { StreamSource } from '../Stream/StreamSource'
import { Message } from './Message'
import { MessageStreamInput } from './MessageStreamInput'
import { MessageStreamOutput } from './MessageStreamOutput'

export class MessageStream<T extends Message> implements Disposable {
  private __distributor: StreamDistributor<T>
  private __source: StreamSource<T>
  private __stream: Stream<T>
  private __input: MessageStreamInput<T>
  private __output: MessageStreamOutput<T>

  constructor() {
    this.__distributor = new StreamDistributor<T>()
    this.__source = new StreamSource<T>(this.__distributor)
    this.__stream = new Stream<T>(this.__source, this.__distributor)
    this.__input = new MessageStreamInput<T>(this.__stream, this.__source)
    this.__output = new MessageStreamOutput(this.__stream)
  }

  public getInput(): MessageStreamInput<T> {
    return this.__input
  }

  public getOutput(): MessageStreamOutput<T> {
    return this.__output
  }

  public dispose(): void {
    this.__stream.dispose()
  }
}
