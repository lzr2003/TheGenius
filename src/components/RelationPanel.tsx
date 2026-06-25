import { relationLabel } from '../game/relations';
import { useGameStore } from '../store/gameStore';

export function RelationPanel() {
  const state = useGameStore((store) => store.state);
  const nameOf = (id: string) => state.players.find((player) => player.id === id)?.name ?? id;
  const relations = state.relationships
    .filter((relation) => relation.fromPlayerId === 'human' || relation.toPlayerId === 'human')
    .sort((a, b) => b.trust + b.alliance - b.betrayal - (a.trust + a.alliance - a.betrayal))
    .slice(0, 6);

  return (
    <section className="panel relation-panel">
      <div className="panel-title">信任 / 背叛关系</div>
      {relations.map((relation) => (
        <article className="relation-card" key={`${relation.fromPlayerId}-${relation.toPlayerId}`}>
          <div>
            <strong>{nameOf(relation.fromPlayerId)} → {nameOf(relation.toPlayerId)}</strong>
            <span>{relationLabel(relation)}</span>
          </div>
          <div className="relation-bars">
            <p>信任 {relation.trust}</p>
            <p>联盟 {relation.alliance}</p>
            <p>背叛 {relation.betrayal}</p>
          </div>
          {relation.notes.at(-1) && <small>{relation.notes.at(-1)}</small>}
        </article>
      ))}
    </section>
  );
}
