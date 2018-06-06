import { Disposable } from '../Disposable/Disposable'
import { Message } from '../MessageStream/Message'
import { MessageStream } from '../MessageStream/MessageStream'
import { ActionEventStreamPublicView } from './ActionEventStreamPublicView'
import { ActionEventStreamInternalView } from './ActionEventStreamInternalView'

export class ActionEventStream<TAction extends Message, TEvent extends Message>
  implements Disposable {
  private __actionMessageStream: MessageStream<TAction>
  private __eventMessageStream: MessageStream<TEvent>
  private __publicView: ActionEventStreamPublicView<TAction, TEvent>
  private __internalView: ActionEventStreamInternalView<TAction, TEvent>

  constructor() {
    this.__actionMessageStream = new MessageStream<TAction>()
    this.__eventMessageStream = new MessageStream<TEvent>()
    this.__publicView = new ActionEventStreamPublicView<TAction, TEvent>(
      this.__actionMessageStream,
      this.__eventMessageStream
    )
    this.__internalView = new ActionEventStreamInternalView<TAction, TEvent>(
      this.__actionMessageStream,
      this.__eventMessageStream
    )
  }

  getPublicView(): ActionEventStreamPublicView<TAction, TEvent> {
    return this.__publicView
  }

  getInternalView(): ActionEventStreamInternalView<TAction, TEvent> {
    return this.__internalView
  }

  dispose(): void {
    this.__actionMessageStream.dispose()
    this.__eventMessageStream.dispose()
  }
}
