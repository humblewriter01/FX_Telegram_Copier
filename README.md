
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
- 🔒 **Secure Environment Setup** - Prevents token hardcoding with .env.example
- 🧹 **Automatic Cleanup** - Removes inactive users after 30 days
- 📊 **User Limits** - Maximum 1000 users with TTL tracking
- 🔐 **SSL Security** - Configurable SSL verification for production
- ⚡ **Memory Management** - Automatic cleanup of old data
- 🔒 **Secure Examples** - No real passwords in command examples

## 📦 Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v18.0.0 or higher) - Download from [nodejs.org](https://nodejs.org/)
2. **Telegram Bot Token** - Create a bot via [@BotFather](https://t.me/botfather)
3. **MetaAPI Account** - Sign up at [metaapi.cloud](https://metaapi.cloud/)
4. **MT4/MT5 Trading Account** - Demo or live account from any broker

## 🚀 Quick Setup

### Option 1: Local Development (Recommended)
```bash
# Clone the repository
git clone https://github.com/humblewriter01/FX_Telegram_Copier.git
cd FX_Telegram_Copier

# Run automated setup (creates .env file from .env.example)
npm run setup

# Install dependencies
npm install

# Edit .env file with your actual credentials
# Then start the bot
npm start
```

Option 2: Render Deployment

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

Step 2: Automated Environment Setup

```bash
# This copies .env.example to .env automatically
npm run setup
```

Step 3: Configure Environment Variables

Edit the newly created .env file with your actual credentials:

```env
# Required - Get these from Telegram BotFather and MetaAPI
TELEGRAM_TOKEN=your_actual_telegram_bot_token_here
META_API_KEY=your_actual_metaapi_cloud_key_here

# Optional - For production deployment
WEBHOOK_URL=your_render_app_url_here
PORT=3000

# Security & Performance Settings
MAX_USERS=1000
USER_TTL_DAYS=30
CLEANUP_INTERVAL_HOURS=24
ENABLE_SSL_STRICT=true
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

Render Deployment (Recommended)

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

⚙️ Configuration

Environment Variables (Never Hardcode Tokens!)

The bot uses environment variables for security. Always use the .env file:

```env
# 🔐 SECURITY NOTE: Never commit your actual .env file to version control!
# Use .env.example as a template and keep your real .env file private.

TELEGRAM_TOKEN=your_telegram_bot_token
META_API_KEY=your_metaapi_cloud_key
WEBHOOK_URL=your_render_app_url
PORT=3000

# 🧹 Automatic cleanup settings
MAX_USERS=1000
USER_TTL_DAYS=30
CLEANUP_INTERVAL_HOURS=24

# 🔐 SSL Security
ENABLE_SSL_STRICT=true
```

Security Features

· Automatic user cleanup - Inactive users removed after 30 days
· User limits - Maximum 1000 users to prevent resource abuse
· SSL verification - Enabled by default for security
· No token hardcoding - Environment variables only
· Secure examples - No real passwords in documentation

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

Command Description
/start Show main menu
/help Display help
/status Show configuration

Account Management

Command Description Secure Example
/add_mt4 ID Add existing MT4 /add_mt4 abc123def456
/add_mt4 LOGIN PASS SERVER Create new MT4 /add_mt4 12345 YOUR_PASSWORD Broker-Server
/add_mt5 ID Add existing MT5 /add_mt5 xyz789abc123
/add_mt5 LOGIN PASS SERVER Create new MT5 /add_mt5 54321 YOUR_PASSWORD Broker-Server

Channel Management

Command Description
/add_channel @username Add channel by username
/add_channel ID Add channel by ID
/list_channels Show all channels

Volume Settings

Command Description
/lot_size VALUE Set base lot per order
/num_orders VALUE Set number of orders
/lot_multiplier VALUE Multiply all lots

Risk Settings

Command Description
/max_risk VALUE Set maximum risk %

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

Volume Calculation

```
Total Volume = Base Lot × Number of Orders × Multiplier
Example: 0.10 × 3 orders × 2 = 0.60 lots total
```

Trade Management

Auto Close at TP1

· When enabled, closes 50% of each position at TP1
· Remaining 50% continues to TP2/TP3

Move to Breakeven

· Automatically moves stop loss to entry price
· Triggers at 50% of distance to TP1

📊 Signal Format Examples

Supported Formats

```
BUY EURUSD @ 1.0950 SL 1.0920 TP1 1.0980 TP2 1.1000 TP3 1.1020
SELL GOLD Entry: 2050.50 Stop: 2055 TP1: 2040 TP2: 2030
BUY GOLD NOW  # Immediate execution
TP1 HIT       # Close 50% and move to breakeven
```

🌍 Supported Instruments

💱 Forex Pairs

· EURUSD, GBPUSD, USDJPY, USDCHF, AUDUSD, USDCAD, NZDUSD

🥇 Metals

· GOLD/XAUUSD, SILVER/XAGUSD

⚫ Energy & Oil

· OIL/USOIL, UKOIL/BRENT

₿ Cryptocurrencies

· BTCUSD, ETHUSD, XRPUSD, LTCUSD

📊 Indices

· US30, US500, NAS100, UK100, GER30

Total: 80+ Instruments Supported

🔧 Troubleshooting

Common Issues

Bot Not Starting

Problem: "ETELEGRAM: 401 Unauthorized"

```
Solution: Check TELEGRAM_TOKEN in .env file
```

Problem: "Meta API Connection Failed"

```
Solution: Verify META_API_KEY in .env file
```

Account Connection Issues

Problem: "Unable to verify account"

```
Solution: Check credentials and server name
```

❓ FAQ

General Questions

Q: Is this bot free?
A:The bot code is free. You need free Telegram bot, MetaAPI (free tier available), and MT4/MT5 account.

Q: What are the new security features?
A:Version 1.1.0 includes:

· Automatic user cleanup (30-day TTL)
· Maximum user limits (1000 users)
· Secure environment variable setup
· No password examples in commands
· Configurable SSL verification

Security Questions

Q: Why should I use environment variables?
A:Environment variables prevent token hardcoding, keep credentials secure, and allow easy deployment across different environments.

Q: What happens if I exceed user limits?
A:The bot will stop accepting new users and automatically clean up inactive users every 24 hours.

📄 License

MIT License - Feel free to modify and distribute.

⚠️ Disclaimer

Trading Risk Warning:
Trading carries a high level of risk and may not be suitable for all investors.

Software Disclaimer:
This bot is provided"as is" without warranty of any kind. Use at your own risk.

🎉 What's New in Version 1.1.0

Security Improvements

✅ .env.example file - Prevents token hardcoding

✅ Automated setup script - npm run setup creates .env file

✅ User limits & cleanup - 1000 user max, 30-day TTL

✅ Secure command examples - No real passwords in documentation

✅ SSL security - Configurable verification

Setup Improvements

✅ Clear documentation - Environment variable usage

✅ Better security practices - No hardcoded tokens
 
✅ Automatic maintenance - Cleanup of inactive users

🚀 Conclusion

You now have a secure trading copier bot with proper environment variable setup, user limits, and automatic cleanup features.

Happy Trading! 🚀

---

Last Updated: November 2025
Version: 1.1.0
Author: Humble-writer✍️

