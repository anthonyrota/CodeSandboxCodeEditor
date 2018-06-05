import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Stream, StreamSubscription, Operator } from './Stream'

function createInterval(delay?: number): Stream<undefined> {
  return new Stream(subject => {
    const intervalId = setInterval(() => subject.next(undefined), delay)

    return () => clearInterval(intervalId)
  })
}

function ofValues<T>(...values: T[]): Stream<T> {
  return new Stream<T>(subject => {
    values.forEach(subject.next)
  })
}

function merge<T>(...streams: Stream<T>[]): Stream<T> {
  return new Stream<T>(subject => {
    const subscriptions = streams.map(stream => stream.subscribe(subject))
    return () => subscriptions.forEach(subscription => subscription.dispose())
  })
}

function startWith<T>(...values: T[]): Operator<T, T> {
  return function(stream: Stream<T>): Stream<T> {
    return merge(ofValues(...values), stream)
  }
}

function map<T, U>(transform: (value: T) => U): Operator<T, U> {
  return function(stream: Stream<T>): Stream<U> {
    return new Stream<U>(subject => {
      const subscription = stream.subscribe(subject, {
        onNextValue: value => subject.next(transform(value))
      })
      return () => subscription.dispose()
    })
  }
}

function scan<T>(
  accumulate: (accumulatedValue: T, value: T, index: number) => T
): Operator<T, T>
function scan<T, U>(
  accumulate: (accumulatedValue: U, value: T, index: number) => U,
  seed: U
): Operator<T, U>
function scan<T, U>(
  accumulate: (accumulatedValue: U, value: T, index: number) => U,
  seed?: U
): Operator<T, U> {
  const hasSeed = arguments.length > 1
  return function(stream: Stream<T>) {
    let index = -1
    let accumulatedValue = seed
    return new Stream<U>(subject => {
      if (hasSeed) {
        subject.next(seed!)
        accumulatedValue = seed
        index++
      }
      const subscription = stream.subscribe(subject, {
        onNextValue: value => {
          index++
          if (index >= 1) {
            accumulatedValue = accumulate(accumulatedValue!, value, index)
            subject.next(accumulatedValue)
          } else {
            accumulatedValue = (value as any) as U
            subject.next(accumulatedValue)
          }
        }
      })
      return () => subscription.dispose()
    })
  }
}

function always<T>(value: T): () => T {
  return function() {
    return value
  }
}

interface ReactiveStreamRenderFunction<T> {
  (state: ReactiveStreamState<T>): React.ReactElement<any> | null
}

function add(a: number, b: number): number {
  return a + b
}

interface ReactiveStreamProps<T> {
  stream: Stream<T>
  initialValue?: T
  keepAlive?: boolean
  children: ReactiveStreamRenderFunction<T>
}

interface ReactiveStreamState<T> {
  value: T | null
  error: any
  hasError: boolean
  isComplete: boolean
  isActive: boolean
}

class ReactiveStream<T> extends React.Component<
  ReactiveStreamProps<T>,
  ReactiveStreamState<T>
> {
  subscription: StreamSubscription
  state: ReactiveStreamState<T>

  constructor(props: ReactiveStreamProps<T>, context: any) {
    super(props, context)

    this.onNextValue = this.onNextValue.bind(this)
    this.onError = this.onError.bind(this)
    this.onComplete = this.onComplete.bind(this)

    if (typeof props.initialValue !== 'undefined') {
      this.state = {
        value: props.initialValue,
        error: null,
        hasError: false,
        isComplete: false,
        isActive: true
      }
    } else {
      this.state = {
        value: null,
        error: null,
        hasError: false,
        isComplete: false,
        isActive: false
      }
    }
  }

  componentDidMount(): void {
    this.setState({
      isActive: true
    })
    this.updateStream(null)
  }

  componentDidUpdate(prevProps: ReactiveStreamProps<T>): void {
    this.updateStream(prevProps)
  }

  componentWillUnmount() {
    this.disposeStream(this.props)
  }

  updateStream(prevProps: ReactiveStreamProps<T> | null): void {
    if (!prevProps || this.props.stream !== prevProps.stream) {
      if (
        !prevProps ||
        (this.props.initialValue &&
          this.props.initialValue !== prevProps.initialValue)
      ) {
        this.setState({
          value:
            typeof this.props.initialValue !== 'undefined'
              ? this.props.initialValue
              : null,
          error: null,
          hasError: false,
          isComplete: false
        })
      }
      if (prevProps) {
        this.disposeStream(prevProps)
      }
      this.subscription = this.props.stream.subscribe({
        onNextValue: this.onNextValue,
        onError: this.onError,
        onComplete: this.onComplete
      })
    }
  }

  disposeStream(props: ReactiveStreamProps<T>) {
    this.subscription.dispose()
    if (!props.keepAlive) {
      props.stream.dispose()
    }
  }

  onNextValue(value: T) {
    this.setState({
      value,
      error: null,
      hasError: false,
      isComplete: false
    })
  }

  onError(error: any) {
    this.setState({
      error,
      hasError: true,
      isComplete: false
    })
  }

  onComplete() {
    this.setState({
      isComplete: true
    })
  }

  render() {
    return this.props.children(this.state)
  }
}

const ReactiveNumberStream = ReactiveStream as new () => ReactiveStream<number>

interface CounterProps {
  delay?: number
  initialValue?: number
}

const Counter = ({ delay = 1000, initialValue = 0 }: CounterProps) => (
  <ReactiveNumberStream
    stream={createInterval(delay).pipe(
      map(always(1)),
      startWith(initialValue),
      scan(add)
    )}
    initialValue={initialValue}
  >
    {state => <span>The value is {state.value}</span>}
  </ReactiveNumberStream>
)

ReactDOM.render(
  <React.StrictMode>
    {Array.from({ length: 10 }, (_, i) => (
      <React.Fragment key={i}>
        <Counter delay={Math.random() * 50} initialValue={0} />
        <br />
      </React.Fragment>
    ))}
  </React.StrictMode>,
  document.getElementById('root')
)
