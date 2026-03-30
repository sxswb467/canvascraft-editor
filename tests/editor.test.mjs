import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { App } from '../.test-build/src/App.js';
import { buildAssistantReply } from '../.test-build/src/editor/assistant.js';
import {
  createInitialEditorState,
  editorReducer,
  getActiveSlide,
} from '../.test-build/src/editor/editorState.js';

test('adds a slide and selects it', () => {
  const initial = createInitialEditorState();
  const next = editorReducer(initial, { type: 'add-slide' });

  assert.equal(next.present.slides.length, initial.present.slides.length + 1);
  assert.equal(next.present.activeSlideId, next.present.slides.at(-1)?.id);
  assert.equal(next.present.selectedObjectId, next.present.slides.at(-1)?.objects[0]?.id);
});

test('deletes the selected object from the active slide', () => {
  const initial = createInitialEditorState();
  const activeBefore = getActiveSlide(initial.present);
  const next = editorReducer(initial, { type: 'delete-selected-object' });
  const activeAfter = getActiveSlide(next.present);

  assert.equal(activeAfter.objects.length, activeBefore.objects.length - 1);
  assert.equal(
    activeAfter.objects.some((item) => item.id === initial.present.selectedObjectId),
    false,
  );
});

test('tidy layout rearranges objects into a cleaner grid', () => {
  const initial = createInitialEditorState();
  const next = editorReducer(initial, { type: 'tidy-layout' });
  const activeSlide = getActiveSlide(next.present);

  assert.deepEqual(
    activeSlide.objects.slice(0, 3).map((item) => ({ x: item.x, y: item.y })),
    [
      { x: 260, y: 180 },
      { x: 820, y: 180 },
      { x: 260, y: 430 },
    ],
  );
});

test('app render includes core accessibility hooks and product panels', () => {
  const markup = renderToString(createElement(App));

  assert.match(markup, /aria-label="Collapse slide list"/);
  assert.match(markup, /Properties/);
  assert.match(markup, /Message/);
  assert.match(markup, /Interactive redaction canvas/);
});

test('local assistant can rewrite a headline based on live slide content', () => {
  const initial = createInitialEditorState();
  const slide = getActiveSlide(initial.present);
  const reply = buildAssistantReply('suggest a stronger headline', slide);

  assert.equal(reply.operations[0]?.type, 'rewrite-object');
  assert.match(reply.text, /rewrote the lead copy/i);
});

test('local assistant can review a slide without pretending to call a model', () => {
  const initial = createInitialEditorState();
  const slide = getActiveSlide(initial.present);
  const reply = buildAssistantReply('what do you think?', slide);

  assert.deepEqual(reply.operations, []);
  assert.match(reply.text, /Local review for/);
});
