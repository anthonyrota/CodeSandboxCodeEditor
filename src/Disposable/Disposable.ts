export interface Disposable {
  dispose(): void
}

export function isDisposable(value: any): value is Disposable {
  return value && typeof value.dispose === 'function'
}
