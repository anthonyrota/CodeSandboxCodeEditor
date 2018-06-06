import { StreamDistributor } from './StreamDistributor'

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
