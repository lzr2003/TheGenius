import { useState } from 'react';
import { shortTime } from '../utils/format';
import { useGameStore } from '../store/gameStore';

export function ChatPanel() {
  const { state, sendChat } = useGameStore();
  const [content, setContent] = useState('');
  const [mode, setMode] = useState<'public' | 'private'>('public');
  const [targetPlayerId, setTargetPlayerId] = useState('');
  const [claimedNumber, setClaimedNumber] = useState<number | ''>('');
  const human = state.players.find((player) => player.id === 'human');
  const privateTargets = state.players.filter((player) => player.id !== 'human' && player.status !== 'eliminated');
  const nameOf = (id: string) => state.players.find((player) => player.id === id)?.name ?? id;
  const visibleMessages = state.chatMessages.filter((message) => !message.channel || message.channel === 'public' || message.playerId === 'human' || message.toPlayerId === 'human').slice(-8);

  function send() {
    const toPlayerId = mode === 'private' ? targetPlayerId || privateTargets[0]?.id : undefined;
    const claimed = mode === 'private' && claimedNumber !== '' ? Number(claimedNumber) : undefined;
    const trimmed = content.trim();
    if (!trimmed && typeof claimed !== 'number') return;
    sendChat(trimmed, toPlayerId, claimed);
    setContent('');
    setClaimedNumber('');
  }

  return (
    <section className="panel chat-panel">
      <div className="panel-title">公共 / 私聊</div>
      <div className="chat-list">
        {visibleMessages.map((message) => (
          <div className="chat-message" key={message.id}>
            <span>
              {shortTime(message.createdAt)} · {message.channel === 'private' ? `私聊 ${nameOf(message.playerId)} → ${message.toPlayerId ? nameOf(message.toPlayerId) : '-'}` : nameOf(message.playerId)}
            </span>
            <p>{message.content}</p>
            {message.channel === 'private' && typeof message.claimedSecretNumber === 'number' && (
              <small>声称秘密数字：{message.claimedSecretNumber}</small>
            )}
          </div>
        ))}
      </div>
      <div className="chat-compose">
        <div className="chat-options">
          <select value={mode} onChange={(event) => setMode(event.target.value as 'public' | 'private')}>
            <option value="public">公共发言</option>
            <option value="private">私聊</option>
          </select>
          {mode === 'private' && (
            <select value={targetPlayerId || privateTargets[0]?.id ?? ''} onChange={(event) => setTargetPlayerId(event.target.value)}>
              {privateTargets.map((target) => <option value={target.id} key={target.id}>{target.name}</option>)}
            </select>
          )}
        </div>
        {mode === 'private' && (
          <div className="chat-options">
            <input type="number" min={1} max={9} value={claimedNumber} onChange={(event) => setClaimedNumber(event.target.value ? Number(event.target.value) : '')} placeholder="可选：声称数字" />
            <button onClick={() => setClaimedNumber(human?.secretNumber ?? '')}>填入真实数字</button>
          </div>
        )}
        <div className="chat-input">
          <input value={content} onChange={(event) => setContent(event.target.value)} placeholder={mode === 'private' ? '输入私聊内容，可真可假' : '输入公共发言'} />
          <button onClick={send}>发送</button>
        </div>
      </div>
    </section>
  );
}
