import type { ChatMessage } from '../types';

type ChatPanelProps = {
  activeSlideTitle: string;
  messages: ChatMessage[];
  busy: boolean;
  onQuickAction: (message: string) => void;
  onSendMessage: (message: string) => void;
};

export function ChatPanel({
  activeSlideTitle,
  messages,
  busy,
  onQuickAction,
  onSendMessage,
}: ChatPanelProps) {
  return (
    <section className="chat-panel card">
      <div className="chat-panel-header">
        <div>
          <p className="eyebrow">Local assistant</p>
          <h2>Layout assistant</h2>
        </div>
        <span className="status-pill">{activeSlideTitle}</span>
      </div>
      <div className="chat-feature">
        <p className="eyebrow">Current brief</p>
        <p>Use the assistant as an editing partner: it inspects the live slide data, suggests structural improvements, and applies deterministic edits without calling a remote model.</p>
      </div>
      <p className="chat-scope-note">Thread is scoped to this slide so reviews and edits stay tied to the current composition.</p>
      <div className="quick-actions">
        {['Tidy the layout', 'Add a supporting callout', 'Suggest a stronger headline'].map((action) => (
          <button key={action} className="toolbar-chip" onClick={() => onQuickAction(action)}>{action}</button>
        ))}
      </div>
      <div className="chat-thread" role="log" aria-live="polite" aria-busy={busy}>
        {messages.map((message) => (
          <article key={message.id} className={`chat-bubble ${message.role}`}>
            <strong>{message.role === 'assistant' ? 'Assistant' : 'You'}</strong>
            <p>{message.text}</p>
          </article>
        ))}
        {busy ? (
          <div className="chat-bubble assistant">
            <strong>Assistant</strong>
            <p>Thinking through the current composition…</p>
          </div>
        ) : null}
      </div>
      <form
        className="chat-compose"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const value = String(form.get('message') ?? '');
          if (!value.trim()) return;
          onSendMessage(value);
          event.currentTarget.reset();
        }}
      >
        <label className="compose-label" htmlFor="chat-message">Message</label>
        <textarea
          id="chat-message"
          name="message"
          autoComplete="off"
          placeholder="Ask for a cleaner layout, a new callout, or a stronger headline…"
        />
        <button className="primary-button" type="submit" disabled={busy}>Send</button>
      </form>
    </section>
  );
}
