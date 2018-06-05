interface IDisposable {
  dispose(): void
}

export interface OnNextValueListener<T> {
  (value: T): void
}

export interface OnErrorListener {
  (error: any): void
}

export interface OnCompleteListener {
  (): void
}

export interface StreamListeners<T> {
  onNextValue?: OnNextValueListener<T>
  onError?: OnErrorListener
  onComplete?: OnCompleteListener
}

export function isStreamListenersLike(
  value: any
): value is StreamListeners<any> {
  return (
    typeof value === 'object' &&
    ((typeof value.onNextValue === 'function' || value.onNextValue == null) &&
      (typeof value.onError === 'function' || value.onNextValue == null) &&
      (typeof value.onComplete === 'function' || value.onNextValue == null))
  )
}

interface SubscriptionListenerMap<T> {
  [subscriptionId: number]: StreamListeners<T>
}

interface StreamDistributorActiveState<T> {
  __isActive: true
  __listeners: SubscriptionListenerMap<T>
}

interface StreamDistributorInactiveState {
  __isActive: false
}

type StreamDistributorState<T> =
  | StreamDistributorActiveState<T>
  | StreamDistributorInactiveState

export class StreamDistributor<T> {
  private __currentSubscriptionId: number
  private __state: StreamDistributorState<T>

  constructor() {
    this.__currentSubscriptionId = 0
    this.__state = {
      __isActive: true,
      __listeners: {}
    }
  }

  public addStreamListeners(streamListeners: StreamListeners<T>): number {
    if (!this.__state.__isActive) {
      return -1
    }
    const subscriptionId = this.__currentSubscriptionId++
    this.__state.__listeners[subscriptionId] = streamListeners
    return subscriptionId
  }

  public removeStreamListeners(subscriptionId: number): void {
    if (this.__state.__isActive) {
      delete this.__state.__listeners[subscriptionId]
    }
  }

  public onNextValue(value: T): void {
    if (this.__state.__isActive) {
      for (const key in this.__state.__listeners) {
        const listener = this.__state.__listeners[key]
        if (listener.onNextValue) {
          listener.onNextValue(value)
        }
      }
    } else {
      if (typeof console !== 'undefined' && 'warn' in console) {
        console.warn(
          `[StreamDistributor] onNextValue was called with value ${value} after the distributor was marked as completed`
        )
      }
    }
  }

  public onError(error: any): void {
    if (this.__state.__isActive) {
      for (const key in this.__state.__listeners) {
        const listener = this.__state.__listeners[key]
        if (listener.onError) {
          listener.onError(error)
        }
      }
    }
  }

  public onComplete() {
    if (this.__state.__isActive) {
      for (const key in this.__state.__listeners) {
        const listener = this.__state.__listeners[key]
        if (listener.onComplete) {
          listener.onComplete()
        }
      }
    }
    this.__state = { __isActive: false }
  }
}

export interface Subscription extends IDisposable {
  dispose(): void
  isActive(): boolean
  isNullStream(): boolean
}

class ValidSubscription<T> implements Subscription {
  private __isActive: boolean
  private __distributor: StreamDistributor<T>
  private __onNextValueListener?: OnNextValueListener<T>
  private __onErrorListener?: OnErrorListener
  private __onCompleteListener?: OnCompleteListener
  private __subscriptionId: number

  constructor(
    distributor: StreamDistributor<T>,
    onNextValue?: OnNextValueListener<T>,
    onError?: OnErrorListener,
    onComplete?: OnCompleteListener
  ) {
    this.__onNextValue = this.__onNextValue.bind(this)
    this.__onError = this.__onError.bind(this)
    this.__onComplete = this.__onComplete.bind(this)

    this.__isActive = true
    this.__distributor = distributor
    this.__onNextValueListener = onNextValue
    this.__onErrorListener = onError
    this.__onCompleteListener = onComplete
    this.__subscriptionId = this.__distributor.addStreamListeners({
      onNextValue: this.__onNextValue,
      onError: this.__onError,
      onComplete: this.__onComplete
    })
  }

  private __onNextValue(value: T): void {
    if (this.__isActive && this.__onNextValueListener) {
      this.__onNextValueListener(value)
    }
  }

  private __onError(error: any): void {
    if (this.__isActive && this.__onErrorListener) {
      this.__onErrorListener(error)
    }
  }

  private __onComplete(): void {
    if (this.__isActive && this.__onCompleteListener) {
      this.__isActive = false
      this.__onComplete()
    }
  }

  public dispose(): void {
    if (this.__isActive) {
      this.__isActive = false
      this.__distributor.removeStreamListeners(this.__subscriptionId)
    }
  }

  public isActive(): boolean {
    return this.__isActive
  }

  public isNullStream(): boolean {
    return false
  }
}

class NullSubscription implements Subscription {
  public dispose(): void {}

  public isActive(): boolean {
    return false
  }

  public isNullStream(): boolean {
    return true
  }
}

export class StreamSource<T> {
  private __distributor: StreamDistributor<T>

  constructor(distributor: StreamDistributor<T>) {
    this.__distributor = distributor

    this.next = this.next.bind(this)
    this.error = this.error.bind(this)
    this.complete = this.complete.bind(this)
  }

  public next(value: T) {
    this.__distributor.onNextValue(value)
  }

  public error(error: any) {
    this.__distributor.onError(error)
  }

  public complete() {
    this.__distributor.onComplete()
  }
}

export function isStreamSource(value: any): value is StreamSource<any> {
  return value instanceof StreamSource
}

export interface Operator<T, U> {
  (stream: Stream<T>): Stream<U>
}

export interface InitiateStreamFunction<T> {
  (source: StreamSource<T>): OnStreamDisposeFunction | void
}

export interface OnStreamDisposeFunction {
  (): void
}

interface StreamActiveState<T> {
  __isActive: true
  __source: StreamSource<T>
  __distributor: StreamDistributor<T>
  __onDispose: OnStreamDisposeFunction | void
}

interface StreamInactiveState {
  __isActive: false
}

type StreamState<T> = StreamActiveState<T> | StreamInactiveState

export class Stream<T> implements IDisposable {
  private __state: StreamState<T>
  private __isDisposed: boolean
  private __initiate: InitiateStreamFunction<T>

  constructor(
    source: StreamSource<T>,
    distributor: StreamDistributor<T>,
    onDispose?: OnStreamDisposeFunction
  )
  constructor(subscribeFunction: InitiateStreamFunction<T>)
  constructor(
    sourceOrSubscribeFunction: InitiateStreamFunction<T> | StreamSource<T>,
    distributor?: StreamDistributor<T>,
    onDispose?: OnStreamDisposeFunction
  ) {
    if (isStreamSource(sourceOrSubscribeFunction)) {
      this.__state = {
        __isActive: true,
        __distributor: distributor as StreamDistributor<T>,
        __source: sourceOrSubscribeFunction,
        __onDispose: onDispose
      }
    } else {
      this.__initiate = sourceOrSubscribeFunction
      this.__isDisposed = false
      this.__state = { __isActive: false }
    }
  }

  public subscribe(
    onNextValue?: OnNextValueListener<T>,
    onError?: OnErrorListener,
    onComplete?: OnCompleteListener
  ): Subscription
  public subscribe(StreamListeners: StreamListeners<T>): Subscription
  public subscribe(source: StreamSource<T>): Subscription
  public subscribe<U>(
    source: StreamSource<U>,
    StreamListeners: StreamListeners<T>
  ): Subscription
  public subscribe(
    onNextValueOrStreamListenersOrStreamSource?:
      | OnNextValueListener<T>
      | StreamSource<T>
      | StreamListeners<T>,
    onErrorOrStreamListeners?: OnErrorListener | StreamListeners<T>,
    onComplete?: OnCompleteListener
  ): Subscription {
    if (this.__isDisposed) {
      return new NullSubscription()
    }
    if (isStreamSource(onNextValueOrStreamListenersOrStreamSource)) {
      if (isStreamListenersLike(onErrorOrStreamListeners)) {
        return this.__subscribe(
          onErrorOrStreamListeners.onNextValue ||
            onNextValueOrStreamListenersOrStreamSource.next,
          onErrorOrStreamListeners.onError ||
            onNextValueOrStreamListenersOrStreamSource.error,
          onErrorOrStreamListeners.onComplete ||
            onNextValueOrStreamListenersOrStreamSource.complete
        )
      }
      return this.__subscribe(
        onNextValueOrStreamListenersOrStreamSource.next,
        onNextValueOrStreamListenersOrStreamSource.error,
        onNextValueOrStreamListenersOrStreamSource.complete
      )
    } else if (
      isStreamListenersLike(onNextValueOrStreamListenersOrStreamSource)
    ) {
      return this.__subscribe(
        onNextValueOrStreamListenersOrStreamSource.onNextValue,
        onNextValueOrStreamListenersOrStreamSource.onError,
        onNextValueOrStreamListenersOrStreamSource.onComplete
      )
    } else {
      return this.__subscribe(
        onNextValueOrStreamListenersOrStreamSource,
        onErrorOrStreamListeners as OnErrorListener,
        onComplete
      )
    }
  }

  private __subscribe(
    onNextValueListener?: OnNextValueListener<T>,
    onErrorListener?: OnErrorListener,
    onCompleteListener?: OnCompleteListener
  ): Subscription {
    if (!this.__state.__isActive) {
      const distributor = new StreamDistributor<T>()
      const source = new StreamSource<T>(distributor)
      const onDispose = this.__initiate(source)
      this.__state = {
        __isActive: true,
        __distributor: distributor,
        __source: source,
        __onDispose: onDispose
      }
    }
    return new ValidSubscription(
      this.__state.__distributor,
      onNextValueListener,
      onErrorListener,
      onCompleteListener
    )
  }

  public pipe(): Stream<T>
  public pipe<A>(operator1: Operator<T, A>): Stream<A>
  public pipe<A, B>(
    operator1: Operator<T, A>,
    operator2: Operator<A, B>
  ): Stream<B>
  public pipe<A, B, C>(
    operator1: Operator<T, A>,
    operator2: Operator<A, B>,
    operator3: Operator<B, C>
  ): Stream<C>
  public pipe<A, B, C, D>(
    operator1: Operator<T, A>,
    operator2: Operator<A, B>,
    operator3: Operator<B, C>,
    operator4: Operator<C, D>
  ): Stream<D>
  public pipe<A, B, C, D, E>(
    operator1: Operator<T, A>,
    operator2: Operator<A, B>,
    operator3: Operator<B, C>,
    operator4: Operator<C, D>,
    operator5: Operator<D, E>
  ): Stream<E>
  public pipe<A, B, C, D, E, F>(
    operator1: Operator<T, A>,
    operator2: Operator<A, B>,
    operator3: Operator<B, C>,
    operator4: Operator<C, D>,
    operator5: Operator<D, E>,
    operator6: Operator<E, F>
  ): Stream<F>
  public pipe<A, B, C, D, E, F, G>(
    operator1: Operator<T, A>,
    operator2: Operator<A, B>,
    operator3: Operator<B, C>,
    operator4: Operator<C, D>,
    operator5: Operator<D, E>,
    operator6: Operator<E, F>,
    operator7: Operator<F, G>
  ): Stream<G>
  public pipe<A, B, C, D, E, F, G, H>(
    operator1: Operator<T, A>,
    operator2: Operator<A, B>,
    operator3: Operator<B, C>,
    operator4: Operator<C, D>,
    operator5: Operator<D, E>,
    operator6: Operator<E, F>,
    operator7: Operator<F, G>,
    operator8: Operator<G, H>
  ): Stream<H>
  public pipe<A, B, C, D, E, F, G, H, I>(
    operator1: Operator<T, A>,
    operator2: Operator<A, B>,
    operator3: Operator<B, C>,
    operator4: Operator<C, D>,
    operator5: Operator<D, E>,
    operator6: Operator<E, F>,
    operator7: Operator<F, G>,
    operator8: Operator<G, H>,
    operator9: Operator<H, I>
  ): Stream<I>
  public pipe<U>(...operators: Operator<any, any>[]): Stream<U>
  public pipe<U>(...operators: Operator<any, any>[]): Stream<U> {
    let result = this as Stream<any>
    for (let i = 0; i < operators.length; i++) {
      result = operators[i](result)
    }
    return result
  }

  public dispose(): void {
    this.__isDisposed = true
    if (this.__state.__isActive) {
      this.__state.__distributor.onComplete()
      if (this.__state.__onDispose) {
        this.__state.__onDispose()
      }
      this.__state = { __isActive: false }
    }
  }

  isActive() {
    return !this.__isDisposed
  }
}

export abstract class Maybe<T> {
  abstract isEmpty(): boolean
  abstract hasValue(): boolean
  abstract or(maybe: Maybe<T>): Maybe<T>
  abstract orGet(getMaybe: () => Maybe<T>): Maybe<T>
  abstract orElse(value: T): Maybe<T>
  abstract orElseGet(getValue: () => T): Maybe<T>
  abstract getOrElse(value: T): T
  abstract getOrElseComputed(getValue: () => T): T
  abstract match<U>(outcomes: { some: (value: T) => U; none: () => U }): U
  abstract map<U>(transform: (value: T) => U): Maybe<U>
  abstract flatMap<U>(transform: (value: T) => Maybe<U>): Maybe<U>
  abstract filter(predicate: (value: T) => boolean): Maybe<T>
  abstract getOrThrow(): T
  abstract getOrThrowError(error: any): T
  abstract getOrThrowComputedError(getError: () => any): T

  static fromNullable<T>(valueOrNull: T | null | undefined): Maybe<T> {
    return valueOrNull == null ? new None<T>() : new Some<T>(valueOrNull)
  }

  static fromNonNullable<T>(valueOrNull: T | null | undefined): Maybe<T> {
    if (valueOrNull == null) {
      throw new TypeError('value is null')
    }
    return new Some<T>(valueOrNull)
  }

  static none<T>(): Maybe<T> {
    return new None<T>()
  }

  static some<T>(value: T): Maybe<T> {
    return new Some<T>(value)
  }
}

class Some<T> extends Maybe<T> {
  private __value: T

  constructor(value: T) {
    super()
    this.__value = value
  }

  isEmpty(): boolean {
    return false
  }

  hasValue(): boolean {
    return true
  }

  or(maybe: Maybe<T>): Maybe<T> {
    return this
  }

  orGet(getMaybe: () => Maybe<T>): Maybe<T> {
    return this
  }

  orElse(value: T): Maybe<T> {
    return this
  }

  orElseGet(getValue: () => T): Maybe<T> {
    return this
  }

  getOrElse(value: T): T {
    return this.__value
  }

  getOrElseComputed(getValue: () => T): T {
    return this.__value
  }

  match<U>(outcomes: { some: (value: T) => U; none: () => U }): U {
    return outcomes.some(this.__value)
  }

  map<U>(transform: (value: T) => U): Maybe<U> {
    return new Some(transform(this.__value))
  }

  flatMap<U>(transform: (value: T) => Maybe<U>): Maybe<U> {
    return transform(this.__value)
  }

  filter(predicate: (value: T) => boolean): Maybe<T> {
    return predicate(this.__value) ? this : new None<T>()
  }

  getOrThrow(): T {
    return this.__value
  }

  getOrThrowError(error: any): T {
    return this.__value
  }

  getOrThrowComputedError(getError: () => any): T {
    return this.__value
  }
}

class None<T> extends Maybe<T> {
  isEmpty(): boolean {
    return true
  }

  hasValue(): boolean {
    return false
  }

  or(maybe: Maybe<T>): Maybe<T> {
    return maybe
  }

  orGet(getMaybe: () => Maybe<T>): Maybe<T> {
    return getMaybe()
  }

  orElse(value: T): Maybe<T> {
    return new Some<T>(value)
  }

  orElseGet(getValue: () => T): Maybe<T> {
    return new Some<T>(getValue())
  }

  getOrElse(value: T): T {
    return value
  }

  getOrElseComputed(getValue: () => T): T {
    return getValue()
  }

  match<U>(outcomes: { some: (value: T) => U; none: () => U }): U {
    return outcomes.none()
  }

  map<U>(transform: (value: T) => U): Maybe<U> {
    return new None<U>()
  }

  flatMap<U>(transform: (value: T) => Maybe<U>): Maybe<U> {
    return new None<U>()
  }

  filter(predicate: (value: T) => boolean): Maybe<T> {
    return this
  }

  getOrThrow(): T {
    throw new TypeError('No value')
  }

  getOrThrowError(error: any): T {
    throw error
  }

  getOrThrowComputedError(getError: () => any): T {
    throw getError()
  }
}

export interface ConsciousStreamStartingValuesInformation<T> {
  startingValue?: Maybe<T>
  startingError: Maybe<any>
}

export class ConsciousStream<T> {
  private __stream: Stream<T>
  private __lastValue: Maybe<T>
  private __lastError: Maybe<any>

  constructor(
    stream: Stream<T>,
    startingValuesInformation?: ConsciousStreamStartingValuesInformation<T>
  ) {
    this.__stream = stream

    this.__lastValue =
      startingValuesInformation && startingValuesInformation.startingValue
        ? startingValuesInformation.startingValue
        : Maybe.none()
    this.__lastError =
      startingValuesInformation && startingValuesInformation.startingError
        ? startingValuesInformation.startingError
        : Maybe.none()

    this.__stream.subscribe({
      onNextValue: this.__onNextValue,
      onError: this.__onError
    })
  }

  private __onNextValue(value: T): void {
    this.__lastValue = Maybe.some(value)
  }

  private __onError(error: any): void {
    this.__lastError = Maybe.some(error)
  }

  public getStream(): Stream<T> {
    return this.__stream
  }

  public getLastValue(): Maybe<T> {
    return this.__lastValue
  }

  public getLastError(): Maybe<any> {
    return this.__lastError
  }

  public isActive(): boolean {
    return this.__stream.isActive()
  }
}

export interface Message {
  type: string
  payload: any
}

export class MessageStreamInput<T extends Message> {
  __stream: Stream<T>
  __source: StreamSource<T>

  constructor(stream: Stream<T>, source: StreamSource<T>) {
    this.__stream = stream
    this.__source = source
  }

  public next(value: T): void {
    this.__source.next(value)
  }

  public error(error: any): void {
    this.__source.error(error)
  }

  public isActive(): boolean {
    return this.__stream.isActive()
  }
}

type MessagesOfType<
  TMessage extends Message,
  TMessageType extends TMessage['type']
> = Extract<TMessage, { type: TMessageType }>

type MessagePayloadsOfType<
  TMessage extends Message,
  TMessageType extends TMessage['type']
> = MessagesOfType<TMessage, TMessageType>['payload']

type MessagePayloadStreamOfType<
  TMessage extends Message,
  TMessageType extends TMessage['type']
> = ConsciousStream<MessagePayloadsOfType<TMessage, TMessageType>>

type MessageStreamsMap<T extends Message> = {
  [U in T['type']]: MessagePayloadStreamOfType<T, U>
}

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

export class MessageStream<T extends Message> implements IDisposable {
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

export class ActionEventStream<
  TActionType extends Message,
  TEventType extends Message
> {
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
