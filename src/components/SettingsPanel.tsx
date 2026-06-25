import { RulePanel } from './RulePanel';

type SettingsPanelProps = {
  open: boolean;
  soundOn: boolean;
  onClose: () => void;
  onToggleSound: () => void;
  onNewGame: () => void;
  onSave: () => Promise<void>;
  onLoad: () => Promise<void>;
};

export function SettingsPanel({
  open,
  soundOn,
  onClose,
  onToggleSound,
  onNewGame,
  onSave,
  onLoad,
}: SettingsPanelProps) {
  if (!open) return null;

  async function runAndKeepOpen(action: () => void | Promise<void>) {
    await action();
  }

  return (
    <div className="settings-overlay" role="presentation" onMouseDown={onClose}>
      <aside className="settings-drawer" role="dialog" aria-modal="true" aria-label="游戏设置" onMouseDown={(event) => event.stopPropagation()}>
        <header className="settings-header">
          <div>
            <p className="eyebrow">SYSTEM</p>
            <h2>设置</h2>
          </div>
          <button className="settings-close-button" onClick={onClose} aria-label="关闭设置">×</button>
        </header>

        <section className="settings-section">
          <div className="panel-title">游戏操作</div>
          <div className="settings-action-grid">
            <button onClick={() => runAndKeepOpen(onNewGame)}>新开 9 人局</button>
            <button onClick={() => runAndKeepOpen(onSave)}>保存存档</button>
            <button onClick={() => runAndKeepOpen(onLoad)}>读取存档</button>
            <button onClick={onToggleSound}>{soundOn ? '关闭音效' : '开启音效'}</button>
          </div>
        </section>

        <section className="settings-section settings-rule-section">
          <RulePanel />
        </section>
      </aside>
    </div>
  );
}
