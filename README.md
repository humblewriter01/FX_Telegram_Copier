# 🤖 FX Trading Copier

A fully-featured Telegram bot that automatically copies trading signals from Telegram channels to your MT4/MT5 accounts using MetaAPI.

![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)

## 🚨 IMPORTANT SECURITY UPDATE

**Version 1.1.0 addresses critical security issues reported by the community:**

- ✅ **Added `.env.example` file** to prevent token hardcoding
- ✅ **Secure command examples** with `YOUR_PASSWORD` instead of real passwords  
- ✅ **User limits & automatic cleanup** (1000 users max, 30-day TTL)
- ✅ **Proper environment variable setup** with `npm run setup` command

## 📋 Table of Contents

- [Quick Setup](#quick-setup)
- [Security Features](#security-features)
- [Installation](#installation)
- [Deployment](#deployment)
- [Usage Guide](#usage-guide)
- [Commands Reference](#commands-reference)
- [Troubleshooting](#troubleshooting)

## 🚀 Quick Setup

### Step 1: Clone & Setup
```bash
git clone https://github.com/humblewriter01/FX_Telegram_Copier.git
cd FX_Telegram_Copier
npm run setup
```

Step 2: Configure Environment

Edit the created .env file:

```env
TELEGRAM_TOKEN=your_actual_bot_token_here
META_API_KEY=your_actual_metaapi_key_here
WEBHOOK_URL=your_render_url_here
PORT=3000
```

Step 3: Install & Run

```bash
npm install
npm start
```

🔒 Security Features

Environment Variables (No Hardcoding!)

The bot now uses .env.example to prevent token hardcoding:

.env.example (Template - copy to .env):

```env
TELEGRAM_TOKEN=your_telegram_bot_token_here
META_API_KEY=your_metaapi_cloud_key_here
WEBHOOK_URL=your_render_webhook_url_here
PORT=3000

# Security & Performance
MAX_USERS=1000
USER_TTL_DAYS=30
CLEANUP_INTERVAL_HOURS=24
ENABLE_SSL_STRICT=true
```

User Management & Cleanup

· Max 1000 users to prevent resource abuse
· 30-day TTL - Inactive users automatically removed
· 24-hour cleanup - Regular maintenance runs

Secure Command Examples

✅ SECURE (Version 1.1.0):

```bash
/add_mt4 12345678 YOUR_PASSWORD Broker-Server
/add_mt5 87654321 YOUR_PASSWORD Broker-Server
```

❌ INSECURE (Previous versions):

```bash
/add_mt4 12345678 MyP@ssw0rd ICMarkets-Demo01
/add_mt5 87654321 MyP@ssw0rd XMGlobal-Demo
```

📥 Installation

Method 1: Automated Setup (Recommended)

```bash
git clone https://github.com/humblewriter01/FX_Telegram_Copier.git
cd FX_Telegram_Copier
npm run setup        # Creates .env from .env.example
npm install
npm start
```

Method 2: Manual Setup

1. Clone repository
2. Copy .env.example to .env
3. Edit .env with your actual tokens
4. npm install && npm start

☁️ Deployment

Render.com (Recommended)

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

📖 Usage Guide

1. Connect Trading Account

Use secure format:

```bash
/add_mt4 YOUR_LOGIN YOUR_PASSWORD YOUR_BROKER_SERVER
/add_mt5 YOUR_LOGIN YOUR_PASSWORD YOUR_BROKER_SERVER
```

Examples:

```bash
/add_mt4 12345678 YOUR_PASSWORD Broker-Server
/add_mt5 87654321 YOUR_PASSWORD Broker-Server
```

2. Add Signal Channel

```bash
/add_channel @forex_signals
/add_channel -1001234567890
```

3. Configure Settings

```bash
/lot_size 0.10
/num_orders 3
/max_risk 5
```

4. Start Copying

Click "▶️ Start Copying" in the menu

🎮 Commands Reference

Account Management

Command Secure Example
/add_mt4 ID /add_mt4 abc123def456
/add_mt4 LOGIN PASS SERVER 
/add_mt4 12345 YOUR_PASSWORD Broker-Server
/add_mt5 ID /add_mt5 xyz789abc123
/add_mt5 LOGIN PASS SERVER 
/add_mt5 54321 YOUR_PASSWORD Broker-Server

Settings

Command Description
/lot_size VALUE Set base lot size
/num_orders VALUE Set number of orders
/max_risk VALUE Set maximum risk %

🔧 Troubleshooting

Common Issues

Bot not starting:

· Check .env file exists and has correct tokens
· Verify tokens are valid

Account connection failed:

· Use correct server name from your broker
· Check login credentials

Signals not detected:

· Ensure bot is member of signal channel
· Check channel allows bots

🛡️ Security Best Practices

1. Use Environment Variables

Never hardcode tokens in bot.js! Always use .env file.

2. Secure Passwords

· Use YOUR_PASSWORD placeholder in examples
· Never share actual passwords in chats
· Use unique passwords for trading accounts

3. Regular Updates

· Keep bot updated to latest version
· Monitor MetaAPI usage and costs
· Review security settings regularly

## 📞 Support

### 🐛 Bug Reports & Feature Requests
Please use [GitHub Issues](https://github.com/humblewriter01/FX_Telegram_Copier/issues) for:
- Bug reports
- Feature requests
- Documentation issues

### ❓ Community Help
- **Check the [Troubleshooting](#troubleshooting) section first**
- **Read the [FAQ](#faq) for common solutions**
- **Search existing issues before creating new ones**

### 📋 Before Asking for Help
1. What error are you seeing? (include full logs)
2. What steps reproduce the issue?
3. What have you tried already?
4. What's your environment? (Node version, OS, etc.)

### 🚨 Emergency Issues
For critical security issues, please email: **security@yourdomain.com**

Reporting Issues

Include:

· Error message
· /status command output
· Steps to reproduce
· Bot version (1.1.0)

Getting Help

1. Check this README first
2. Use /status command for diagnostics
3. Check MetaAPI documentation

📄 License

MIT License - Feel free to modify and distribute.

⚠️ Disclaimer

Trading involves risk. Always test on demo accounts first. The developers are not responsible for any trading losses.

---
Last Updated: November 2025
Version 1.1.0 - Security Update: Environment variables, user limits, secure examples
Author: Humble-writer✍️

