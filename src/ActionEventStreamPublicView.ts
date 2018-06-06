import { Message } from './Message'
import { MessageStream } from './MessageStream'
import { MessageStreamInput } from './MessageStreamInput'
import { MessageStreamOutput } from './MessageStreamOutput'

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
