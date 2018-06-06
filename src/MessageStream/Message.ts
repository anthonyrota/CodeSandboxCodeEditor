import { ConsciousStream } from '../Stream/ConsciousStream'

export interface Message {
  type: string
  payload: any
}

export type MessagesOfType<
  TMessage extends Message,
  TMessageType extends TMessage['type']
> = Extract<TMessage, { type: TMessageType }>

export type MessagePayloadsOfType<
  TMessage extends Message,
  TMessageType extends TMessage['type']
> = MessagesOfType<TMessage, TMessageType>['payload']

export type MessagePayloadStreamOfType<
  TMessage extends Message,
  TMessageType extends TMessage['type']
> = ConsciousStream<MessagePayloadsOfType<TMessage, TMessageType>>

export type MessageStreamsMap<T extends Message> = {
  [U in T['type']]: MessagePayloadStreamOfType<T, U>
}
