import { Message } from '../MessageStream/Message'
import { MessageStream } from '../MessageStream/MessageStream'
import { MessageStreamOutput } from '../MessageStream/MessageStreamOutput'
import { MessageStreamInput } from '../MessageStream/MessageStreamInput'

export class ActionEventStreamInternalView<
  TAction extends Message,
  TEvent extends Message
> {
  private __inputActions: MessageStreamOutput<TAction>
  private __outputEvents: MessageStreamInput<TEvent>

  constructor(
    actionMessageStream: MessageStream<TAction>,
    eventMessageStream: MessageStream<TEvent>
  ) {
    this.__inputActions = actionMessageStream.getOutput()
    this.__outputEvents = eventMessageStream.getInput()
  }

  getInputActions(): MessageStreamOutput<TAction> {
    return this.__inputActions
  }

  getOutputEvents(): MessageStreamInput<TEvent> {
    return this.__outputEvents
  }
}
