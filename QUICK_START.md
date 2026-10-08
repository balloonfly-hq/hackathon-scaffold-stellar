# 🚀 Quick Start Guide - BalloonFly

Get BalloonFly up and running in 5 minutes!

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] **Rust** installed (`rustc --version`)
- [ ] **Node.js v22+** installed (`node --version`)
- [ ] **Stellar CLI** installed (`stellar --version`)
- [ ] **Scaffold Stellar** plugin installed
- [ ] **Docker** running (for local network)

### Install Missing Tools

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add wasm32 target
rustup target add wasm32-unknown-unknown

# Install Stellar CLI
cargo install --locked stellar-cli --features opt

# Install Scaffold Stellar plugin
stellar install scaffold
```

## 🎯 5-Minute Setup

### Step 1: Clone & Install (1 min)

```bash
# Clone the repository
git clone <your-repo-url>
cd balloonfly

# Install dependencies
pnpm install
```

### Step 2: Start Everything (2 min)

```bash
# This single command does everything:
npm start
```

**What happens:**
1. 🐳 Starts Docker container (Stellar local network)
2. 🦀 Compiles Rust contract → WASM
3. 🚀 Deploys contract to local network
4. 📦 Generates TypeScript client
5. ⚡ Starts Vite dev server

**Wait for this message:**
```
✅ Successfully generated client for: balloonfly
[1] ➜  Local:   http://localhost:5173/
```

### Step 3: Connect Wallet (1 min)

1. Open http://localhost:5173/
2. Click **"Connect Account"** in header
3. Choose **Freighter** or any Stellar wallet
4. **You'll auto-redirect to the game!** 🎈

### Step 4: Fund Account (30 sec - local only)

On local network, click **"Fund Account"** button to get test XLM from friendbot.

### Step 5: Play! (30 sec)

1. Enter bet amount (e.g., `10 XLM`)
2. Click **"Place Bet"**
3. Watch multiplier grow 📈
4. Click **"Cash Out"** before crash 💥

---

## 🎮 First Game Walkthrough

### Round Flow

```
1. Waiting (30s) → Place your bets
2. Flying → Multiplier grows (1.00x → ???)
3. Crash! → Balloon pops at random multiplier
4. Results → See winners and verify fairness
```

### Betting Strategy

| Strategy | Risk | Potential Reward |
|----------|------|------------------|
| Early cash-out (1.2x) | 🟢 Low | Small, consistent wins |
| Medium (2-5x) | 🟡 Medium | Balanced gameplay |
| Late (10x+) | 🔴 High | Big wins, rare |

---

## 🔧 Troubleshooting

### Docker not starting?

```bash
# Check if Docker is running
docker ps

# If not, start Docker Desktop or service
sudo systemctl start docker  # Linux
```

### Port 5173 already in use?

```bash
# Kill process on port
pnpm dlx kill-port 5173

# Or change port in vite.config.ts
```

### Contract not deploying?

```bash
# Clean build
rm -rf target/
cargo clean

# Try again
npm start
```

### Wallet not connecting?

1. Install [Freighter Wallet](https://www.freighter.app/)
2. Create/import account
3. Switch to **Standalone** network in Freighter settings

---

## 📚 Next Steps

Now that you're set up:

1. 📖 Read [USE_CASES.md](./USE_CASES.md) to understand all features
2. 🔍 Explore the [Debugger](http://localhost:5173/debug) to call contract functions
3. 🎨 Customize the UI in `src/components/`
4. 🦀 Modify the contract in `contracts/balloonfly/`

---

## 🐛 Common Issues

### Issue: "Contract not found"

**Solution:** Wait for contract deployment to finish. Look for this log:
```
✅ Successfully generated client for: balloonfly
```

### Issue: "Insufficient balance"

**Solution:** Click **"Fund Account"** button (local network only).

### Issue: TypeScript errors

**Solution:** Restart the dev server:
```bash
# Ctrl+C to stop, then:
npm start
```

---

## 💡 Pro Tips

### Hot Reload
Changes to `.rs` files trigger auto-rebuild. Changes to `.tsx` files hot-reload instantly!

### Debugger
Use http://localhost:5173/debug to:
- Call contract functions directly
- Inspect transaction details
- Test edge cases

### Network Switching
Edit `environments.toml` to deploy to testnet or mainnet:
```toml
[staging.network]
rpc-url = "https://soroban-testnet.stellar.org"
```

---

## 🎯 Success Criteria

You're ready when you can:
- ✅ Connect wallet successfully
- ✅ Place a bet
- ✅ See live multiplier updates
- ✅ Cash out and receive winnings
- ✅ View round history

---

**Need help?** Check [README.md](./README.md) or open an issue!

Happy flying! 🎈

