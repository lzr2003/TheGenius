import { useState } from 'react';
import { shortTime } from '../utils/format';
import { useGameStore } from '../store/gameStore';

export function ChatPanel() {
  const { state, sendChat } = useGameStore();
  const [content, setContent] = useState('');
  const nameOf = (id: string) => state.players.find((player) => player.id === id)?.name ?? id;

  return (
    <section className="panel chat-panel">
      <div className="panel-title">公共发言</div>
      <div className="chat-list">
        {state.chatMessages.slice(-6).map((message) => (
          <div className="chat-message" key={message.id}>
            <span>{shortTime(message.createdAt)} · {nameOf(message.playerId)}</span>
            <p>{message.content}</p>
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input value={content} onChange={(event) => setContent(event.target.value)} placeholder="输入发言或谈判信息" />
        <button onClick={() => { if (content.trim()) { sendChat(content.trim()); setContent(''); } }}>发送</button>
      </div>
    </section>
  );
}
