import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Data fixa: segunda, 12/10/2026 às 10:00 (hora local). Só o Date é falso; timers continuam reais.
vi.useFakeTimers({ toFake: ['Date'] })
vi.setSystemTime(new Date('2026-10-12T10:00:00'))

// jsdom não implementa showModal/close do <dialog>.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
}
if (!HTMLDialogElement.prototype.close) {
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}

afterEach(() => cleanup())
