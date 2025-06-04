export type Publisher<R extends Record<string, unknown>> = {
  emit<T extends keyof R>(event: T, payload: R[T]): void
}

export type Subscriber<R extends Record<string, unknown>> = {
  addEventListener<T extends keyof R>(
    event: T,
    callback: (payload: R[T]) => void
  ): void
  removeEventListener<T extends keyof R>(
    event: T,
    callback: (payload: R[T]) => void
  ): void
}

export class Emitter<R extends Record<string, unknown>>
  implements Publisher<R>, Subscriber<R>
{
  private listeners: Map<keyof R, Set<(payload: any) => void>> = new Map()

  constructor() {}

  addEventListener: Subscriber<R>['addEventListener'] = (event, callback) => {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event)!.add(callback)
  }

  removeEventListener: Subscriber<R>['removeEventListener'] = (
    event,
    callback
  ) => {
    this.listeners.get(event)?.delete(callback)
  }

  emit: Publisher<R>['emit'] = (event, payload) => {
    const listeners = this.listeners.get(event)
    if (!listeners) return
    for (const listener of listeners) {
      listener(payload)
    }
  }
}
