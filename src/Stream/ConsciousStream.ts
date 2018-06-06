import { Stream } from './Stream'
import { Subscription } from './StreamSubscription'
import { Maybe } from '../Maybe/Maybe'

export interface ConsciousStreamStartingValuesInformation<T> {
  startingValue?: Maybe<T>
  startingError: Maybe<any>
}

export class ConsciousStream<T> {
  private __stream: Stream<T>
  private __lastValue: Maybe<T>
  private __lastError: Maybe<any>
  private __streamSubscription: Subscription

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

    this.__streamSubscription = this.__stream.subscribe({
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

  public dispose(): void {
    this.__streamSubscription.dispose()
  }

  public disposeSelfAndStream(): void {
    this.__streamSubscription.dispose()
    this.__stream.dispose()
  }
}
