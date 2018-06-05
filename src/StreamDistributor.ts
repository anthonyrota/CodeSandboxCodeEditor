import { StreamListeners } from './StreamListeners'

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
