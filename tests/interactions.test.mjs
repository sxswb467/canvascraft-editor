import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { JSDOM } from 'jsdom';
import { App } from '../.test-build/src/App.js';
import { createInitialEditorState, editorReducer } from '../.test-build/src/editor/editorState.js';

let domReady = false;
let testingLibraryPromise;

function installDom() {
  if (domReady) return;

  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://127.0.0.1:4177/',
    pretendToBeVisual: true,
  });

  Object.defineProperty(globalThis, 'window', { configurable: true, value: dom.window });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: dom.window.document });
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: dom.window.navigator });
  Object.defineProperty(globalThis, 'HTMLElement', { configurable: true, value: dom.window.HTMLElement });
  Object.defineProperty(globalThis, 'HTMLCanvasElement', { configurable: true, value: dom.window.HTMLCanvasElement });
  Object.defineProperty(globalThis, 'HTMLInputElement', { configurable: true, value: dom.window.HTMLInputElement });
  Object.defineProperty(globalThis, 'HTMLTextAreaElement', { configurable: true, value: dom.window.HTMLTextAreaElement });
  Object.defineProperty(globalThis, 'Node', { configurable: true, value: dom.window.Node });
  Object.defineProperty(globalThis, 'MutationObserver', { configurable: true, value: dom.window.MutationObserver });
  Object.defineProperty(globalThis, 'FormData', { configurable: true, value: dom.window.FormData });
  Object.defineProperty(globalThis, 'getComputedStyle', {
    configurable: true,
    value: dom.window.getComputedStyle.bind(dom.window),
  });
  Object.defineProperty(globalThis, 'PointerEvent', { configurable: true, value: dom.window.MouseEvent });
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', {
    configurable: true,
    writable: true,
    value: true,
  });
  Object.defineProperty(globalThis, 'requestAnimationFrame', {
    configurable: true,
    value: (callback) => setTimeout(() => callback(Date.now()), 0),
  });
  Object.defineProperty(globalThis, 'cancelAnimationFrame', {
    configurable: true,
    value: (handle) => clearTimeout(handle),
  });
  Object.defineProperty(globalThis, 'ResizeObserver', {
    configurable: true,
    value: class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  });

  Object.defineProperty(dom.window.HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get() {
      return this.classList?.contains('canvas-scroll') ? 960 : 1280;
    },
  });

  Object.defineProperty(dom.window.HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get() {
      return this.classList?.contains('canvas-scroll') ? 640 : 840;
    },
  });

  dom.window.HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
    const width = this.clientWidth || 1280;
    const height = this.clientHeight || 840;
    return {
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: width,
      bottom: height,
      width,
      height,
      toJSON() {
        return this;
      },
    };
  };

  dom.window.HTMLCanvasElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
    return {
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 960,
      bottom: 560,
      width: 960,
      height: 560,
      toJSON() {
        return this;
      },
    };
  };

  dom.window.HTMLCanvasElement.prototype.getContext = function getContext() {
    if (!this.__mockContext) {
      this.__mockContext = {
        canvas: this,
        fillStyle: '#000000',
        clearRect() {},
        drawImage() {},
        fillRect() {},
        getImageData(x, y, width, height) {
          return {
            data: new Uint8ClampedArray(Math.max(1, width * height * 4)),
            width,
            height,
          };
        },
        putImageData() {},
      };
    }
    return this.__mockContext;
  };

  Object.defineProperty(globalThis, 'Image', {
    configurable: true,
    value: class MockImage {
      constructor() {
        this.onload = null;
      }

      set src(value) {
        this._src = value;
        queueMicrotask(() => {
          this.onload?.();
        });
      }

      get src() {
        return this._src;
      }
    },
  });

  domReady = true;
}

async function loadTestingLibrary() {
  installDom();
  if (!testingLibraryPromise) {
    testingLibraryPromise = Promise.all([
      import('@testing-library/react'),
      import('@testing-library/user-event'),
    ]).then(([rtl, userEventModule]) => ({
      ...rtl,
      userEvent: userEventModule.default,
    }));
  }
  return testingLibraryPromise;
}

async function setupApp() {
  const { cleanup, render, screen, fireEvent, waitFor, within, userEvent } = await loadTestingLibrary();
  cleanup();
  window.localStorage.clear();
  document.body.innerHTML = '';
  const user = userEvent.setup();
  const utils = render(createElement(App));
  return { cleanup, fireEvent, screen, user, waitFor, within, ...utils };
}

function pointerEvent(type, init = {}) {
  return new window.PointerEvent(type, { bubbles: true, ...init });
}

test('top-level controls, slide selection, and slide creation are stateful', async () => {
  const { cleanup, screen, user } = await setupApp();

  assert.ok(screen.getByText('3 frames'));
  assert.ok(screen.getByText('Layout assistant'));
  assert.ok(screen.getByText('Redaction lab'));

  await user.click(screen.getByRole('button', { name: 'Hide right panel' }));
  assert.equal(screen.queryByText('Layout assistant'), null);

  await user.click(screen.getByRole('button', { name: 'Show right panel' }));
  assert.ok(screen.getByText('Layout assistant'));

  await user.click(screen.getByRole('button', { name: 'Hide redaction lab' }));
  assert.equal(screen.queryByText('Redaction lab'), null);

  await user.click(screen.getByRole('button', { name: 'Open redaction lab' }));
  assert.ok(screen.getByText('Redaction lab'));

  await user.click(screen.getByRole('button', { name: 'Add slide' }));
  assert.ok(screen.getByText('4 frames'));
  assert.ok(screen.getAllByText('Concept 4').length >= 1);

  await user.click(screen.getByRole('button', { name: 'Open Layout System' }));
  assert.ok(screen.getAllByText('Layout System').length >= 2);

  cleanup();
});

test('toolbar, zoom, layering, and property inputs all mutate live editor state', async () => {
  const { cleanup, container, fireEvent, screen, user, waitFor } = await setupApp();

  assert.ok(screen.getByText('3 live overlays'));
  assert.equal(screen.getByRole('button', { name: 'Snap' }).getAttribute('aria-pressed'), 'true');

  await user.click(screen.getByRole('button', { name: 'Callout' }));
  await waitFor(() => assert.ok(screen.getByText('4 live overlays')));

  const widthInput = screen.getByLabelText('Width');
  fireEvent.change(widthInput, { target: { value: '333' } });
  assert.equal(widthInput.value, '333');

  const selectedBefore = container.querySelector('.overlay-card.selected');
  const zBefore = selectedBefore?.style.zIndex;
  await user.click(screen.getByRole('button', { name: 'Send backward' }));
  await waitFor(() => {
    const selected = container.querySelector('.overlay-card.selected');
    assert.notEqual(selected?.style.zIndex, zBefore);
  });

  await user.click(screen.getByRole('button', { name: 'Bring forward' }));
  await waitFor(() => {
    const selected = container.querySelector('.overlay-card.selected');
    assert.equal(selected?.style.zIndex, zBefore);
  });

  await user.click(screen.getByRole('button', { name: 'Duplicate' }));
  await waitFor(() => assert.ok(screen.getByText('5 live overlays')));

  await user.click(screen.getByRole('button', { name: 'Delete' }));
  await waitFor(() => assert.ok(screen.getByText('4 live overlays')));

  await user.click(screen.getByRole('button', { name: 'Undo' }));
  await waitFor(() => assert.ok(screen.getByText('5 live overlays')));

  await user.click(screen.getByRole('button', { name: 'Redo' }));
  await waitFor(() => assert.ok(screen.getByText('4 live overlays')));

  const viewportStatus = () => screen.getByText((content) => /^Viewport \d+%$/.test(content));
  const zoomBefore = viewportStatus().textContent;
  await user.click(screen.getByRole('button', { name: '-' }));
  await waitFor(() => assert.notEqual(viewportStatus().textContent, zoomBefore));

  await user.click(screen.getByRole('button', { name: '100%' }));
  await waitFor(() => assert.equal(viewportStatus().textContent, 'Viewport 100%'));

  await user.click(screen.getByRole('button', { name: 'Frame' }));
  assert.ok(viewportStatus().textContent.startsWith('Viewport '));

  await user.click(screen.getByRole('button', { name: 'Snap' }));
  assert.equal(screen.getByRole('button', { name: 'Snap' }).getAttribute('aria-pressed'), 'false');

  cleanup();
});

test('chat actions and redaction controls are functional, while assistant replies remain scripted', async () => {
  const { cleanup, fireEvent, screen, user, waitFor } = await setupApp();

  await user.click(screen.getByRole('button', { name: 'Add a supporting callout' }));
  await waitFor(() => assert.ok(screen.getByText(/I added a supporting callout/i)));
  await waitFor(() => assert.ok(screen.getByText('4 live overlays')));

  const messageField = screen.getByLabelText('Message');
  await user.type(messageField, 'Hello there');
  await user.click(screen.getByRole('button', { name: 'Send' }));

  await waitFor(() => assert.ok(screen.getByText(/Local review for/)));

  const brushSlider = screen.getByLabelText('Brush size');
  fireEvent.change(brushSlider, { target: { value: '40' } });
  assert.ok(screen.getByText(/40px/));

  const restoreButton = screen.getByRole('button', { name: 'Restore' });
  assert.equal(restoreButton.disabled, true);

  const canvas = screen.getByLabelText('Interactive redaction canvas');
  canvas.dispatchEvent(pointerEvent('pointerdown', { clientX: 160, clientY: 160 }));
  canvas.dispatchEvent(pointerEvent('pointermove', { clientX: 220, clientY: 220 }));
  canvas.dispatchEvent(pointerEvent('pointerup', { clientX: 220, clientY: 220 }));
  await waitFor(() => assert.ok(screen.getByText('Redactions applied')));

  await user.click(screen.getByRole('button', { name: 'Reset' }));
  assert.equal(restoreButton.disabled, false);

  await user.click(screen.getByRole('button', { name: 'Restore' }));
  await waitFor(() => assert.ok(screen.getByText('Redactions applied')));
  assert.equal(screen.getByRole('button', { name: 'Restore' }).disabled, true);

  await user.click(screen.getByRole('button', { name: 'Blackout' }));
  assert.ok(screen.getByText(/Blackout brush · 40px/));

  cleanup();
});

test('canvas drag and resize handles update selected object geometry', async () => {
  const { cleanup, screen, waitFor } = await setupApp();

  const xInput = screen.getByLabelText('X');
  const widthInput = screen.getByLabelText('Width');
  const initialX = Number(xInput.value);
  const initialWidth = Number(widthInput.value);

  const dragHandle = screen.getAllByRole('button', { name: 'Drag' })[0];
  dragHandle.dispatchEvent(pointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
  window.dispatchEvent(pointerEvent('pointermove', { clientX: 172, clientY: 148 }));
  window.dispatchEvent(pointerEvent('pointerup', { clientX: 172, clientY: 148 }));

  await waitFor(() => assert.notEqual(Number(screen.getByLabelText('X').value), initialX));

  const resizeHandle = screen.getByRole('button', { name: 'Resize text' });
  resizeHandle.dispatchEvent(pointerEvent('pointerdown', { clientX: 200, clientY: 200 }));
  window.dispatchEvent(pointerEvent('pointermove', { clientX: 280, clientY: 240 }));
  window.dispatchEvent(pointerEvent('pointerup', { clientX: 280, clientY: 240 }));

  await waitFor(() => assert.notEqual(Number(screen.getByLabelText('Width').value), initialWidth));

  cleanup();
});

test('slide reorder is backed by real state transitions', () => {
  const initial = createInitialEditorState();
  const [first, second] = initial.present.slides;
  const next = editorReducer(initial, {
    type: 'reorder-slides',
    activeId: first.id,
    overId: second.id,
  });

  assert.equal(next.present.slides[0].id, second.id);
  assert.equal(next.present.slides[1].id, first.id);
});
