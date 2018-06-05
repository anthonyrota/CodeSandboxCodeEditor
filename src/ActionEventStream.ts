import { IDisposable } from './IDisposable'
import { Message } from './Message'
import { MessageStream } from './MessageStream'
import { ActionEventStreamPublicView } from './ActionEventStreamPublicView'
import { ActionEventStreamInternalView } from './ActionEventStreamInternalView'

export class ActionEventStream<
  TActionType extends Message,
  TEventType extends Message
> implements IDisposable {
  private __actionMessageStream: MessageStream<TActionType>
  private __eventMessageStream: MessageStream<TEventType>
  private __publicView: ActionEventStreamPublicView<TActionType, TEventType>
  private __internalView: ActionEventStreamInternalView<TActionType, TEventType>

  constructor() {
    this.__actionMessageStream = new MessageStream<TActionType>()
    this.__eventMessageStream = new MessageStream<TEventType>()
    this.__publicView = new ActionEventStreamPublicView<
      TActionType,
      TEventType
    >(this.__actionMessageStream, this.__eventMessageStream)
    this.__internalView = new ActionEventStreamInternalView<
      TActionType,
      TEventType
    >(this.__actionMessageStream, this.__eventMessageStream)
  }

  getPublicView(): ActionEventStreamPublicView<TActionType, TEventType> {
    return this.__publicView
  }

  getInternalView(): ActionEventStreamInternalView<TActionType, TEventType> {
    return this.__internalView
  }

  dispose(): void {
    this.__actionMessageStream.dispose()
    this.__eventMessageStream.dispose()
  }
}
