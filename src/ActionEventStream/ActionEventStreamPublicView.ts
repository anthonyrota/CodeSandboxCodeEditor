import { Message } from '../MessageStream/Message'
import { MessageStream } from '../MessageStream/MessageStream'
import { MessageStreamInput } from '../MessageStream/MessageStreamInput'
import { MessageStreamOutput } from '../MessageStream/MessageStreamOutput'

export class ActionEventStreamPublicView<
  TAction extends Message,
  TEvent extends Message
> {
  private __inputActions: MessageStreamInput<TAction>
  private __outputEvents: MessageStreamOutput<TEvent>

  constructor(
    actionMessageStream: MessageStream<TAction>,
    eventMessageStream: MessageStream<TEvent>
  ) {
    this.__inputActions = actionMessageStream.getInput()
    this.__outputEvents = eventMessageStream.getOutput()
  }

  getInputActions(): MessageStreamInput<TAction> {
    return this.__inputActions
  }

  getOutputEvents(): MessageStreamOutput<TEvent> {
    return this.__outputEvents
  }
}
