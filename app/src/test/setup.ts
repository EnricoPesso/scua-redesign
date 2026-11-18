import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { resetarDb } from '../features/extensoes/api/mocks/db';
import { resetarConfigAssistente } from '../features/assistente/preferencias';
import { resetarGrupos } from '../mock/grupos';
import { server } from './server';

// O primeiro render de cada arquivo carrega a casca e a tela sob demanda (lazy): 1 s é pouco.
configure({ asyncUtilTimeout: 8000 });

// Data fixa: segunda, 12/10/2026 às 10:00 (hora local). Só o Date é falso; timers continuam reais.
vi.useFakeTimers({ toFake: ['Date'] });
vi.setSystemTime(new Date('2026-10-12T10:00:00'));
// O mock foi importado antes de o relógio ser fixado: recria os dados de exemplo já na data fixa.
resetarDb();

// jsdom não implementa showModal/close do <dialog>.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
}
if (!HTMLDialogElement.prototype.close) {
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}

// Polyfills que o base-ui (Select, Toast, Checkbox…) espera do navegador e o jsdom não tem.
if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  });
}
if (!window.PointerEvent) {
  // @ts-expect-error — versão mínima, só para os eventos de ponteiro do user-event.
  window.PointerEvent = class PointerEvent extends MouseEvent {
    pointerId: number;
    pointerType: string;
    constructor(tipo: string, init: PointerEventInit = {}) {
      super(tipo, init);
      this.pointerId = init.pointerId ?? 1;
      this.pointerType = init.pointerType ?? 'mouse';
    }
  };
}
Element.prototype.scrollIntoView ??= function () {};
Element.prototype.getAnimations ??= () => [];
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.setPointerCapture ??= () => {};
Element.prototype.releasePointerCapture ??= () => {};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  // Os pedidos de exemplo leem o grupo de cada pessoa: os grupos voltam ao padrão antes deles.
  resetarGrupos();
  resetarDb();
  resetarConfigAssistente();
});
afterAll(() => server.close());
