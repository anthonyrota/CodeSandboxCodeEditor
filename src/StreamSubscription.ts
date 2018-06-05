import { IDisposable } from './IDisposable'
import { StreamDistributor } from './StreamDistributor'
import {
  OnNextValueListener,
  OnErrorListener,
  OnCompleteListener
} from './StreamListeners'

export interface Subscription extends IDisposable {
  dispose(): void
  isActive(): boolean
  isNullStream(): boolean
}

export class ValidSubscription<T> implements Subscription {
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

export class NullSubscription implements Subscription {
  public dispose(): void {}

  public isActive(): boolean {
    return false
  }

  public isNullStream(): boolean {
    return true
  }
}
