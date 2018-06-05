import { IDisposable } from './IDisposable'
import { StreamSource, isStreamSource } from './StreamSource'
import {
  OnNextValueListener,
  OnErrorListener,
  OnCompleteListener,
  StreamListeners,
  isStreamListenersLike
} from './StreamListeners'
import { StreamDistributor } from './StreamDistributor'
import {
  Subscription,
  ValidSubscription,
  NullSubscription
} from './StreamSubscription'
import {
  OnStreamDisposeFunction,
  InitiateStreamFunction,
  Operator
} from './StreamTypes'

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
