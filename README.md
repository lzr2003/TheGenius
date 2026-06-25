# Mind Arena / 智谋竞技场

Mind Arena is a cross-platform desktop prototype for a psychological strategy board-game client.

It is inspired by social strategy competition mechanics such as public rules, private information, negotiation, trade, safety tokens, death matches, and elimination, without copying any show names, logos, characters, or specific copyrighted games.

## Tech stack

- Tauri 2.x
- Rust
- React
- TypeScript
- Vite
- Zustand
- Tailwind CSS
- Browser Web Audio API procedural sound effects

## Current gameplay mechanics

- Round phase flow: rules, discussion, trade, action, settlement, safety, death match selection, death match, elimination.
- Secret Number Market main game: each player has crystals and a hidden number; asset score is crystals plus hidden number.
- Real trade settlement: accepted trades transfer crystals and can reveal hidden-number information to each side.
- Hidden AI relationship model: each directed player relationship tracks trust, betrayal, alliance score, and recent notes for AI decisions only.
- Safety token gifting: the main-game winner stays safe and can gift a safety token to another active player.
- AI personality rules: rational, deceptive, cooperative, risky, and conservative AI players use action, chat, trade, and safety-gift decisions based on hidden relationship values.
- Death Match: a five-round psychological number guessing duel that eliminates the loser.
- Procedural UI sound effects for clicks, phase changes, submissions, settlement, trade, safety, death match, and elimination.
- Local save/load through Tauri commands.

## Development

```bash
npm install
npm run dev
```

## Tauri desktop mode

```bash
npm run tauri dev
```

## Build

```bash
npm run tauri build
```

The first version runs as a local single-player simulation with AI players. Network multiplayer can be added later through a dedicated server or peer session layer.
