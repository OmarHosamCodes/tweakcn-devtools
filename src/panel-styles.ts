export const panelStyles = `:host {
  all: initial;
}

.td-root {
  --td-bg: #141414;
  --td-elev: #1c1c1c;
  --td-line: #3f3f46;
  --td-text: #f4f4f5;
  --td-muted: #a1a1aa;
  --td-fill: #fafafa;
  --td-fill-fg: #18181b;
  --td-danger: #fca5a5;
  --td-z: 2147483646;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 12.5px;
  line-height: 1.35;
  color: var(--td-text);
  -webkit-font-smoothing: antialiased;
}

.td-root *,
.td-root *::before,
.td-root *::after {
  box-sizing: border-box;
}

.td-root button,
.td-root input {
  font: inherit;
  color: inherit;
}

.td-toggle {
  position: fixed;
  bottom: 16px;
  left: 16px;
  z-index: var(--td-z);
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border: 1px solid var(--td-line);
  border-radius: 10px;
  background: var(--td-bg);
  color: var(--td-text);
  box-shadow: 0 10px 28px rgb(0 0 0 / 0.35);
  cursor: pointer;
}

.td-toggle:hover {
  border-color: #52525b;
}

.td-toggle:focus-visible,
.td-btn:focus-visible,
.td-tab:focus-visible,
.td-card:focus-visible,
.td-search:focus-visible {
  outline: 2px solid var(--td-text);
  outline-offset: 2px;
}

.td-dock {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--td-z);
  display: flex;
  flex-direction: column;
  height: min(52vh, 480px);
  min-height: 360px;
  background: var(--td-bg);
  border-top: 1px solid var(--td-line);
  box-shadow: 0 -18px 40px rgb(0 0 0 / 0.28);
}

.td-search-wrap {
  flex: 1 1 180px;
  min-width: 180px;
  max-width: 420px;
}

.td-search-label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

.td-search {
  width: 100%;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #52525b;
  border-radius: 8px;
  background: #0c0c0d;
  color: var(--td-text);
}

.td-search::placeholder {
  color: var(--td-muted);
}

.td-cluster {
  display: flex;
  gap: 4px;
  flex: 0 0 auto;
}

.td-btn,
.td-tab {
  height: 32px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--td-muted);
  cursor: pointer;
  white-space: nowrap;
}

.td-btn:hover,
.td-tab:hover {
  color: var(--td-text);
  background: var(--td-elev);
}

.td-btn[data-active="true"],
.td-tab[data-active="true"] {
  color: var(--td-fill-fg);
  background: var(--td-fill);
}

.td-btn:disabled,
.td-tab:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.td-list {
  flex: 1;
  overflow: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(176px, 1fr));
  gap: 12px;
  align-content: start;
  padding: 16px;
}

.td-card,
.td-skeleton {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 128px;
  overflow: hidden;
  border: 1px solid var(--td-line);
  border-radius: 10px;
  background: var(--td-elev);
  text-align: left;
  padding: 0;
  cursor: pointer;
  color: inherit;
}

.td-card[data-active="true"] {
  border-color: var(--td-text);
  background: #27272a;
  box-shadow: inset 4px 0 0 var(--td-fill), 0 8px 18px rgb(0 0 0 / 0.24);
  transform: translateY(-1px);
}

.td-preview {
  height: 78px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 6px;
}

.td-chip {
  height: 8px;
  width: 42%;
  border-radius: 999px;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.18);
}

.td-barline {
  height: 6px;
  width: 72%;
  border-radius: 999px;
  opacity: 0.9;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.12);
}

.td-meta {
  padding: 10px 11px 11px;
}

.td-name {
  font-weight: 600;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.td-sub {
  margin-top: 2px;
  color: var(--td-muted);
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.td-empty,
.td-error {
  grid-column: 1 / -1;
  margin: 12px 4px;
  color: var(--td-muted);
}

.td-error {
  color: var(--td-danger);
}

.td-skeleton .td-preview,
.td-skeleton .td-meta {
  background: linear-gradient(90deg, #222 25%, #2a2a2a 37%, #222 63%);
  background-size: 400% 100%;
}

@media (prefers-reduced-motion: no-preference) {
  .td-btn,
  .td-tab,
  .td-toggle,
  .td-card {
    transition: background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease,
      color 160ms ease, transform 160ms ease;
  }
  .td-skeleton .td-preview,
  .td-skeleton .td-meta {
    animation: td-shimmer 1.2s ease-in-out infinite;
  }
}

@keyframes td-shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}

.td-foot {
  display: grid;
  gap: 7px;
  padding: 9px 12px 8px;
  border-top: 1px solid var(--td-line);
  color: var(--td-muted);
  font-size: 11px;
}

.td-foot-controls {
  display: grid;
  grid-template-columns: minmax(320px, 1fr) auto;
  align-items: center;
  gap: 12px;
}

.td-foot-discovery,
.td-foot-actions,
.td-foot-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.td-foot-discovery {
  min-width: 0;
}

.td-foot-actions {
  justify-content: flex-end;
}

.td-foot-status {
  justify-content: space-between;
  min-height: 18px;
}

.td-foot-status .td-btn {
  padding: 0 8px;
  font-size: 11px;
}

.td-extended {
  position: fixed;
  inset: 0;
  z-index: var(--td-z);
  pointer-events: none;
}

.td-editor {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  background: transparent;
  pointer-events: auto;
}

.td-editor-actions {
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: calc(var(--td-z) + 1);
  display: flex;
  gap: 4px;
  pointer-events: auto;
}

.td-editor-actions .td-btn {
  background: var(--td-bg);
  border-color: var(--td-line);
  color: var(--td-text);
}

@media (max-width: 720px) {
  .td-dock {
    height: min(68vh, 560px);
    min-height: 420px;
  }
  .td-list {
    grid-template-columns: repeat(auto-fill, minmax(152px, 1fr));
    padding: 12px;
  }
  .td-foot-controls {
    grid-template-columns: 1fr;
    gap: 7px;
  }
  .td-foot-discovery,
  .td-foot-actions {
    flex-wrap: wrap;
  }
  .td-foot-actions {
    justify-content: space-between;
  }
  .td-foot-discovery .td-search-wrap {
    flex: 1 1 180px;
    max-width: none;
  }
  .td-toggle {
    width: 44px;
    height: 44px;
  }
}
`;
