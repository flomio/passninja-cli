import { Subscription } from 'rxjs'

declare type CleanUpFunction = () => any

export class CleanUpService {
  _items: CleanUpFunction[]

  constructor() {
    this._setup()
  }

  private _setup() {
    const processes = ['SIGTERM', 'SIGINT', 'SIGQUIT']

    processes.forEach((proc: NodeJS.Signals) => {
      process.on(proc, () => {
        this._items.forEach(fn => {
          try {
            fn()
          } catch (err) {
            console.error(`error cleaning up ${err.message}`)
          }
        })

        this._items = []
      })
    })
  }

  register = (fn: CleanUpFunction) => this._items.push(fn)
}
