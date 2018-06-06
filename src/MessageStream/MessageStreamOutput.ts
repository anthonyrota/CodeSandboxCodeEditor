import { Maybe } from './Maybe'
import { Stream } from './Stream'
import {
  ConsciousStream,
  ConsciousStreamStartingValuesInformation
} from './ConsciousStream'
import {
  Message,
  MessageStreamsMap,
  MessagePayloadsOfType,
  MessagePayloadStreamOfType
} from './Message'

export class MessageStreamOutput<T extends Message> {
  private __lastError: Maybe<any>
  private __messageStream: Stream<T>
  private __messageStreamsMap: MessageStreamsMap<T>

  constructor(stream: Stream<T>) {
    this.__messageStream = stream
    this.__messageStreamsMap = {} as MessageStreamsMap<T>
    this.__lastError = Maybe.none()
    this.__messageStream.subscribe({
      onNextValue: this.__onNextValue,
      onError: this.__onError
    })
  }

  private __onNextValue(message: T): void {
    this.__ensureMessageStreamOfType(message.type)
  }

  private __onError(error: any): void {
    this.__lastError = Maybe.some(error)
  }

  private __ensureMessageStreamOfType<U extends T['type']>(
    messageType: U,
    startingValue?: Maybe<MessagePayloadsOfType<T, U>>
  ): void {
    if (!this.__messageStreamsMap[messageType]) {
      const stream = new Stream<MessagePayloadsOfType<T, U>>(source => {
        this.__messageStream.subscribe(source, {
          onNextValue(message: T): void {
            if (message.type === messageType) {
              source.next(message.payload)
            }
          }
        })
      })

      const startingValuesInformation: ConsciousStreamStartingValuesInformation<
        MessagePayloadsOfType<T, U>
      > = {
        startingValue,
        startingError: this.__lastError
      }

      this.__messageStreamsMap[messageType] = new ConsciousStream<
        MessagePayloadsOfType<T, U>
      >(stream, startingValuesInformation)
    }
  }

  public isActive(): boolean {
    return this.__messageStream.isActive()
  }

  public getMessageStream(): Stream<T> {
    return this.__messageStream
  }

  public ofType<U extends T['type']>(
    messageType: U
  ): MessagePayloadStreamOfType<T, U> {
    this.__ensureMessageStreamOfType(messageType)
    return this.__messageStreamsMap[messageType]
  }
}
