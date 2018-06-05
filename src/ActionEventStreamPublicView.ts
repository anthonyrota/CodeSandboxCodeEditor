import { Message } from './Message'
import { MessageStream } from './MessageStream'
import { MessageStreamInput } from './MessageStreamInput'
import { MessageStreamOutput } from './MessageStreamOutput'

export class ActionEventStreamPublicView<
  TActionType extends Message,
  TEventType extends Message
> {
  private __inputActions: MessageStreamInput<TActionType>
  private __outputEvents: MessageStreamOutput<TEventType>

  constructor(
    actionMessageStream: MessageStream<TActionType>,
    eventMessageStream: MessageStream<TEventType>
  ) {
    this.__inputActions = actionMessageStream.getInput()
    this.__outputEvents = eventMessageStream.getOutput()
  }

  getInputActions(): MessageStreamInput<TActionType> {
    return this.__inputActions
  }

  getOutputEvents(): MessageStreamOutput<TEventType> {
    return this.__outputEvents
  }
}
