# 🤖 FX Trading Copier

A fully-featured Telegram bot that automatically copies trading signals from Telegram channels to your MT4/MT5 accounts using MetaAPI.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)

---

## 📋 Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [Commands Reference](#commands-reference)
- [Settings Explained](#settings-explained)
- [Signal Format Examples](#signal-format-examples)
- [Supported Instruments](#supported-instruments)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [Support](#support)

---

## ✨ Features

### 🎯 Core Features
- ✅ **Multi-Order Execution** - Open 1-10 orders per signal with custom lot sizes
- ✅ **MT4/MT5 Integration** - Connect unlimited accounts directly from Telegram
- ✅ **Signal Channel Monitoring** - Auto-detect and copy signals from Telegram channels
- ✅ **Smart Trade Management** - Auto close 50% at TP1, move to breakeven
- ✅ **80+ Instruments** - Forex, Metals, Crypto, Indices, Commodities, Energy
- ✅ **Advanced Risk Management** - Configurable lot sizes, risk limits, and multipliers
- ✅ **Reverse Trading** - Convert BUY signals to SELL and vice versa
- ✅ **Interactive Buttons** - Easy-to-use menu system
- ✅ **Real-time Execution** - Instant trade copying with rate limit protection

### 🛡️ Safety Features
- 🔒 Breakeven protection
- 🎯 Take profit management (TP1, TP2, TP3)
- 🛑 Stop loss copying
- ⚠️ Max risk per trade limits
- 🔄 Error handling and recovery

---

## 📦 Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v14.0.0 or higher)
   - Download from [nodejs.org](https://nodejs.org/)

2. **Telegram Bot Token**
   - Create a bot via [@BotFather](https://t.me/botfather)
   - Command: `/newbot`
   - Save your token (format: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

3. **MetaAPI Account**
   - Sign up at [metaapi.cloud](https://metaapi.cloud/)
   - Generate API token from dashboard
   - Free tier available for testing

4. **MT4/MT5 Trading Account**
   - Demo or live account from any broker
   - Account credentials (login, password, server)

---

## 🚀 Installation

### Step 1: Clone or Download

```bash
# Create project directory
mkdir fx-telegram-copier
cd fx-telegram-copier

# Copy the bot.js file to this directory
```

### Step 2: Install Dependencies

```bash
npm install node-telegram-bot-api axios
```

### Step 3: Configure Credentials

Open `bot.js` and update these lines:

```javascript
const TELEGRAM_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN';
const META_API_KEY = 'YOUR_METAAPI_TOKEN';
```

### Step 4: Run the Bot

```bash
node bot.js
```

You should see:
```
✅ Telegram Bot Connected!
✅ Meta API Connected!
✅ All systems operational!
🤖 Bot is ready to receive commands...
```

---

## ⚙️ Configuration

### Required Configuration

| Setting | Description | Example |
|---------|-------------|---------|
| `TELEGRAM_TOKEN` | Bot token from @BotFather | `8415524176:AAHxFc...` |
| `META_API_KEY` | MetaAPI authentication token | `eyJhbGciOiJSUz...` |
| `META_API_URL` | MetaAPI endpoint | `https://mt-client-api-v1.metaapi.cloud` |

### Optional Settings (Set via commands)

| Setting | Default | Range | Description |
|---------|---------|-------|-------------|
| Base Lot Size | 0.01 | 0.01-100 | Lot size per order |
| Number of Orders | 1 | 1-10 | Orders per signal |
| Lot Multiplier | 1.0 | 0.1-10 | Multiply all lots |
| Max Risk | 5% | 1-100% | Maximum risk per trade |
| Auto Close TP1 | Enabled | On/Off | Close 50% at TP1 |
| Move to Breakeven | Enabled | On/Off | Move SL to entry |
| Breakeven Trigger | 50% | 1-100% | When to move to BE |

---

## 📖 Usage Guide

### Quick Start (5 Minutes)

1. **Start the bot**
   ```bash
   node bot.js
   ```

2. **Open Telegram and find your bot**
   - Search for your bot username
   - Send `/start`

3. **Connect MT4/MT5 Account**
   - Click "📊 Connect MT4/MT5"
   - Choose platform (MT4 or MT5)
   - Send credentials:
   ```
   /add_mt5 YOUR_LOGIN YOUR_PASSWORD YOUR_BROKER_SERVER
   ```
   Example:
   ```
   /add_mt5 12345678 MyPassword123 ICMarkets-Demo01
   ```

4. **Add Signal Channel**
   - Click "📢 Add Signal Channel"
   - Option A: Forward any message from the channel
   - Option B: Use command:
   ```
   /add_channel @forex_signals
   ```

5. **Configure Settings (Optional)**
   - Click "⚙️ Settings"
   - Set lot size: `/lot_size 0.10`
   - Set number of orders: `/num_orders 3`

6. **Start Copying**
   - Click "▶️ Start Copying"
   - Bot will monitor channels and copy trades automatically!

---

## 🎮 Commands Reference

### Basic Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/start` | Show main menu with buttons | `/start` |
| `/help` | Display help information | `/help` |
| `/status` | Show current configuration | `/status` |
| `/test` | Test API connections | `/test` |

### Account Management

| Command | Description | Example |
|---------|-------------|---------|
| `/add_mt4 ID` | Add existing MT4 account | `/add_mt4 abc123def456` |
| `/add_mt4 LOGIN PASS SERVER` | Create new MT4 account | `/add_mt4 12345 Pass123 Broker-Demo` |
| `/add_mt5 ID` | Add existing MT5 account | `/add_mt5 xyz789abc123` |
| `/add_mt5 LOGIN PASS SERVER` | Create new MT5 account | `/add_mt5 54321 Pass456 XM-Demo3` |

### Channel Management

| Command | Description | Example |
|---------|-------------|---------|
| `/add_channel @username` | Add channel by username | `/add_channel @forex_signals` |
| `/add_channel ID` | Add channel by ID | `/add_channel -1001234567890` |

### Volume Settings

| Command | Description | Example |
|---------|-------------|---------|
| `/lot_size VALUE` | Set base lot per order | `/lot_size 0.10` |
| `/num_orders VALUE` | Set number of orders (1-10) | `/num_orders 5` |
| `/lot_multiplier VALUE` | Multiply all lots | `/lot_multiplier 2` |

### Risk Settings

| Command | Description | Example |
|---------|-------------|---------|
| `/max_risk VALUE` | Set maximum risk % | `/max_risk 3` |

---

## 🎛️ Settings Explained

### Volume Control

**Base Lot Size**
- Lot size for each individual order
- Example: `0.01`, `0.10`, `1.00`
- Set with: `/lot_size 0.10`

**Number of Orders**
- How many orders to open per signal (1-10)
- Example: `1` order, `3` orders, `10` orders
- Set with: `/num_orders 3`

**Lot Multiplier**
- Multiply all lot sizes by this value
- Example: `0.5` (half size), `2.0` (double size)
- Set with: `/lot_multiplier 2`

**Volume Calculation**
```
Total Volume = Base Lot × Number of Orders × Multiplier

Example:
0.10 × 3 orders × 2 = 0.60 lots total
```

### Trade Management

**Auto Close at TP1**
- When enabled, closes 50% of each position at TP1
- Remaining 50% continues to TP2/TP3
- Toggle with Settings button

**Move to Breakeven**
- Automatically moves stop loss to entry price
- Triggers at 50% of distance to TP1 (configurable)
- Eliminates risk after partial profit
- Toggle with Settings button

**Reverse Signals**
- Converts BUY signals to SELL
- Converts SELL signals to BUY
- Useful for inverse trading strategies
- Toggle with Settings button

### Risk Management

**Max Risk Per Trade**
- Maximum percentage of account to risk
- Not yet fully implemented (future feature)
- Set with: `/max_risk 5`

**Copy Stop Loss**
- Copy SL from signal to your trades
- Toggle with Settings button

**Copy Take Profit**
- Copy TP from signal to your trades
- Toggle with Settings button

---

## 📊 Signal Format Examples

### Supported Formats

**Format 1: Standard**
```
BUY EURUSD @ 1.0950 SL 1.0920 TP1 1.0980 TP2 1.1000 TP3 1.1020
```

**Format 2: Keywords**
```
SELL GOLD Entry: 2050.50 Stop: 2055 TP1: 2040 TP2: 2030
```

**Format 3: Short Form**
```
LONG GBPUSD at 1.2650 sl 1.2620 tp 1.2700
```

**Format 4: Alternative**
```
SHORT BTCUSD Entry 45000 SL 46000 Target1 43000 Target2 41000
```

**Format 5: Minimal**
```
BUY USDJPY 150.50
SELL XAUUSD 2050
```

### Signal Components

| Component | Keywords | Example |
|-----------|----------|---------|
| Action | BUY, SELL, LONG, SHORT | `BUY`, `SELL` |
| Symbol | Any instrument | `EURUSD`, `GOLD`, `BTCUSD` |
| Entry | @, at, Entry, Price | `@ 1.0950`, `Entry: 2050` |
| Stop Loss | SL, Stop Loss, Stop | `SL 1.0920`, `Stop: 2055` |
| Take Profit 1 | TP1, TP 1, Target 1 | `TP1 1.0980`, `Target1: 2060` |
| Take Profit 2 | TP2, TP 2, Target 2 | `TP2 1.1000`, `Target2: 2070` |
| Take Profit 3 | TP3, TP 3, Target 3 | `TP3 1.1020`, `Target3: 2080` |

---

## 🌍 Supported Instruments

### 💱 Forex Pairs (28+)

**Major Pairs**
- EURUSD, GBPUSD, USDJPY, USDCHF
- AUDUSD, USDCAD, NZDUSD

**Minor Pairs**
- EURGBP, EURJPY, GBPJPY, EURCHF
- AUDJPY, GBPAUD, EURAUD, NZDJPY
- GBPCAD, EURCAD, AUDCAD, AUDNZD
- GBPNZD, EURNZD, CHFJPY, CADCHF

### 🥇 Metals (7)
- GOLD/XAUUSD, SILVER/XAGUSD
- XAUEUR, XAUAUD, XAUJPY
- PLATINUM, PALLADIUM, COPPER

### ⚫ Energy & Oil (7)
- OIL/USOIL/WTI/CRUDE
- UKOIL/BRENT
- NGAS/NATURALGAS

### ₿ Cryptocurrencies (10)
- BTCUSD/BITCOIN/BTC
- ETHUSD/ETHEREUM/ETH
- XRPUSD, LTCUSD, BCHUSD
- ADAUSD, DOGUSD, SOLUSD
- BNBUSD, MATICUSD

### 📊 Indices (15)
- US30/DOW/DOWJONES
- US500/SPX500/SP500
- NAS100/NASDAQ
- UK100/FTSE
- GER30/DAX
- FRA40/CAC
- JPN225/NIKKEI
- AUS200, HK50, CHINA50
- EUSTX50, SPA35

### 🌾 Commodities (8)
- WHEAT, CORN, SOYBEAN
- COFFEE, SUGAR, COTTON
- COCOA

**Total: 80+ Instruments**

---

## 🔧 Troubleshooting

### Common Issues

#### Bot Not Starting

**Problem:** "ETELEGRAM: 401 Unauthorized"
```
Solution:
1. Check Telegram token in bot.js
2. Get new token from @BotFather
3. Make sure token format is correct: 1234567890:ABCdef...
```

**Problem:** "Meta API Connection Failed"
```
Solution:
1. Verify META_API_KEY in bot.js
2. Check API token has all permissions enabled
3. Login to metaapi.cloud and regenerate token
4. Ensure META_API_URL is: https://mt-client-api-v1.metaapi.cloud
```

#### Account Connection Issues

**Problem:** "Unable to verify account"
```
Solution:
1. Check account credentials (login, password, server)
2. Verify server name (case-sensitive)
   Example: ICMarkets-Demo01 not icmarkets-demo01
3. Wait 30 seconds for account deployment
4. Use /test command to check connection
```

**Problem:** "Account platform mismatch"
```
Solution:
1. Make sure you're using correct command:
   - /add_mt4 for MetaTrader 4 accounts
   - /add_mt5 for MetaTrader 5 accounts
2. Check with your broker which platform you have
```

#### Signal Detection Issues

**Problem:** "Signals not being detected"
```
Solution:
1. Make sure bot is a member of the signal channel
2. Channel must allow bots (check channel settings)
3. Verify channel is added: /status
4. Check signal format matches examples
5. Make sure copying is started: Click "▶️ Start Copying"
```

**Problem:** "Wrong instrument detected"
```
Solution:
1. Signal must use standard symbol names
2. Check supported instruments list
3. Example: Use "GOLD" or "XAUUSD" not "Gold" or "gold"
```

#### Trade Execution Issues

**Problem:** "Trade execution failed"
```
Solution:
1. Check account has sufficient margin
2. Verify account is connected and deployed
3. Check lot size is valid (broker minimum)
4. Ensure symbol exists on your broker
5. Check account status: /test
```

**Problem:** "Rate limit exceeded"
```
Solution:
1. Bot has 500ms delay between orders
2. Reduce number of orders if still hitting limits
3. Consider spacing out signal execution
```

### Getting Debug Information

**Test Connection:**
```
/test
```
Shows:
- Telegram bot status
- MetaAPI connection status
- All available accounts
- Account deployment status

**Check Status:**
```
/status
```
Shows:
- Current settings
- Connected accounts
- Signal channels
- Copying status

**View Accounts:**
Click "📋 My Accounts" button to see:
- MT4 accounts
- MT5 accounts
- Signal channels

---

## ❓ FAQ

### General Questions

**Q: Is this bot free?**
A: The bot code is free. You need:
- Free Telegram bot (unlimited)
- MetaAPI (free tier available, paid plans for production)
- MT4/MT5 account (demo accounts are free)

**Q: Can I use multiple MT4/MT5 accounts?**
A: Yes! You can connect unlimited accounts and all will receive signals.

**Q: Can I monitor multiple signal channels?**
A: Yes! Add as many channels as you want. Each signal from any channel will be copied.

**Q: Does it work with demo accounts?**
A: Yes! Perfect for testing before going live.

**Q: Can I customize lot sizes per account?**
A: Currently, all accounts use the same lot size settings. Per-account customization is a planned feature.

### Trading Questions

**Q: What's the difference between number of orders and lot multiplier?**
A:
- **Number of Orders**: Opens multiple separate positions (e.g., 3 orders = 3 positions)
- **Lot Multiplier**: Increases/decreases size of all orders (e.g., 2x = double each order)

Example:
```
Base: 0.10 lot
Orders: 3
Multiplier: 2

Result: Opens 3 positions of 0.20 lots each = 0.60 total
```

**Q: How does the TP1 auto-close work?**
A: When price reaches TP1:
- Closes 50% of each position
- Moves stop loss to breakeven
- Remaining 50% continues to TP2/TP3

**Q: What happens if there's no TP1 in the signal?**
A: Bot uses the regular TP value instead. If no TP at all, order opens without take profit.

**Q: Can I close positions manually?**
A: Yes! Use your MT4/MT5 platform to manage positions manually anytime.

**Q: Does the bot handle multiple signals simultaneously?**
A: Yes! Each signal is processed independently with full monitoring.

### Technical Questions

**Q: What happens if the bot crashes?**
A: Restart the bot with `node bot.js`. Your settings are stored in memory, so you'll need to reconfigure. Consider using PM2 for auto-restart:
```bash
npm install -g pm2
pm2 start bot.js --name copier-bot
pm2 save
```

**Q: Can I run this on a VPS?**
A: Yes! Recommended for 24/7 operation. Any VPS with Node.js will work.

**Q: How do I update the bot?**
A: Replace bot.js with new version and restart:
```bash
# Stop bot (Ctrl+C)
# Replace bot.js file
node bot.js
```

**Q: Is my data secure?**
A: Bot stores data in memory only (not on disk). MetaAPI handles all trading account security. Never share your API keys.

**Q: Can I see the trade history?**
A: Currently no. Check your MT4/MT5 platform for trade history. Built-in history is a planned feature.

---

## 📈 Examples

### Example 1: Conservative Setup
```
Goal: Small position sizes, single order
/lot_size 0.01
/num_orders 1
/lot_multiplier 1
/max_risk 1

Result: 0.01 lot per signal
```

### Example 2: Moderate Setup
```
Goal: Medium positions, scale into trades
/lot_size 0.10
/num_orders 3
/lot_multiplier 1
/max_risk 3

Result: 3 orders × 0.10 = 0.30 lots per signal
```

### Example 3: Aggressive Setup
```
Goal: Large positions, multiple entries
/lot_size 0.50
/num_orders 5
/lot_multiplier 2
/max_risk 5

Result: 5 orders × 0.50 × 2 = 5.00 lots per signal
```

### Example 4: Scaling Strategy
```
Goal: Multiple small entries with TP1 auto-close
/lot_size 0.05
/num_orders 10
Enable: Auto Close TP1
Enable: Move to Breakeven

Result: 
- Opens 10 positions of 0.05 lots (0.50 total)
- At TP1: Closes 50% of each (0.25 lots closed)
- Moves remaining 0.25 lots to breakeven
- Continues to TP2/TP3 risk-free
```

---

## 🛠️ Advanced Configuration

### Using PM2 for Production

Install PM2:
```bash
npm install -g pm2
```

Start bot:
```bash
pm2 start bot.js --name copier-bot
```

Useful PM2 commands:
```bash
pm2 list                  # List all processes
pm2 logs copier-bot       # View logs
pm2 restart copier-bot    # Restart bot
pm2 stop copier-bot       # Stop bot
pm2 delete copier-bot     # Remove from PM2
pm2 save                  # Save PM2 config
pm2 startup               # Enable auto-start on reboot
```

### Environment Variables

For better security, use environment variables:

Create `.env` file:
```env
TELEGRAM_TOKEN=your_telegram_token
META_API_KEY=your_metaapi_key
```

Install dotenv:
```bash
npm install dotenv
```

Update bot.js:
```javascript
require('dotenv').config();
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const META_API_KEY = process.env.META_API_KEY;
```

---

## 📞 Support

### Getting Help

1. **Check this README** - Most questions are answered here
2. **Use /test command** - Diagnose connection issues
3. **Check MetaAPI docs** - [docs.metaapi.cloud](https://metaapi.cloud/docs)
4. **Telegram Bot API** - [core.telegram.org/bots/api](https://core.telegram.org/bots/api)

### Reporting Issues

When reporting issues, include:
- Error message (exact text)
- Output of `/test` command
- Steps to reproduce
- Bot.js version
- Node.js version (`node --version`)

### Feature Requests

Want a new feature? Common requests:
- Per-account lot size settings
- Trade history and statistics
- Profit/loss tracking
- Trade filtering by symbol/time
- Trailing stop loss
- Multiple TP levels management

---

## 📄 License

MIT License - Feel free to modify and distribute.

---

## ⚠️ Disclaimer

**Trading Risk Warning:**
Trading foreign exchange, cryptocurrencies, and contracts for differences (CFDs) on margin carries a high level of risk and may not be suitable for all investors. The high degree of leverage can work against you as well as for you. Before deciding to trade, you should carefully consider your investment objectives, level of experience, and risk appetite.

**Software Disclaimer:**
This bot is provided "as is" without warranty of any kind. Use at your own risk. The developer is not responsible for any trading losses incurred while using this software. Always test thoroughly on demo accounts before using with real money.

---

## 🎉 Conclusion

You now have a powerful trading copier bot that can:
- ✅ Monitor unlimited Telegram channels
- ✅ Copy trades to unlimited MT4/MT5 accounts
- ✅ Open multiple orders per signal
- ✅ Manage trades intelligently (TP1 auto-close, breakeven)
- ✅ Support 80+ trading instruments
- ✅ Operate 24/7 automatically

**Happy Trading! 🚀**

---

*Last Updated: November 2025*
*Version: 1.0.0*
