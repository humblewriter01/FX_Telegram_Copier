# 🤖 FX Trading Copier

A fully-featured Telegram bot that automatically copies trading signals from Telegram channels to your MT4/MT5 accounts using MetaAPI.

![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)

## 📋 Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Quick Setup](#quick-setup)
- [Installation](#installation)
- [Deployment](#deployment)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [Commands Reference](#commands-reference)
- [Settings Explained](#settings-explained)
- [Signal Format Examples](#signal-format-examples)
- [Supported Instruments](#supported-instruments)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [Support](#support)

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

### 🛡️ Security & Performance
- 🔒 **Secure Environment Setup** - Prevents token hardcoding
- 🧹 **Automatic Cleanup** - Removes inactive users after 30 days
- 📊 **User Limits** - Maximum 1000 users with TTL tracking
- 🔐 **SSL Security** - Configurable SSL verification for production
- ⚡ **Memory Management** - Automatic cleanup of old data

## 📦 Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v18.0.0 or higher) - Download from [nodejs.org](https://nodejs.org/)
2. **Telegram Bot Token** - Create a bot via [@BotFather](https://t.me/botfather)
3. **MetaAPI Account** - Sign up at [metaapi.cloud](https://metaapi.cloud/)
4. **MT4/MT5 Trading Account** - Demo or live account from any broker

## 🚀 Quick Setup

### Option 1: Local Development
```bash
git clone https://github.com/humblewriter01/FX_Telegram_Copier.git
cd FX_Telegram_Copier
npm run setup
npm install
# Edit .env file with your credentials
npm start
```

Option 2: Render Deployment (Recommended)

1. Fork this repository on GitHub
2. Connect to render.com
3. Set environment variables in Render dashboard
4. Deploy - Your bot will be live in minutes!

📥 Installation

Step 1: Get the Code

```bash
git clone https://github.com/humblewriter01/FX_Telegram_Copier.git
cd FX_Telegram_Copier
```

Step 2: Automated Setup

```bash
npm run setup
```

Step 3: Configure Environment

Edit the created .env file:

```env
TELEGRAM_TOKEN=your_actual_telegram_bot_token_here
META_API_KEY=your_actual_metaapi_cloud_key_here
WEBHOOK_URL=your_render_app_url_here
PORT=3000
```

Step 4: Install & Run

```bash
npm install
npm start
```

You should see:

```
✅ Telegram Bot Connected!
✅ Meta API Connected!
✅ All systems operational!
🤖 Bot is ready to receive commands...
```

☁️ Deployment

Render Deployment

Create render.yaml:

```yaml
services:
  - type: web
    name: fx-telegram-copier
    env: node
    plan: free
    buildCommand: npm install
    startCommand: node bot.js
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: TELEGRAM_TOKEN
        sync: false
      - key: META_API_KEY
        sync: false
      - key: WEBHOOK_URL
        sync: false
```

PM2 (For VPS)

```bash
npm install -g pm2
pm2 start bot.js --name copier-bot
pm2 save
pm2 startup
```

⚙️ Configuration

Environment Variables

Create .env file (automatically created with npm run setup):

```env
TELEGRAM_TOKEN=your_telegram_bot_token
META_API_KEY=your_metaapi_cloud_key
WEBHOOK_URL=your_render_app_url
PORT=3000
MAX_USERS=1000
USER_TTL_DAYS=30
CLEANUP_INTERVAL_HOURS=24
ENABLE_SSL_STRICT=true
```

Security Features

· Automatic user cleanup - Inactive users removed after 30 days
· User limits - Maximum 1000 users
· SSL verification - Enabled by default
· No token hardcoding - Environment variables only

📖 Usage Guide

Quick Start (5 Minutes)

1. Start the bot: npm start
2. Open Telegram and find your bot
3. Send /start to see main menu
4. Connect MT4/MT5 Account:
   ```
   /add_mt5 YOUR_LOGIN YOUR_PASSWORD YOUR_BROKER_SERVER
   ```
5. Add Signal Channel:
   ```
   /add_channel @forex_signals
   ```
6. Configure Settings (optional):
   · /lot_size 0.10
   · /num_orders 3
7. Start Copying - Click "▶️ Start Copying"

🎮 Commands Reference

Basic Commands

Command Description Example
/start Show main menu /start
/help Display help /help
/status Show configuration /status

Account Management

Command Description Example
/add_mt4 ID Add existing MT4 /add_mt4 abc123def456
/add_mt4 LOGIN PASS SERVER Create new MT4 /add_mt4 12345 YOUR_PASSWORD Broker-Server
/add_mt5 ID Add existing MT5 /add_mt5 xyz789abc123
/add_mt5 LOGIN PASS SERVER Create new MT5 /add_mt5 54321 YOUR_PASSWORD Broker-Server

Channel Management

Command Description Example
/add_channel @username Add channel by username /add_channel @forex_signals
/add_channel ID Add channel by ID /add_channel -1001234567890
/list_channels Show all channels /list_channels

Volume Settings

Command Description Example
/lot_size VALUE Set base lot per order /lot_size 0.10
/num_orders VALUE Set number of orders /num_orders 5
/lot_multiplier VALUE Multiply all lots /lot_multiplier 2

Risk Settings

Command Description Example
/max_risk VALUE Set maximum risk % /max_risk 3

🎛️ Settings Explained

Volume Control

Base Lot Size

· Lot size for each individual order
· Example: 0.01, 0.10, 1.00
· Set with: /lot_size 0.10

Number of Orders

· How many orders to open per signal (1-10)
· Example: 1 order, 3 orders, 10 orders
· Set with: /num_orders 3

Lot Multiplier

· Multiply all lot sizes by this value
· Example: 0.5 (half size), 2.0 (double size)
· Set with: /lot_multiplier 2

Volume Calculation

```
Total Volume = Base Lot × Number of Orders × Multiplier
Example: 0.10 × 3 orders × 2 = 0.60 lots total
```

Trade Management

Auto Close at TP1

· When enabled, closes 50% of each position at TP1
· Remaining 50% continues to TP2/TP3
· Toggle with Settings button

Move to Breakeven

· Automatically moves stop loss to entry price
· Triggers at 50% of distance to TP1
· Eliminates risk after partial profit
· Toggle with Settings button

Reverse Signals

· Converts BUY signals to SELL
· Converts SELL signals to BUY
· Useful for inverse trading strategies
· Toggle with Settings button

Risk Management

Max Risk Per Trade

· Maximum percentage of account to risk
· Set with: /max_risk 5

Copy Stop Loss

· Copy SL from signal to your trades
· Toggle with Settings button

Copy Take Profit

· Copy TP from signal to your trades
· Toggle with Settings button

📊 Signal Format Examples

Supported Formats

Format 1: Standard

```
BUY EURUSD @ 1.0950 SL 1.0920 TP1 1.0980 TP2 1.1000 TP3 1.1020
```

Format 2: Keywords

```
SELL GOLD Entry: 2050.50 Stop: 2055 TP1: 2040 TP2: 2030
```

Format 3: Short Form

```
LONG GBPUSD at 1.2650 sl 1.2620 tp 1.2700
```

Format 4: Alternative

```
SHORT BTCUSD Entry 45000 SL 46000 Target1 43000 Target2 41000
```

Format 5: Immediate Execution

```
BUY GOLD NOW
SELL BTCUSD IMMEDIATE
```

Format 6: TP/SL Updates

```
TP1 HIT - Close 50% and move to breakeven
CLOSE ALL - Close all positions
```

Signal Components

Component Keywords Example
Action BUY, SELL, LONG, SHORT BUY, SELL
Symbol Any instrument EURUSD, GOLD, BTCUSD
Entry @, at, Entry, Price @ 1.0950, Entry: 2050
Stop Loss SL, Stop Loss, Stop SL 1.0920, Stop: 2055
Take Profit 1 TP1, TP 1, Target 1 TP1 1.0980, Target1: 2060
Take Profit 2 TP2, TP 2, Target 2 TP2 1.1000, Target2: 2070
Take Profit 3 TP3, TP 3, Target 3 TP3 1.1020, Target3: 2080
Immediate NOW, IMMEDIATE, MARKET BUY NOW, SELL IMMEDIATE

🌍 Supported Instruments

💱 Forex Pairs (28+)

Major Pairs

· EURUSD, GBPUSD, USDJPY, USDCHF
· AUDUSD, USDCAD, NZDUSD

Minor Pairs

· EURGBP, EURJPY, GBPJPY, EURCHF
· AUDJPY, GBPAUD, EURAUD, NZDJPY
· GBPCAD, EURCAD, AUDCAD, AUDNZD
· GBPNZD, EURNZD, CHFJPY, CADCHF

🥇 Metals (7)

· GOLD/XAUUSD, SILVER/XAGUSD
· XAUEUR, XAUAUD, XAUJPY
· PLATINUM, PALLADIUM, COPPER

⚫ Energy & Oil (7)

· OIL/USOIL/WTI/CRUDE
· UKOIL/BRENT
· NGAS/NATURALGAS

₿ Cryptocurrencies (10)

· BTCUSD/BITCOIN/BTC
· ETHUSD/ETHEREUM/ETH
· XRPUSD, LTCUSD, BCHUSD
· ADAUSD, DOGUSD, SOLUSD
· BNBUSD, MATICUSD

📊 Indices (15)

· US30/DOW/DOWJONES
· US500/SPX500/SP500
· NAS100/NASDAQ
· UK100/FTSE
· GER30/DAX
· FRA40/CAC
· JPN225/NIKKEI
· AUS200, HK50, CHINA50
· EUSTX50, SPA35

🌾 Commodities (8)

· WHEAT, CORN, SOYBEAN
· COFFEE, SUGAR, COTTON
· COCOA

Total: 80+ Instruments

🔧 Troubleshooting

Common Issues

Bot Not Starting

Problem: "ETELEGRAM: 401 Unauthorized"

```
Solution:
1. Check TELEGRAM_TOKEN in .env file
2. Get new token from @BotFather
3. Make sure token format is correct
```

Problem: "Meta API Connection Failed"

```
Solution:
1. Verify META_API_KEY in .env file
2. Check API token permissions
3. Login to metaapi.cloud and regenerate token
```

Account Connection Issues

Problem: "Unable to verify account"

```
Solution:
1. Check account credentials
2. Verify server name (case-sensitive)
3. Wait 30 seconds for account deployment
```

Signal Detection Issues

Problem: "Signals not being detected"

```
Solution:
1. Make sure bot is a member of the signal channel
2. Channel must allow bots
3. Verify channel is added: /status
4. Check signal format matches examples
```

Trade Execution Issues

Problem: "Trade execution failed"

```
Solution:
1. Check account has sufficient margin
2. Verify account is connected and deployed
3. Check lot size is valid (broker minimum)
4. Ensure symbol exists on your broker
```

Getting Debug Information

Check Status:

```
/status
```

Shows current settings, connected accounts, signal channels, and copying status

View Accounts:
Click"📋 My Accounts" button to see MT4/MT5 accounts and signal channels

❓ FAQ

General Questions

Q: Is this bot free?
A:The bot code is free. You need free Telegram bot, MetaAPI (free tier available), and MT4/MT5 account.

Q: Can I use multiple MT4/MT5 accounts?
A:Yes! You can connect unlimited accounts and all will receive signals.

Q: What are the new security features?
A:Version 1.1.0 includes automatic user cleanup, user limits, secure environment setup, and SSL verification.

Trading Questions

Q: What's the difference between number of orders and lot multiplier?
A:Number of Orders opens multiple positions, Lot Multiplier increases size of all orders.

Q: How does the TP1 auto-close work?
A:When price reaches TP1, closes 50% of each position and moves stop loss to breakeven.

Q: Can I close positions manually?
A:Yes! Use your MT4/MT5 platform to manage positions manually anytime.

Technical Questions

Q: What happens if the bot crashes?
A:Restart with npm start. Consider using PM2 for auto-restart.

Q: Can I run this on a VPS?
A:Yes! Recommended for 24/7 operation.

Q: How do I update the bot?
A:Replace files with new version and restart.

📈 Examples

Example 1: Conservative Setup

```
/lot_size 0.01
/num_orders 1
/lot_multiplier 1
/max_risk 1
Result: 0.01 lot per signal
```

Example 2: Moderate Setup

```
/lot_size 0.10
/num_orders 3
/lot_multiplier 1
/max_risk 3
Result: 0.30 lots per signal
```

Example 3: Aggressive Setup

```
/lot_size 0.50
/num_orders 5
/lot_multiplier 2
/max_risk 5
Result: 5.00 lots per signal
```

🛠️ Advanced Configuration

Using PM2 for Production

```bash
npm install -g pm2
pm2 start bot.js --name copier-bot
pm2 save
pm2 startup
```

📞 Support

Getting Help

1. Check this README - Most questions answered here
2. Use /status command - Check current configuration
3. Check MetaAPI docs - docs.metaapi.cloud

Reporting Issues

When reporting issues, include:

· Error message (exact text)
· Output of /status command
· Steps to reproduce
· Bot version (1.1.0)

📄 License

MIT License - Feel free to modify and distribute.

⚠️ Disclaimer

Trading Risk Warning:
Trading carries a high level of risk and may not be suitable for all investors.

Software Disclaimer:
This bot is provided"as is" without warranty of any kind. Use at your own risk.

🎉 What's New in Version 1.1.0

Security Improvements

· ✅ Environment Variable Setup - Prevents token hardcoding
· ✅ Automatic User Cleanup - Removes inactive users after 30 days
· ✅ User Limits - Maximum 1000 users to prevent abuse
· ✅ Secure Command Examples - No real password examples
· ✅ SSL Security - Configurable SSL verification

Setup Improvements

· ✅ Automated Setup Script - npm run setup creates .env file
· ✅ Better Documentation - Clear deployment instructions
· ✅ Render Deployment - One-click cloud deployment

🚀 Conclusion

You now have a powerful, secure trading copier bot that can monitor unlimited channels, copy trades to unlimited accounts, and operate 24/7 automatically with enhanced security features.

Happy Trading! 🚀

---

Last Updated: December 2024
Version: 1.1.0
Author: Humble-writer✍️
