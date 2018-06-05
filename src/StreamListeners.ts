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
