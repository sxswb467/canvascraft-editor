import type { OverlayItem, OverlayKind, Slide } from '../types';

export type AssistantOperation =
  | { type: 'rewrite-object'; objectId: string; text: string }
  | { type: 'add-object'; kind: OverlayKind; preset?: Partial<OverlayItem> }
  | { type: 'tidy-layout' };

export type AssistantReply = {
  text: string;
  operations: AssistantOperation[];
};

export function buildAssistantReply(message: string, slide: Slide): AssistantReply {
  const intent = detectIntent(message);

  if (intent === 'headline') {
    const primaryText = getPrimaryTextObject(slide);
    const headline = createHeadline(slide, primaryText?.text ?? slide.title);

    if (primaryText) {
      return {
        operations: [{ type: 'rewrite-object', objectId: primaryText.id, text: headline }],
        text: `I rewrote the lead copy from the current slide content. New headline: “${headline}”`,
      };
    }

    return {
      operations: [
        {
          type: 'add-object',
          kind: 'text',
          preset: {
            text: headline,
            width: 620,
            height: 140,
            color: '#111827',
          },
        },
      ],
      text: `I added a headline block based on this slide’s theme: “${headline}”`,
    };
  }

  if (intent === 'callout') {
    const calloutText = createCallout(slide);
    return {
      operations: [
        {
          type: 'add-object',
          kind: 'callout',
          preset: {
            text: calloutText,
            width: 320,
            height: 130,
            color: slide.accent,
          },
        },
      ],
      text: `I added a supporting callout drawn from the current slide structure: “${calloutText}”`,
    };
  }

  if (intent === 'sticky') {
    const stickyText = createSticky(slide);
    return {
      operations: [
        {
          type: 'add-object',
          kind: 'sticky',
          preset: {
            text: stickyText,
            width: 240,
            height: 180,
            color: '#f59e0b',
          },
        },
      ],
      text: `I added a review note based on the current composition: “${stickyText.replace(/\n/g, ' / ')}”`,
    };
  }

  if (intent === 'tidy') {
    const review = reviewSlide(slide);
    return {
      operations: slide.objects.length > 1 ? [{ type: 'tidy-layout' }] : [],
      text:
        slide.objects.length > 1
          ? `I reflowed the slide into a cleaner grid. ${review.nextMove}`
          : `There is only one block on this slide, so I left the layout in place. ${review.nextMove}`,
    };
  }

  const review = reviewSlide(slide);
  return {
    operations: [],
    text: `Local review for “${slide.title}”: ${review.summary} Next move: ${review.nextMove}`,
  };
}

function detectIntent(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes('headline') || lower.includes('title')) return 'headline';
  if (lower.includes('callout') || lower.includes('annotation') || lower.includes('support')) return 'callout';
  if (lower.includes('sticky') || lower.includes('note')) return 'sticky';
  if (lower.includes('tidy') || lower.includes('organize') || lower.includes('align') || lower.includes('layout')) return 'tidy';
  return 'review';
}

function getPrimaryTextObject(slide: Slide) {
  return slide.objects
    .filter((item) => item.kind === 'text')
    .sort((left, right) => right.width - left.width || left.y - right.y)[0];
}

function createHeadline(slide: Slide, sourceText: string) {
  const title = normalizePhrase(slide.title);
  const source = normalizePhrase(sourceText);
  const sentence = [source, title].find(Boolean) ?? 'Sharpen the narrative';
  const trimmed = sentence.split(/[.!?]/)[0].split(/\s+/).slice(0, 9).join(' ');
  const candidate = trimmed || 'Sharpen the narrative';
  return capitalize(candidate.replace(/\s+/g, ' ').trim());
}

function createCallout(slide: Slide) {
  const primaryText = getPrimaryTextObject(slide)?.text ?? slide.title;
  const lead = normalizePhrase(primaryText).split(/\s+/).slice(0, 6).join(' ');
  return `Support the lead with one proof point tied to ${lead || normalizePhrase(slide.title).toLowerCase()}.`;
}

function createSticky(slide: Slide) {
  const review = reviewSlide(slide);
  return `Review next\n${review.shortMove}`;
}

function reviewSlide(slide: Slide) {
  const counts = {
    text: slide.objects.filter((item) => item.kind === 'text').length,
    callout: slide.objects.filter((item) => item.kind === 'callout').length,
    sticky: slide.objects.filter((item) => item.kind === 'sticky').length,
  };
  const primaryText = getPrimaryTextObject(slide);
  const concerns: string[] = [];

  if (slide.objects.length === 0) {
    concerns.push('the canvas is still blank');
  }

  if (primaryText && primaryText.text.replace(/\s+/g, ' ').trim().length > 72) {
    concerns.push('the lead copy is dense for a first read');
  }

  if (counts.callout === 0) {
    concerns.push('there is no secondary support block yet');
  }

  const horizontalCenters = slide.objects.map((item) => item.x + item.width / 2);
  const averageCenter =
    horizontalCenters.length > 0
      ? horizontalCenters.reduce((total, value) => total + value, 0) / horizontalCenters.length
      : 0;

  if (horizontalCenters.length > 1 && averageCenter < 900) {
    concerns.push('the composition is weighted to the left side');
  }

  if (counts.sticky > 1) {
    concerns.push('multiple sticky notes are competing with the main story');
  }

  const summary = `I found ${slide.objects.length} blocks (${counts.text} text, ${counts.callout} callout, ${counts.sticky} sticky), and ${concerns.slice(0, 2).join(' plus ') || 'the hierarchy is reasonably balanced'}.`;
  const nextMove =
    counts.callout === 0
      ? 'Add one supporting callout so the primary statement has evidence beside it.'
      : primaryText && primaryText.text.length > 72
        ? 'Shorten the headline so the main idea lands in one pass.'
        : averageCenter < 900
          ? 'Shift one element rightward so the canvas feels less left-heavy.'
          : 'Tidy spacing to keep the reading path calm.';

  return {
    summary,
    nextMove,
    shortMove: nextMove.replace(/\.$/, '').slice(0, 40),
  };
}

function normalizePhrase(text: string) {
  return text
    .replace(/\n/g, ' ')
    .replace(/[“”"']/g, '')
    .replace(/[^\w\s&/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function capitalize(text: string) {
  return text ? text[0].toUpperCase() + text.slice(1) : text;
}
