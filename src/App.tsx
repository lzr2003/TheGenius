import { useState } from 'react';
import { PlayerPanel } from './components/PlayerPanel';
import { RulePanel } from './components/RulePanel';
import { TradePanel } from './components/TradePanel';
import { ActionPanel } from './components/ActionPanel';
import { ChatPanel } from './components/ChatPanel';
import { DeathMatchPanel } from './components/DeathMatchPanel';
import { ResultPanel } from './components/ResultPanel';
import { SafetyPanel } from './components/SafetyPanel';
import { useGameStore } from './store/gameStore';
import { isSoundEnabled, playSfx, setSoundEnabled } from './utils/audio';

const phaseNames: Record<string, string> = {
  setup: '玩家配置',
  rule: '规则公布',
  discussion: '自由交流',
  trade: '秘密交易',
  action: '行动提交',
  settlement: '结算',
  safety: '安全权',
  deathmatch_select: '死亡竞赛选择',
  deathmatch: '死亡竞赛',
  elimination: '淘汰结算',
  finished: '比赛结束',
};

function App() {
  const { state, createNewGame, advancePhase, saveGame, loadGame } = useGameStore();
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  function toggleSound() {
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundOn(next);
    if (next) playSfx('phase');
  }

  return (
    <main className="app-shell common-game-shell">
      <header className="game-header">
        <div className="brand-block">
          <p className="eyebrow">Mind Arena / 智谋竞技场</p>
          <h1>心理博弈桌游客户端原型</h1>
          <p className="subtitle">公开规则、隐藏信息、晶石交易、安全权赠送、死亡竞赛与淘汰制。AI 会在内部参考信任与背叛关系。</p>
        </div>
        <div className="header-actions">
          <button onClick={() => createNewGame(9)}>新开 9 人局</button>
          <button onClick={loadGame}>读取存档</button>
          <button onClick={saveGame}>保存</button>
          <button onClick={toggleSound}>{soundOn ? '音效：开' : '音效：关'}</button>
        </div>
      </header>

      <section className="status-strip panel">
        <div><span>回合</span><strong>{state.round}</strong></div>
        <div><span>当前阶段</span><strong>{phaseNames[state.phase]}</strong></div>
        <div><span>存活玩家</span><strong>{state.players.filter((player) => player.status !== 'eliminated').length}</strong></div>
        <button onClick={advancePhase}>推进阶段</button>
      </section>

      <section className="game-layout common-game-layout">
        <aside className="left-rail layout-region"><PlayerPanel /></aside>
        <section className="main-stage layout-region">
          {state.phase === 'safety' ? <SafetyPanel /> : state.phase === 'deathmatch' ? <DeathMatchPanel /> : <ActionPanel />}
        </section>
        <aside className="right-rail layout-region"><RulePanel /><TradePanel /></aside>
        <section className="bottom-console layout-region"><ResultPanel /><ChatPanel /></section>
      </section>
    </main>
  );
}

export default App;
