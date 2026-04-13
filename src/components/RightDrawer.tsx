import { useState } from 'react';
import type { OverlayItem } from '../types';
import type { ChatMessage } from '../types';
import { PropertiesPanel } from './PropertiesPanel';
import { ChatPanel } from './ChatPanel';

type RightDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  // Properties panel
  selectedObject: OverlayItem | null;
  onPatchObject: (patch: Partial<OverlayItem>) => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  // Chat panel
  activeSlideTitle: string;
  messages: ChatMessage[];
  chatBusy: boolean;
  onQuickAction: (message: string) => void;
  onSendMessage: (message: string) => void;
};

type DrawerTab = 'properties' | 'chat';

export function RightDrawer({
  isOpen,
  onClose,
  selectedObject,
  onPatchObject,
  onBringForward,
  onSendBackward,
  activeSlideTitle,
  messages,
  chatBusy,
  onQuickAction,
  onSendMessage,
}: RightDrawerProps) {
  const [tab, setTab] = useState<DrawerTab>('properties');

  return (
    <>
      {isOpen && <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />}
      <aside className={`right-drawer ${isOpen ? 'drawer-open' : ''}`} aria-hidden={!isOpen}>
        <div className="drawer-header">
          <div className="drawer-tabs">
            <button
              className={`drawer-tab ${tab === 'properties' ? 'drawer-tab-active' : ''}`}
              onClick={() => setTab('properties')}
            >
              Properties
            </button>
            <button
              className={`drawer-tab ${tab === 'chat' ? 'drawer-tab-active' : ''}`}
              onClick={() => setTab('chat')}
            >
              AI Chat ✦
            </button>
          </div>
          <button className="icon-button drawer-close" onClick={onClose} aria-label="Close panel">
            ×
          </button>
        </div>

        <div className="drawer-body">
          {tab === 'properties' ? (
            <PropertiesPanel
              selectedObject={selectedObject}
              onPatchObject={onPatchObject}
              onBringForward={onBringForward}
              onSendBackward={onSendBackward}
            />
          ) : (
            <ChatPanel
              activeSlideTitle={activeSlideTitle}
              messages={messages}
              busy={chatBusy}
              onQuickAction={onQuickAction}
              onSendMessage={onSendMessage}
            />
          )}
        </div>
      </aside>
    </>
  );
}
