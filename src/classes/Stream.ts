/**
 * @todo
 * Clean up messy state management with a Maybe type, with methods
 * Maybe.Just and Maybe.None. This will greatly reduce the boilerplate
 * code in many of the classes below
 */

interface IDisposable {
  dispose(): void
}

/**
 * Callback when a stream receives a new value
 */
export interface OnNextValueListener<T> {
  /**
   * @param value The next value distributed
   */
  (value: T): void
}

/**
 * Callback when an error occurs in a stream
 */
export interface OnErrorListener {
  /**
   * @param error The error caught
   */
  (error: any): void
}

/**
 * Callback when a stream completes
 */
export interface OnCompleteListener {
  (): void
}

/**
 * An object to hold the possible listeners of a stream
 */
export interface StreamListeners<T> {
  /**
   * Callback when a stream receives a new value
   */
  onNextValue?: OnNextValueListener<T>
  /**
   * Callback when an error occurs in a stream
   */
  onError?: OnErrorListener
  /**
   * Callback when a stream completes
   */
  onComplete?: OnCompleteListener
}

/**
 * Returns whether the given value has the same shape as a [stream listeners]{@link StreamListeners}
 * object. Note: This does not mean that the value is a stream listeners object, but just means that
 * it has the same shape as one. For example, if you pass in anything of type `object`, as long as
 * the fields `onNextValue`, `onError` and `onComplete` are either `undefined`, `null` or a`function`,
 * the `isStreamListenersLike` function will return true. However, if the values passed is not an
 * object, or one or more of the fields `onNextValue`, `onError` and `onComplete` are not `undefined`,
 * `null` or a `function`, then the `isStreamListenersLike` function will return false.
 *
 * @param value The value to test
 * @returns Whether the value has the same shape as a [stream listeners]{@link StreamListeners} object
 *
 * @example <caption>Values Which Will Return True</caption>
 * isStreamListenersLike({}) // true
 * isStreamListenersLike({
 *   onNextValue() {}
 * }) // true
 * isStreamListenersLike({
 *   onComplete() {}
 * }) // true
 * isStreamListenersLike({
 *   onNextValue() {},
 *   onError() {},
 *   onComplete() {}
 * }) // true
 * isStreamListenersLike({
 *   onNextValue: null,
 *   onError: undefined,
 *   onComplete() {}
 * }) // true
 * isStreamListenersLike({
 *   foo: 'bar'
 * }) // true
 * isStreamListenersLike({
 *   onComplete() {},
 *   otherMethod() {},
 *   otherRandomProperty: 234
 * }) // true
 * class MyClass {
 *   onNextValue() {}
 *   onError = undefined
 *   onComplete = () => {}
 * }
 * isStreamListenersLike(new MyClass()) // true
 * isStreamListenersLike(document.createElement('div')) // true
 *
 * @example <caption>Values Which Will Return False</caption>
 * isStreamListenersLike() // false
 * isStreamListenersLike('arbitrary string') // false
 * isStreamListenersLike({
 *   onNextValue: 235
 * }) // false
 * class MyClass {
 *   onNextValue = {
 *     handler: () => {}
 *   }
 * }
 * isStreamListenersLike(new MyClass()) // false
 */
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

/**
 * A map of the subscription id to the corresponding [stream listeners]{@link StreamListeners} object
 * @private
 */
interface SubscriptionListenerMap<T> {
  [subscriptionId: number]: StreamListeners<T>
}

/**
 * The state when the [stream distributor]{@link StreamDistributor} is active
 * @private
 */
interface StreamDistributorActiveState<T> {
  /**
   * Whether the [stream distributor]{@link StreamDistributor} is active.
   * This value is always true
   */
  __isActive: true
  /**
   * The [map of listeners]{@link SubscriptionListenerMap} for the
   * [stream distributor]{@link StreamDistributor}
   * @see StreamListenerMap
   */
  __listeners: SubscriptionListenerMap<T>
}

/**
 * The state when the [stream distributor]{@link StreamDistributor} is inactive
 * @see StreamDistributor
 * @private
 */
interface StreamDistributorInactiveState {
  /**
   * Whether the [stream distributor]{@link StreamDistributor} is active.
   * This value is always false
   */
  __isActive: false
}

/**
 * The state of the [stream distributor]{@link StreamDistributor}.
 * Can be either [active]{@link StreamDistributorActiveState} or
 * [inactive]{@link StreamDistributorInactiveState}
 * @private
 */
type StreamDistributorState<T> =
  | StreamDistributorActiveState<T>
  | StreamDistributorInactiveState

/**
 * Distributes the various stream events
 */
export class StreamDistributor<T> {
  /**
   * The subscription id to be used when generating a listener.
   * This identifier is returned to whoever subscribed to it, and can
   * be used as a token to unsubscribe from the {@link StreamDistributor}
   * @private
   */
  private __currentSubscriptionId: number
  /**
   * The current [state]{@link StreamDistributorState} of the stream distributor.
   * This holds whether it is active, as well as other state information, such
   * as the map between a subscriptionId and the corresponding stream listeners
   * object
   * @private
   */
  private __state: StreamDistributorState<T>

  /**
   * The [stream distributor]{@link StreamDistributor} has the role of distributing the next,
   * error and complete events to multiple subscribers. It can be used to notify subscribers of
   * events and for many other cases. It is very useful when there is a single stream of values
   * which needs to be distributed to many subscribers, similar to a stream. The distributor
   * can be subscribed to with listeners, and whenever it receives a new event it will distribute
   * it to all of its subscribers. After subscribing through the `addStreamListeners` you will
   * receive a number which acts as the subscription id, which can then be used to unsubscribe
   * from the stream distributor through the `removeStreamListeners` method. You can use the
   * methods `onNextValue`, `onError` and `onComplete` to notify subscribers of when a value is
   * received, of when an error is received and when the distributor is no longer needed. If a
   * stream distributor is given a value after it is completed, than than any future values
   * received will raise an error, and will be ignored. This means that any listeners of a
   * stream distributor will become useless after the distributor is completed.
   *
   * @example <caption>Enhancing the subscription received</caption>
   * // As the subscriptionId received is just a number, it would be useful for it to be an object
   * // which can be unsubscribed from so that the consumer of the distributor doesn't have to
   * // keep a reference to the distributor in order to unsubscribe from it. This function
   * // attaches the stream listeners to the given distributor and returns an object with a
   * // `dispose` method which can be used to unsubscribe from distributor and therefore not
   * // receive any more events
   * interface StreamDistributorSubscription {
   *   dispose(): void
   * }
   *
   * function attachStreamListeners<T>(distributor: StreamDistributor<T>, listeners: StreamListeners<T>): StreamDistributorSubscription {
   *   const subscriptionId = distributor.addStreamListeners(listeners)
   *   return {
   *     dispose() {
   *       distributor.removeStreamListeners(subscriptionId)
   *     }
   *   }
   * }
   *
   * // usage
   * const distributor = new StreamDistributor<number>()
   *
   * distributor.onNextValue(0)
   * distributor.onNextValue(1)
   *
   * const subscription = attachStreamListeners(distributor, {
   *   onNextValue: (value: number) => console.log('next value -', value),
   *   onComplete: () => console.log('complete')
   * })
   *
   * distributor.onNextValue(2)
   * distributor.onNextValue(3)
   *
   * subscription.dispose()
   *
   * distributor.onNextValue(4)
   * distributor.onNextValue(5)
   * distributor.onComplete()
   *
   * // outputs:
   * next value - 2
   * next value - 3
   *
   * @example <caption>Distributing Counting Numbers</caption>
   * // create the distributor
   * const distributor = new StreamDistributor<number>()
   *
   * let i = 0
   * const intervalId = setInterval(() => {
   *   // emit values to the listeners
   *   distributor.onNextValue(i++)
   *   if (i === 5) {
   *     clearInterval(intervalId)
   *     distributor.onComplete()
   *   }
   * })
   *
   * // subscribe to the distributor
   * distributor.addStreamListeners({
   *   onNextValue(number: number): void {
   *     console.log('next value - ' + number)
   *   },
   *   onComplete(): void {
   *     console.log('completed')
   *   }
   * })
   *
   * // outputs:
   * // next value - 0
   * // next value - 1
   * // next value - 2
   * // next value - 3
   * // next value - 4
   * // next value - 5
   * // completed
   *
   * @example <caption>Distributing Errors</caption>
   * function sleep(amount: number): Promise<void> {
   *   return new Promise<void>(resolve => {
   *     window.setTimeout(resolve, amount)
   *   })
   * }
   *
   * const distributor = new StreamDistributor<number>()
   *
   * (async function() {
   *   for (let i = 0; i < 5; i++) {
   *     try {
   *       if (i === 2) {
   *         throw new Error('HAHA!')
   *       } else {
   *         distributor.onNextValue(i)
   *       }
   *     } catch (error) {
   *       distributor.onError(error)
   *     }
   *     await sleep(1000)
   *   }
   *   distributor.onComplete()
   * })()
   *
   * distributor.addStreamListeners({
   *   onNextValue(num: number): void {
   *     console.log('next value', number)
   *   },
   *   onError(error: any): void {
   *     console.log('error', error)
   *   },
   *   onComplete(): void {
   *     console.log('complete')
   *   }
   * })
   *
   * @example <caption>Using a stream distributor as an infinite stream</caption>
   * const delay = require('delay')
   * const distributor = new StreamDistributor<number>()
   *
   * (async function() {
   *   for (let i = 0;; i++) {
   *     await delay(10000)
   *     distributor.onNextValue(i)
   *   }
   * })
   *
   * const startTime = Date.now()
   * distributor.addStreamListeners({
   *   onNextValue(value: number): void {
   *     const currentTime = Date.now()
   *     const seconds = Math.round((currentTime - startTime) / 1000)
   *     console.log(`the value ${value} has been received after ${seconds} seconds`)
   *   }
   * })
   *
   * // outputs:
   * // the value 0 has been received after 10 seconds
   * // the value 1 has been received after 20 seconds
   * // the value 2 has been received after 30 seconds
   * // ...
   *
   * @example <caption>Using a stream distributor to notify subscribers, without actually emitting a value</caption>
   * class Notifier {
   *   private __distributor: StreamDistributor<void>
   *
   *   constructor() {
   *     this.__distributor = new StreamDistributor<void>()
   *   }
   *
   *   notifySubscribers() {
   *     this.__distributor.onNextValue(undefined)
   *   }
   *
   *   subscribe(callback: () => void): number {
   *     return this.__distributor.addStreamListeners({
   *       onNextValue: callback
   *     })
   *   }
   *
   *   unsubscribe(subscriptionId: number): void {
   *     this.__distributor.removeStreamListeners(subscriptionId)
   *   }
   * }
   *
   * // usage
   * const didRenderNotifier = new Notifier()
   *
   * function render() {
   *   window.requestAnimationFrame(render)
   *   didRenderNotifier.notifySubscribers()
   *   // rendering stuff
   * }
   * window.requestAnimationFrame(render)
   *
   * const subscriptionId = didRenderNotifier.subscribe(() => {
   *   console.log('Application has rendered')
   * })
   *
   * setTimeout(() => {
   *   didRenderNotifier.unsubscribe(subscriptionId)
   *   console.log('Unsubscribed')
   * }, 1000)
   *
   * // Application has rendered
   * // Application has rendered
   * // ...
   * // Unsubscribed
   *
   * @example <caption>Using a stream distributor as an EventEmitter</caption>
   * class EventEmitterSubscription {
   *   private __distributor: StreamDistributor<any>
   *   private __subscriptionId: number
   *
   *   static attachStreamListeners<T>(distributor: StreamDistributor<T>, listeners: StreamListeners<T>): EventEmitterSubscription {
   *     return new EventEmitterSubscription(
   *       distributor,
   *       distributor.addStreamListeners(listeners)
   *     )
   *   }
   *
   *   constructor(distributor: StreamDistributor<any>, subscriptionId: number) {
   *     this.__distributor = distributor
   *     this.__subscriptionId = subscriptionId
   *   }
   *
   *   dispose() {
   *     this.__distributor.removeStreamListeners(this.__subscriptionId)
   *   }
   * }
   *
   * class EventEmitter<T extends { [eventName: string]: any }> {
   *   private __distributor: StreamDistributor<{ type: keyof T, payload: T[keyof T] }>
   *
   *   constructor() {
   *     this.__distributor = new StreamDistributor()
   *   }
   *
   *   emit<U extends keyof T>(event: { type: U, payload: T[U] }): void {
   *     this.__distributor.onNextValue(event)
   *   }
   *
   *   dispose(): void {
   *     this.__distributor.onComplete()
   *   }
   *
   *   onDispose(callback: () => void): EventEmitterSubscription {
   *     return EventEmitterSubscription.attachStreamListeners(this.__distributor, {
   *       onComplete: callback
   *     })
   *   }
   *
   *   onEvent(callback: (event: { type: keyof T, payload: T[keyof T] }) => void): EventEmitterSubscription {
   *     return EventEmitterSubscription.attachStreamListeners(this.__distributor, {
   *       onNextValue: callback
   *     })
   *   }
   *
   *   on<U extends keyof T>(eventName: U, callback: (payload: T[U]) => void): EventEmitterSubscription {
   *     return this.onEvent(event => {
   *       if (event.type === eventName) {
   *         callback(event.payload)
   *       }
   *     })
   *   }
   *
   *   once<U extends keyof T>(eventName: U, callback: (payload: T[U]) => void): EventEmitterSubscription {
   *     const subscription = this.on(eventName, event => {
   *       callback(event)
   *       subscription.dispose()
   *     })
   *     return subscription
   *   }
   * }
   *
   * // usage
   *
   * interface Cat {
   *   name: string
   *   age: number
   * }
   *
   * interface EventMap {
   *   'number': number
   *   'string': string
   *   'cat': Cat
   * }
   *
   * const emitter = new EventEmitter<EventMap>()
   * const onEventSubscription = emitter.onEvent(event => {
   *   console.log('event received', event)
   * })
   * const onDisposeSubscription = emitter.onDispose(() => {
   *   console.log('emitter disposed')
   * })
   * const onNumberSubscription = emitter.on('number', event => {
   *   console.log('number received', event)
   * })
   * const onStringSubscription = emitter.once('string', event => {
   *   console.log('string received', event)
   * })
   * const onCatSubscription = emitter.on('cat', event => {
   *   console.log('cat received', event)
   * })
   *
   * emitter.emit({
   *   type: 'cat',
   *   payload: {
   *     name: 'Bob',
   *     age: 7
   *   }
   * })
   *
   * onEventSubscription.dispose()
   *
   * emitter.emit({
   *   type: 'string',
   *   payload: 'This is a string'
   * })
   *
   * onCatSubscription.dispose()
   * onStringSubscription.dispose()
   *
   * emitter.emit({
   *   type: 'cat',
   *   payload: {
   *     name: 'Henry',
   *     age: 3
   *   }
   * })
   *
   * emitter.emit({
   *   type: 'number',
   *   payload: 23
   * })
   *
   * onNumberSubscription.dispose()
   *
   * emitter.emit({
   *   type: 'number',
   *   payload: 942
   * })
   *
   * emitter.dispose()
   * onDisposeSubscription.dispose()
   *
   * // outputs:
   * // event received: {
   * //   type: 'cat',
   * //   payload: {
   * //     name: 'Bob',
   * //     age: 7
   * //   }
   * // }
   * // cat received: { name: 'Bob', age: 7 }
   * // string received: 'This is a string'
   * // number received: 23
   * // emitter disposed
   */
  constructor() {
    this.__currentSubscriptionId = 0
    this.__state = {
      __isActive: true,
      __listeners: {}
    }
  }

  /**
   * Subscribe to the [stream distributor]{@link StreamDistributor}.
   * Once subscribed the callback methods of the streamListeners will be called
   * whenever the stream distributor receives a next, error or complete event
   * The only way to subscribe is to pass a [stream listeners]{@link StreamListeners} object.
   * Any values which were emitted before subscribing will not be passed to the listeners given -
   * only the new values which are emitted after subscribing will be emitted through the listeners
   * given. A subscription id will be returned which can then be used later to unsubscribe through the
   * `removeStreamListeners` function.
   *
   * The stream listeners object contains three properties:
   * First is the `onNextValue` function, which will be called whenever the stream distributor
   *   receives a new value
   * Second is the `onError` function, which will be called whenever the stream distributor
   *   receives an error
   * Finally is the `onComplete` function, which will be called only once when the stream distributor
   *   is marked as completed. Once it is marked as complete, no new values can be emitted even if
   *   `onNextValue`, `onEvent` or `onComplete` is called again.
   *
   * In order to unsubscribe, and by doing so not receive any more events through the listeners given,
   * pass the `subscriptionId` returned to the `removeStreamListeners` method.
   *
   * @param streamListeners The stream listeners which will be called when
   *   the [stream distributor]{@link StreamDistributor} receives a next, error
   *   or complete event
   * @returns The subscription id, which can be used as a token to unsubscribe from
   *   the [stream distributor]{@link StreamDistributor}
   *
   * @example <caption>Subscribing to a StreamDistributor with a onNextValue listener</caption>
   * const distributor = new StreamDistributor<number | string>()
   *
   * distributor.addStreamListeners({
   *   onNextValue(value: number): void {
   *     console.log('next value', value)
   *   }
   * })
   *
   * for (let i = 0; i < 4; i++) {
   *   distributor.onNextValue(i)
   * }
   * distributor.onNextValue('a string')
   *
   * // outputs:
   * // 0, 1, 2, 3, 'a string'
   *
   * @example <caption>Subscribing to a StreamDistributor</caption>
   * interface Person {
   *   name: string
   *   age: number
   * }
   *
   * const distributor = new StreamDistributor<Person>()
   *
   * distributor.addStreamListeners({
   *   onNextValue(person: Person): void {
   *     console.log('Person', person)
   *   },
   *   onError(error: any): void {
   *     console.error('error', error)
   *   },
   *   onComplete(): void {
   *     console.log('complete!')
   *   }
   * })
   *
   * try {
   *   distributor.onNextValue({
   *     name: 'Tim',
   *     age: 4
   *   })
   *   distributor.onNextValue({
   *     name: 'Bob',
   *     age: 17
   *   })
   *   throw new Error('HAHA! An error occurred!')
   * } catch (error) {
   *   distributor.onError(error)
   * }
   *
   * distributor.onComplete()
   *
   * // outputs:
   * // Person { name: 'Tim', age: 4 }
   * // Person { name: 'Bob', age: 17 }
   * // error, Error('HAHA! An error occurred')
   * // complete!
   *
   * @example <caption>Subscribing late to a distributor</caption>
   * const distributor = new StreamDistributor<number>()
   *
   * distributor.onNextValue(0)
   * distributor.onNextValue(1)
   * distributor.onError('An error occurred!')
   *
   * distributor.addStreamListeners({
   *   onNextValue(value: number): void {
   *     console.log('next value -', value)
   *   },
   *   onError(error: any): void {
   *     console.log('error -', error)
   *   },
   *   onComplete(): void {
   *     console.log('complete!')
   *   }
   * })
   *
   * distributor.onNextValue(2)
   * distributor.onNextValue(3)
   * distributor.onError(
   *   'Although this is not an error and is just a string, it is still passed as an error'
   * )
   * distributor.onNextValue(4)
   * distributor.onComplete()
   * distributor.onNextValue(5)
   *
   * // outputs:
   * // next value - 2
   * // next value - 3
   * // error - Although this is not an error and is just a string, it is still passed as an error
   * // next value - 4
   * // complete!
   *
   * // Notice how the 5 is not distributed as it was passed after the distributor completed
   *
   * @example <caption>Unsubscribing from a stream</caption>
   * const catNames = new StreamDistributor<name>()
   *
   * catNames.onNextValue('Mary')
   * catNames.onNextValue('Bob')
   *
   * const subscriptionId = catNames.addStreamListeners({
   *   onNextValue(catName: string) {
   *     console.log('catName - ', catName)
   *   }
   * })
   *
   * catNames.onNextValue('Rose')
   * catNames.onNextValue('Maria')
   *
   * catNames.removeStreamListeners(subscriptionId)
   *
   * catNames.onNextValue('Patrick')
   * catNames.onNextValue('Henry')
   *
   * // outputs:
   * // catName - Rose
   * // catName - Maria
   */
  public addStreamListeners(streamListeners: StreamListeners<T>): number {
    if (!this.__state.__isActive) {
      return -1
    }
    const subscriptionId = this.__currentSubscriptionId++
    this.__state.__listeners[subscriptionId] = streamListeners
    return subscriptionId
  }

  /**
   * Unsubscribes from the [stream distributor]{@link StreamDistributor}.
   * This means that the [stream listeners]{@link StreamListeners} associated with the `subscriptionId`
   * will no longer be called.
   *
   * Note that when a stream listener is cancelled, the `onComplete` listener is not called
   * as it is reserved for when the stream is completed, or disposed.
   *
   * @param subscriptionId The identifier of the subscription (kind of like a token)
   *   received when subscribing with the [stream listeners]{@link StreamListeners}
   *
   * @example <caption>Cancelling simple stream listeners straight away</caption>
   * const distributor = new StreamDistributor<number>()
   *
   * distributor.onNextValue(0)
   *
   * const subscriptionId = distributor.addStreamListeners({
   *   onNextValue(value: number): void {
   *     console.log('next value -', value)
   *   }
   * })
   *
   * distributor.removeStreamListeners(subscriptionId)
   *
   * distributor.onNextValue(1)
   * distributor.onNextValue(2)
   *
   * // outputs nothing, as the subscription was cancelled straight away
   *
   * @example <caption>Cancelling simple stream listeners</caption>
   * const distributor = new StreamDistributor<number>()
   *
   * distributor.onNextValue(0)
   * distributor.onNextValue(1)
   *
   * const subscriptionId = distributor.addStreamListeners({
   *   onNextValue(value: number): void {
   *     console.log('next value -', value)
   *   }
   * })
   *
   * distributor.onNextValue(2)
   * distributor.onNextValue(3)
   * distributor.onNextValue(4)
   *
   * distributor.removeStreamListeners(subscriptionId)
   *
   * distributor.onNextValue(5)
   * distributor.onNextValue(6)
   *
   * // outputs:
   * // next value - 2
   * // next value - 3
   * // next value - 4
   *
   * @example <caption>Cancelling stream listeners with an onComplete listener</caption>
   * // Note that this is a completely impractical use case
   *
   * interface Person {
   *   name: string
   *   age: number
   *   employmentStatus: 'Full Time' | 'Part Time' | 'Not Employed'
   * }
   *
   * const distributor = new StreamDistributor<Person>()
   *
   * const subscriptionId = distributor.addStreamListeners({
   *   onNextValue: console.log,
   *   onError: console.log,
   *   onComplete: console.log
   * })
   *
   * getJSON('/people', data => {
   *   // data - [null, { name: 'Henry', age: 56, employmentStatus: 'Not Employed' }, ...]
   *   data.forEach(person => {
   *     if (person == null) {
   *       distributor.onError(new Error('Person is null'))
   *     }
   *     distributor.onNextValue(person)
   *   })
   *
   *   distributor.removeStreamListeners(subscriptionId)
   *   distributor.onComplete()
   * })
   *
   * // outputs:
   * // Error('Person is null')
   * // { name: 'Henry', age: 56, employmentStatus: 'Not Employed' }
   * // ...
   *
   * // Note that the `onComplete` field is not called as the subscription was cancelled
   * // before the stream distributor was completed
   */
  public removeStreamListeners(subscriptionId: number): void {
    if (this.__state.__isActive) {
      delete this.__state.__listeners[subscriptionId]
    }
  }

  /**
   * Distributes the value to all of the listeners subscribed to the
   * [stream distributor]{@link StreamDistributor}. If the stream distributor
   * is already complete than no listeners will receive the value and a warning
   * will be logged.
   *
   * @param value The value to distribute
   *
   * @example <caption>Emitting a value to listeners</caption>
   * const delay = require('delay') // a promise delay (setTimeout(fn, time))
   * const distributor = new StreamDistributor<number>()
   *
   * (async function() {
   *   for (let i = 0;; i++) {
   *     await delay(1000)
   *     distributor.onNextValue(i)
   *   }
   * })()
   *
   * for (let i = 0; i < 2; i++) {
   *   distributor.addStreamListeners({
   *     onNextValue(value: number): void {
   *       console.log(`subscription #${i} received value ${value}`)
   *     }
   *   })
   * }
   *
   * // outputs:
   * // subscription #0 received value 0
   * // subscription #1 received value 0
   * // subscription #0 received value 1
   * // subscription #1 received value 1
   * // ...
   *
   * @example <caption>Emitting a value after a distributor is completed</caption>
   * const catNames = new StreamDistributor<string>()
   *
   * catNames.addStreamListeners({
   *   onNextValue(value: string): void {
   *     console.log('new cat name - ' + value)
   *   },
   *   onComplete(): void {
   *     console.log('completed')
   *   }
   * })
   *
   * catNames.onNextValue('Patrick')
   * catNames.onNextValue('Mary')
   * catNames.onComplete()
   * catNames.onNextValue('Bob')
   *
   * // outputs:
   * // new cat name - Patrick
   * // new cat name - Mary
   * // completed
   * // WARNING: [StreamDistributor] onNextValue was called with value Bob after
   * // the distributor was marked as completed
   */
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

  /**
   * Distributes the error to all of the listeners subscribed to the
   * [stream distributor]{@link StreamDistributor}. If the stream distributor
   * is already complete than no listeners will receive the error and a warning
   * will be logged.
   *
   * @param error The error to distribute
   *
   * @example <caption>Emitting an error to listeners</caption>
   * const faultyElectronics = new StreamDistributor<void>()
   */
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

  /**
   * Tells all of the listeners subscribed to the [stream distributor]{@link StreamDistributor}
   * that the stream is complete. Also deactivates the stream distributor
   */
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
