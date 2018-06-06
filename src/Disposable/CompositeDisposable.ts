import { Disposable } from './Disposable'

export class CompositeDisposable implements Disposable {
  private __disposables: Set<Disposable>

  constructor(disposables?: Disposable[]) {
    this.__disposables = new Set<Disposable>(disposables)
  }

  public dispose(): void {
    if (this.__disposables.size > 0) {
      this.__disposables.forEach(disposable => {
        disposable.dispose()
      })
      this.__disposables.clear()
    }
  }

  public add(disposable: Disposable): void {
    this.__disposables.add(disposable)
  }

  public addAll(disposables: Disposable[]): void {
    for (let i = 0; i < disposables.length; i++) {
      this.__disposables.add(disposables[i])
    }
  }

  public remove(disposable: Disposable): void {
    this.__disposables.delete(disposable)
  }

  public removeAll(disposables: Disposable[]): void {
    for (let i = 0; i < disposables.length; i++) {
      this.__disposables.delete(disposables[i])
    }
  }

  public clear(): void {
    this.__disposables.clear()
  }
}
