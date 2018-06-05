import { Message } from './Message'
import { MessageStream } from './MessageStream'
import { MessageStreamOutput } from './MessageStreamOutput'
import { MessageStreamInput } from './MessageStreamInput'

export class ActionEventStreamInternalView<
  TActionType extends Message,
  TEventType extends Message
> {
  private __inputActions: MessageStreamOutput<TActionType>
  private __outputEvents: MessageStreamInput<TEventType>

  constructor(
    actionMessageStream: MessageStream<TActionType>,
    eventMessageStream: MessageStream<TEventType>
  ) {
    this.__inputActions = actionMessageStream.getOutput()
    this.__outputEvents = eventMessageStream.getInput()
  }

  getInputActions(): MessageStreamOutput<TActionType> {
    return this.__inputActions
  }

  getOutputEvents(): MessageStreamInput<TEventType> {
    return this.__outputEvents
  }
}
