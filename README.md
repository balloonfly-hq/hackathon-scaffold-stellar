# 🎈 BalloonFly

A provably fair crash game built on Stellar blockchain using Scaffold Stellar.

![Stellar](https://img.shields.io/badge/Stellar-Soroban-7B3FE4)
![Rust](https://img.shields.io/badge/Rust-Smart_Contracts-orange)
![React](https://img.shields.io/badge/React-18+-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6)

## 🎯 What is BalloonFly?

BalloonFly is a multiplayer crash-style betting game where:

- 🎈 Players place bets before the balloon takes off
- 📈 The multiplier grows continuously as the balloon rises
- 💰 Players can cash out at any moment to secure their winnings
- 💥 The balloon pops at a random multiplier (provably fair)
- 🏆 Players who cashed out before the crash win their bet × multiplier

## ✨ Features

### 🔐 Provably Fair

Every round is cryptographically verifiable using:

- Server seed (hashed and published before round)
- Client seeds (from first 3 players)
- On-chain verification available for all rounds

### 🚀 Built with Scaffold Stellar

- ✅ Rust smart contracts compiled to WebAssembly (Soroban)
- ✅ Auto-generated TypeScript bindings
- ✅ Stellar Wallet Kit integration
- ✅ Modern React + TypeScript + Vite stack
- ✅ Hot reload for contract changes

### 🎮 Real-time Gameplay

- Live multiplier updates
- Real-time bet tracking
- Instant cash-outs
- Round history with verification

## 🏗️ Architecture

```
BalloonFly/
├── contracts/balloonfly/     # Rust smart contract (Soroban)
│   ├── src/
│   │   ├── lib.rs            # Main contract logic
│   │   ├── error.rs          # Error types
│   │   └── xlm.rs            # XLM utilities
│   └── Cargo.toml
│
├── src/                      # React frontend
│   ├── components/           # UI components
│   ├── hooks/                # Custom React hooks
│   ├── pages/                # Route pages
│   └── contracts/            # Auto-generated contract clients
│
└── environments.toml         # Contract deployment config
```

## 🚀 Quick Start

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) (with wasm32 target)
- [Node.js](https://nodejs.org/) v22+
- [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools)
- [Scaffold Stellar Plugin](https://github.com/AhaLabs/scaffold-stellar)
- Docker (for local Stellar network)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd balloonfly

# Install dependencies
npm install

# Start development server
npm start
```

This will:

1. 🐳 Start local Stellar network (Docker)
2. 🦀 Compile Rust contract to WASM
3. 🚀 Deploy contract to local network
4. 📦 Generate TypeScript client
5. ⚡ Start Vite dev server

### Access the App

- 🏠 **Landing Page**: http://localhost:5173/
- 🎮 **Game**: http://localhost:5173/game
- 🔧 **Debugger**: http://localhost:5173/debug

## 📖 Documentation

- [Quick Start Guide](./QUICK_START.md) - Step-by-step setup
- [Use Cases](./USE_CASES.md) - User flows and scenarios
- [Smart Contract](./contracts/balloonfly/README.md) - Contract documentation

## 🎮 How to Play

1. **Connect Wallet** - Click "Connect Account" in the header
2. **Place Bet** - Enter your XLM amount before the round starts
3. **Watch It Rise** - The multiplier grows as the balloon flies
4. **Cash Out** - Click "Cash Out" before it pops to win
5. **Verify** - Check the provably fair results after each round

## 🛠️ Development

### Available Scripts

```bash
npm start          # Start dev server with hot reload
npm run build      # Build for production
npm run lint       # Run ESLint
npm run format     # Format code with Prettier
```

### Smart Contract Development

The contract is in `contracts/balloonfly/`. Any changes trigger:

1. Auto-recompilation
2. Auto-deployment
3. Client regeneration
4. Frontend hot reload

### Testing

```bash
# Run contract tests
cd contracts/balloonfly
cargo test
```

> **Note:** The contract test suite runs via Cargo. The frontend currently does not include an integration test suite.

## 🌐 Deployment

### Testnet Deployment

```bash
# Set environment
export STELLAR_SCAFFOLD_ENV=staging

# Deploy contracts
stellar registry publish
stellar registry deploy

# Build frontend
npm run build

# Deploy dist/ to your hosting
```

### Production Deployment

Update `environments.toml` for production network and follow the same steps with `STELLAR_SCAFFOLD_ENV=production`.

## 🔐 Security

- ✅ All random numbers generated on-chain
- ✅ Provably fair algorithm with public verification
- ✅ No admin controls after deployment
- ✅ Audited contract logic (coming soon)

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the [Apache License 2.0](LICENSE).

## 🙏 Acknowledgments

- Built with [Scaffold Stellar](https://github.com/AhaLabs/scaffold-stellar)
- Powered by [Stellar](https://stellar.org) blockchain
- Inspired by crash games like Aviator

## 📞 Support

- 🐛 [Report Bug](https://github.com/your-repo/issues)
- 💡 [Request Feature](https://github.com/your-repo/issues)
- 📧 Email: your-email@example.com

---

**Made with ❤️ for the Stellar Hackathon** 🎈
