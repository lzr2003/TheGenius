import { PlayerPanel } from './components/PlayerPanel';
import { RulePanel } from './components/RulePanel';
import { TradePanel } from './components/TradePanel';
import { ActionPanel } from './components/ActionPanel';
import { ChatPanel } from './components/ChatPanel';
import { DeathMatchPanel } from './components/DeathMatchPanel';
import { ResultPanel } from './components/ResultPanel';
import { RelationPanel } from './components/RelationPanel';
import { SafetyPanel } from './components/SafetyPanel';
import { useGameStore } from './store/gameStore';

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

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Mind Arena / 智谋竞技场</p>
          <h1>心理博弈桌游客户端原型</h1>
          <p className="subtitle">公开规则、隐藏信息、晶石交易、信任背叛、安全权赠送、死亡竞赛与淘汰制。</p>
        </div>
        <div className="hero-actions">
          <button onClick={() => createNewGame(9)}>新开 9 人局</button>
          <button onClick={loadGame}>读取存档</button>
          <button onClick={saveGame}>保存</button>
        </div>
      </section>

      <section className="topbar panel">
        <div>
          <span>回合</span>
          <strong>{state.round}</strong>
        </div>
        <div>
          <span>当前阶段</span>
          <strong>{phaseNames[state.phase]}</strong>
        </div>
        <div>
          <span>存活玩家</span>
          <strong>{state.players.filter((player) => player.status !== 'eliminated').length}</strong>
        </div>
        <button onClick={advancePhase}>推进阶段</button>
      </section>

      <section className="game-grid">
        <PlayerPanel />
        <section className="center-stack">
          <RulePanel />
          {state.phase === 'safety' ? <SafetyPanel /> : state.phase === 'deathmatch' ? <DeathMatchPanel /> : <ActionPanel />}
          <ResultPanel />
        </section>
        <section className="right-stack">
          <TradePanel />
          <ChatPanel />
          <RelationPanel />
        </section>
      </section>
    </main>
  );
}

export default App;
