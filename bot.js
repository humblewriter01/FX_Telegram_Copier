const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');
const https = require('https');

// Configuration with environment variables
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || 'Add your Telegram Bot Token here';
const META_API_KEY = process.env.META_API_KEY || 'Add your metaapi Key here';
const META_API_URL = 'https://mt-client-api-v1.metaapi.cloud';
const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

// Security and cleanup settings
const MAX_USERS = parseInt(process.env.MAX_USERS) || 1000;
const USER_TTL_DAYS = parseInt(process.env.USER_TTL_DAYS) || 30;
const CLEANUP_INTERVAL_HOURS = parseInt(process.env.CLEANUP_INTERVAL_HOURS) || 24;
const ENABLE_SSL_STRICT = process.env.ENABLE_SSL_STRICT !== 'false';

// Initialize Express app FIRST
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize bot with webhook or polling based on environment
let bot;
if (WEBHOOK_URL) {
  // Production mode with webhook
  bot = new TelegramBot(TELEGRAM_TOKEN, { webHook: { port: PORT } });
  bot.setWebHook(`${WEBHOOK_URL}/bot${TELEGRAM_TOKEN}`);
  console.log('🔗 Bot running in WEBHOOK mode');
} else {
  // Development mode with polling
  bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
  console.log('🔗 Bot running in POLLING mode');
}

// User data storage with TTL tracking
const userData = new Map();
const channelMonitors = new Map();
const pendingSignalUpdates = new Map();

// Track user activity for cleanup
const userActivity = new Map();

// Health check endpoints
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Telegram Trading Copier Bot',
    mode: WEBHOOK_URL ? 'webhook' : 'polling',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    bot: 'running',
    timestamp: new Date().toISOString()
  });
});

// Stats endpoint
app.get('/stats', (req, res) => {
  const activeUsers = Array.from(userActivity.entries())
    .filter(([_, timestamp]) => (new Date() - timestamp) < 24 * 60 * 60 * 1000)
    .length;
    
  res.json({
    users: userData.size,
    activeUsers: activeUsers,
    channelMonitors: channelMonitors.size,
    pendingSignals: pendingSignalUpdates.size,
    maxUsers: MAX_USERS,
    userTTLDays: USER_TTL_DAYS,
    serverUptime: process.uptime()
  });
});

// Webhook endpoint for Telegram
if (WEBHOOK_URL) {
  app.post(`/bot${TELEGRAM_TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });
}

// Keep-alive endpoint for Render
app.get('/ping', (req, res) => {
  res.send('pong');
});

// Meta API helper function - SECURE SSL HANDLING
async function metaApiRequest(endpoint, method = 'GET', data = null) {
  try {
    const config = {
      baseURL: META_API_URL,
      timeout: 30000,
      headers: {
        'auth-token': META_API_KEY,
        'Content-Type': 'application/json'
      }
    };
    
    // Only disable SSL verification if explicitly set to false
    if (!ENABLE_SSL_STRICT) {
      config.httpsAgent = new https.Agent({
        rejectUnauthorized: false
      });
      console.warn('⚠️  SSL strict verification is disabled - not recommended for production');
    }
    
    const axiosInstance = axios.create(config);
    
    const response = await axiosInstance({
      method,
      url: endpoint,
      data
    });
    
    return response.data;
  } catch (error) {
    console.error('Meta API Error:', error.response?.data || error.message);
    throw {
      message: error.response?.data?.message || error.message,
      code: error.response?.status,
      details: error.response?.data
    };
  }
}

// Enhanced getUserData with TTL tracking and size limits
function getUserData(userId) {
  // Check if we've reached maximum users
  if (userData.size >= MAX_USERS && !userData.has(userId)) {
    throw new Error(`Maximum user limit reached (${MAX_USERS}). Please try again later.`);
  }
  
  if (!userData.has(userId)) {
    userData.set(userId, {
      mt4Accounts: [],
      mt5Accounts: [],
      signalChannels: [],
      copySettings: {
        lotMultiplier: parseFloat(process.env.DEFAULT_LOT_MULTIPLIER) || 1,
        copyStopLoss: process.env.DEFAULT_COPY_SL !== 'false',
        copyTakeProfit: process.env.DEFAULT_COPY_TP !== 'false',
        maxRisk: parseFloat(process.env.DEFAULT_MAX_RISK) || 5,
        reverseSignals: process.env.DEFAULT_REVERSE_SIGNALS === 'true',
        autoCloseAtTP1: process.env.DEFAULT_AUTO_CLOSE_TP1 !== 'false',
        moveToBreakeven: process.env.DEFAULT_MOVE_BREAKEVEN !== 'false',
        breakEvenTrigger: parseFloat(process.env.DEFAULT_BREAKEVEN_TRIGGER) || 50,
        numberOfOrders: parseInt(process.env.DEFAULT_ORDERS_COUNT) || 1,
        baseLotSize: parseFloat(process.env.DEFAULT_LOT_SIZE) || 0.01
      },
      isActive: false,
      lastProcessedMessages: new Set(),
      createdAt: new Date()
    });
  }
  
  // Update user activity timestamp
  userActivity.set(userId, new Date());
  
  return userData.get(userId);
}

// Periodic cleanup function
function startCleanupRoutine() {
  setInterval(() => {
    console.log('🧹 Starting user data cleanup...');
    const now = new Date();
    const ttlMs = USER_TTL_DAYS * 24 * 60 * 60 * 1000;
    let cleanedCount = 0;
    
    // Clean inactive users
    for (const [userId, lastActivity] of userActivity.entries()) {
      if (now - lastActivity > ttlMs) {
        userData.delete(userId);
        userActivity.delete(userId);
        
        // Clean related data
        for (const [key] of channelMonitors.entries()) {
          if (key.startsWith(`${userId}_`)) {
            channelMonitors.delete(key);
          }
        }
        
        for (const [key] of pendingSignalUpdates.entries()) {
          if (key.startsWith(`${userId}_`)) {
            pendingSignalUpdates.delete(key);
          }
        }
        
        cleanedCount++;
      }
    }
    
    // Clean old pending signals (older than 7 days)
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    for (const [key, signal] of pendingSignalUpdates.entries()) {
      if (signal.timestamp < weekAgo) {
        pendingSignalUpdates.delete(key);
      }
    }
    
    console.log(`🧹 Cleanup completed: ${cleanedCount} inactive users removed`);
    console.log(`📊 Current stats: ${userData.size} active users, ${channelMonitors.size} channel monitors`);
    
  }, CLEANUP_INTERVAL_HOURS * 60 * 60 * 1000);
}

// Keyboard functions
function createMainMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '📊 Connect MT4/MT5', callback_data: 'connect_mt' },
        { text: '📢 Add Signal Channel', callback_data: 'add_channel' }
      ],
      [
        { text: '⚙️ Settings', callback_data: 'settings' },
        { text: '📋 My Accounts', callback_data: 'my_accounts' }
      ],
      [
        { text: '▶️ Start Copying', callback_data: 'start_copy' },
        { text: '⏸️ Stop Copying', callback_data: 'stop_copy' }
      ],
      [
        { text: '📊 Status', callback_data: 'status' },
        { text: '❓ Help', callback_data: 'help' }
      ]
    ]
  };
}

function createMTConnectKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🟦 Connect MT4', callback_data: 'connect_mt4' },
        { text: '🟩 Connect MT5', callback_data: 'connect_mt5' }
      ],
      [
        { text: '🔙 Back to Main', callback_data: 'main_menu' }
      ]
    ]
  };
}

function createSettingsKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '📊 Lot Size', callback_data: 'set_lot_size' },
        { text: '📈 Orders', callback_data: 'set_orders' }
      ],
      [
        { text: '✖️ Multiplier', callback_data: 'set_lot' },
        { text: '🎯 Max Risk', callback_data: 'set_risk' }
      ],
      [
        { text: '🛑 Copy SL', callback_data: 'toggle_sl' },
        { text: '🎯 Copy TP', callback_data: 'toggle_tp' }
      ],
      [
        { text: '🔄 Reverse', callback_data: 'toggle_reverse' },
        { text: '✂️ Auto Close TP1', callback_data: 'toggle_tp1' }
      ],
      [
        { text: '🔒 Move to B.E', callback_data: 'toggle_be' },
        { text: '🔙 Back', callback_data: 'main_menu' }
      ]
    ]
  };
}

function checkMetaApiErrorForFunding(error) {
  return error.message && (
    error.message.includes('funding') || 
    error.message.includes('credit') || 
    error.message.includes('balance') ||
    error.message.includes('payment')
  );
}

// Bot commands
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `
🤖 *Welcome to Trading Copier Bot!*

✅ Connect MT4/MT5 accounts
✅ Monitor signal channels  
✅ Auto-copy trades
✅ Risk management
✅ Real-time execution

Choose an option:
  `, {
    parse_mode: 'Markdown',
    reply_markup: createMainMenuKeyboard()
  });
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, `
📚 *Quick Commands*

/start - Main menu
/add_mt4 LOGIN PASS SERVER - Add MT4
/add_mt5 LOGIN PASS SERVER - Add MT5
/add_channel @username - Add channel
/status - Check status
/lot_size 0.10 - Set lot size
/num_orders 3 - Set order count

*Signal Examples:*
• BUY GOLD @ 2050 SL 2045 TP 2060
• SELL BTCUSD Entry 45000 Stop 46000 TP 43000
• GOLD BUY NOW (immediate)

Need help? Check documentation.
  `, { parse_mode: 'Markdown' });
});

bot.onText(/\/status/, (msg) => {
  const user = getUserData(msg.from.id);
  bot.sendMessage(msg.chat.id, `
📊 *Status*

*Copying:* ${user.isActive ? '🟢 Active' : '🔴 Inactive'}
*MT4 Accounts:* ${user.mt4Accounts.length}
*MT5 Accounts:* ${user.mt5Accounts.length}
*Channels:* ${user.signalChannels.length}

*Settings:*
• Lot: ${user.copySettings.baseLotSize}
• Orders: ${user.copySettings.numberOfOrders}
• Total: ${(user.copySettings.baseLotSize * user.copySettings.numberOfOrders).toFixed(2)} lots
  `, { parse_mode: 'Markdown' });
});

// Handle callback queries
bot.on('callback_query', async (query) => {
  bot.answerCallbackQuery(query.id);
  
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const data = query.data;
  
  if (data === 'main_menu') {
    bot.editMessageText('🏠 Main Menu', {
      chat_id: chatId,
      message_id: query.message.message_id,
      reply_markup: createMainMenuKeyboard()
    });
  }
  else if (data === 'connect_mt') {
    bot.editMessageText('🔌 *Connect MT4/MT5 Account*\n\nChoose platform:', {
      chat_id: chatId,
      message_id: query.message.message_id,
      parse_mode: 'Markdown',
      reply_markup: createMTConnectKeyboard()
    });
  }
  else if (data === 'connect_mt4') {
    bot.sendMessage(chatId, `
🔌 *Connect MT4 Account*

*Option 1: Add existing account from Meta API*
\`/add_mt4 ACCOUNT_ID\`

*Option 2: Create new account directly*
\`/add_mt4 LOGIN PASSWORD SERVER\`

*Examples:*

📋 *Add existing:*
\`/add_mt4 abc123def456789\`

🆕 *Create new:*
\`/add_mt4 12345678 YOUR_PASSWORD Broker-Server\`

💡 *Tips:*
• Get your server name from your broker
• Common servers: ICMarkets-Demo, XMGlobal-Demo, Exness-Demo
• Account will be created and deployed automatically
• You can add multiple accounts

🔒 *Security Note:*
• Never share your actual password in chats
• Use a unique password for trading accounts
• Consider using MetaAPI account IDs for better security
      `, { parse_mode: 'Markdown' });
  }
  else if (data === 'connect_mt5') {
    bot.sendMessage(chatId, `
🔌 *Connect MT5 Account*

*Option 1: Add existing account from Meta API*
\`/add_mt5 ACCOUNT_ID\`

*Option 2: Create new account directly*
\`/add_mt5 LOGIN PASSWORD SERVER\`

*Examples:*

📋 *Add existing:*
\`/add_mt5 abc123def456789\`

🆕 *Create new:*
\`/add_mt5 87654321 YOUR_PASSWORD Broker-Server\`

💡 *Tips:*
• Get your server name from your broker
• Common servers: ICMarkets-Demo, XMGlobal-Demo, Exness-Demo
• Account will be created and deployed automatically
• You can add multiple accounts

🔒 *Security Note:*
• Never share your actual password in chats
• Use a unique password for trading accounts
• Consider using MetaAPI account IDs for better security
      `, { parse_mode: 'Markdown' });
  }
  else if (data === 'add_channel') {
    bot.sendMessage(chatId, `
📢 *Add Signal Channel*

To add a signal channel:

1️⃣ Forward a message from the channel to this bot
OR
2️⃣ Use the command: \`/add_channel @channel_username\`
OR  
3️⃣ Use the command: \`/add_channel CHANNEL_ID\`

*Example:*
\`/add_channel @forex_signals\`
\`/add_channel -1001234567890\`

The bot will monitor this channel for trading signals and copy them automatically.

*Supported signal formats:*
• BUY/SELL EURUSD at 1.0950
• GOLD BUY @ 2050.50 SL 2045 TP 2060
• Short GBPUSD Entry: 1.2650 SL: 1.2680 TP: 1.2600
• GOLD/XAUUSD Buy now (will execute immediately)
      `, { parse_mode: 'Markdown' });
  }
  else if (data === 'list_channels') {
    const userChannels = getUserData(userId);
    if (userChannels.signalChannels.length === 0) {
      bot.sendMessage(chatId, '📢 No signal channels added yet.\n\nUse "Add Signal Channel" or forward a message from a channel.');
    } else {
      let channelsMsg = '📢 *Your Signal Channels:*\n\n';
      userChannels.signalChannels.forEach((channel, index) => {
        channelsMsg += `${index + 1}. ${channel.title}\n`;
        channelsMsg += `   ID: \`${channel.id}\`\n`;
        if (channel.username) {
          channelsMsg += `   @${channel.username}\n`;
        }
        channelsMsg += '\n';
      });
      channelsMsg += `Total: ${userChannels.signalChannels.length} channel(s)`;
      bot.sendMessage(chatId, channelsMsg, { parse_mode: 'Markdown' });
    }
  }
  else if (data === 'settings') {
    const user = getUserData(userId);
    bot.editMessageText(`
⚙️ *Copy Settings*

*Current Settings:*
• Base Lot Size: ${user.copySettings.baseLotSize}
• Number of Orders: ${user.copySettings.numberOfOrders}
• Lot Multiplier: ${user.copySettings.lotMultiplier}x
• Max Risk: ${user.copySettings.maxRisk}%
• Copy Stop Loss: ${user.copySettings.copyStopLoss ? '✅' : '❌'}
• Copy Take Profit: ${user.copySettings.copyTakeProfit ? '✅' : '❌'}
• Reverse Signals: ${user.copySettings.reverseSignals ? '✅' : '❌'}
• Auto Close TP1: ${user.copySettings.autoCloseAtTP1 ? '✅' : '❌'}
• Move to Breakeven: ${user.copySettings.moveToBreakeven ? '✅' : '❌'}

💡 *Example:*
If you set 3 orders × 0.10 lot = 0.30 total volume per signal

Choose a setting to modify:
    `, {
      chat_id: chatId,
      message_id: query.message.message_id,
      parse_mode: 'Markdown',
      reply_markup: createSettingsKeyboard()
    });
  }
  else if (data === 'set_lot_size') {
    bot.sendMessage(chatId, '📊 *Set Base Lot Size*\n\nThis is the lot size for EACH order.\n\nSend: `/lot_size VALUE`\n\nExample: `/lot_size 0.10`\n\n💡 If you set 3 orders × 0.10 lot = 0.30 total', { parse_mode: 'Markdown' });
  }
  else if (data === 'set_orders') {
    bot.sendMessage(chatId, '📈 *Set Number of Orders*\n\nHow many orders to open per signal (1-10)\n\nSend: `/num_orders VALUE`\n\nExample: `/num_orders 3`\n\n💡 Each order will have the same lot size', { parse_mode: 'Markdown' });
  }
  else if (data === 'set_lot') {
    bot.sendMessage(chatId, '✖️ *Set Lot Multiplier*\n\nMultiply lot sizes by this value\n\nSend: `/lot_multiplier VALUE`\n\nExample: `/lot_multiplier 2`\n\n💡 This affects all orders', { parse_mode: 'Markdown' });
  }
  else if (data === 'set_risk') {
    bot.sendMessage(chatId, '🎯 *Set Max Risk*\n\nSend: `/max_risk PERCENTAGE`\n\nExample: `/max_risk 3`', { parse_mode: 'Markdown' });
  }
  else if (data === 'toggle_sl') {
    const userSL = getUserData(userId);
    userSL.copySettings.copyStopLoss = !userSL.copySettings.copyStopLoss;
    bot.sendMessage(chatId, `✅ Copy Stop Loss: ${userSL.copySettings.copyStopLoss ? 'Enabled' : 'Disabled'}`);
  }
  else if (data === 'toggle_tp') {
    const userTP = getUserData(userId);
    userTP.copySettings.copyTakeProfit = !userTP.copySettings.copyTakeProfit;
    bot.sendMessage(chatId, `✅ Copy Take Profit: ${userTP.copySettings.copyTakeProfit ? 'Enabled' : 'Disabled'}`);
  }
  else if (data === 'toggle_reverse') {
    const userRev = getUserData(userId);
    userRev.copySettings.reverseSignals = !userRev.copySettings.reverseSignals;
    bot.sendMessage(chatId, `✅ Reverse Signals: ${userRev.copySettings.reverseSignals ? 'Enabled (BUY↔️SELL)' : 'Disabled'}`);
  }
  else if (data === 'toggle_tp1') {
    const userTP1 = getUserData(userId);
    userTP1.copySettings.autoCloseAtTP1 = !userTP1.copySettings.autoCloseAtTP1;
    bot.sendMessage(chatId, `✅ Auto Close at TP1: ${userTP1.copySettings.autoCloseAtTP1 ? 'Enabled ✂️' : 'Disabled'}`);
  }
  else if (data === 'toggle_be') {
    const userBE = getUserData(userId);
    userBE.copySettings.moveToBreakeven = !userBE.copySettings.moveToBreakeven;
    bot.sendMessage(chatId, `✅ Move to Breakeven: ${userBE.copySettings.moveToBreakeven ? 'Enabled 🔒' : 'Disabled'}`);
  }
  else if (data === 'my_accounts') {
    await showMyAccounts(chatId, userId);
  }
  else if (data === 'start_copy') {
    await startCopying(chatId, userId);
  }
  else if (data === 'stop_copy') {
    stopCopying(chatId, userId);
  }
  else if (data === 'status') {
    await showStatus(chatId, userId);
  }
  else if (data === 'help') {
    showHelp(chatId);
  }
});

// Add MT4 account with enhanced error handling
bot.onText(/\/add_mt4 (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const params = match[1].trim().split(' ');
  const user = getUserData(userId);
  
  try {
    let accountId;
    
    if (params.length === 1) {
      // Just account ID provided
      accountId = params[0];
      
      // Verify account exists in Meta API
      const account = await metaApiRequest(`/users/current/accounts/${accountId}`);
      
      if (account.platform !== 'mt4') {
        bot.sendMessage(chatId, '❌ This account is not an MT4 account. Please check the platform type.');
        return;
      }
      
      user.mt4Accounts.push({ id: accountId, login: account.login, name: account.name });
      bot.sendMessage(chatId, `✅ MT4 Account connected!\nID: ${accountId}\nLogin: ${account.login}\nName: ${account.name}`);
      
    } else if (params.length === 3) {
      // Login, password, server provided - create new account
      const [login, password, server] = params;
      
      bot.sendMessage(chatId, '⏳ Creating and deploying MT4 account...');
      
      const accountData = {
        name: `MT4-${login}`,
        type: 'cloud',
        login: login,
        password: password,
        server: server,
        platform: 'mt4',
        magic: 0
      };
      
      const newAccount = await metaApiRequest('/users/current/accounts', 'POST', accountData);
      accountId = newAccount.id;
      
      // Deploy account
      await metaApiRequest(`/users/current/accounts/${accountId}/deploy`, 'POST');
      
      // Wait for deployment
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check account status
      const accountStatus = await metaApiRequest(`/users/current/accounts/${accountId}`);
      
      user.mt4Accounts.push({ id: accountId, login: login, name: `MT4-${login}` });
      
      bot.sendMessage(chatId, `✅ MT4 Account created and deployed!\n\nID: ${accountId}\nLogin: ${login}\nServer: ${server}\nStatus: ${accountStatus.state}\n\n⚠️ Note: It may take a few moments for the account to fully connect.`);
      
    } else {
      bot.sendMessage(chatId, '❌ Invalid format.\n\n*Option 1: Add existing account*\n\`/add_mt4 ACCOUNT_ID\`\n\n*Option 2: Create new account*\n\`/add_mt4 LOGIN PASSWORD SERVER\`\n\nExample:\n\`/add_mt4 abc123def456\`\nor\n\`/add_mt4 12345678 YOUR_PASSWORD Broker-Server\`', { parse_mode: 'Markdown' });
      return;
    }
    
  } catch (error) {
    let errorMessage = `❌ Error adding MT4 account: ${error.message}`;
    
    // Check for specific error types
    if (error.code === 401 || (error.message && error.message.includes('token'))) {
      errorMessage += '\n\n🔑 *API Token Issue:*\n• Check if your MetaAPI token is valid\n• Token might be expired or revoked\n• Get new token from https://metaapi.cloud';
    } 
    else if (checkMetaApiErrorForFunding(error)) {
      errorMessage += '\n\n💰 *Funding Required:*\n• Your MetaAPI account needs funding\n• Visit https://metaapi.cloud to add credits\n• Free tier available for testing';
    }
    else if (error.message && (error.message.includes('server') || error.message.includes('broker'))) {
      errorMessage += '\n\n🔧 *Server/Broker Issue:*\n• Check broker server name\n• Verify login credentials\n• Ensure broker allows API connections';
    }
    else if (error.message && (error.message.includes('deploy') || error.message.includes('connection'))) {
      errorMessage += '\n\n🌐 *Connection Issue:*\n• Broker server might be down\n• Try different server/demo account\n• Wait and retry in few minutes';
    }
    
    bot.sendMessage(chatId, errorMessage, { parse_mode: 'Markdown' });
  }
});

// Add MT5 account with enhanced error handling - SECURE SSL HANDLING
bot.onText(/\/add_mt5 (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const params = match[1].trim().split(' ');
  const user = getUserData(userId);
  
  try {
    let accountId;
    
    if (params.length === 1) {
      // Just account ID provided
      accountId = params[0];
      
      // Verify account exists in Meta API
      const account = await metaApiRequest(`/users/current/accounts/${accountId}`);
      
      if (account.platform !== 'mt5') {
        bot.sendMessage(chatId, '❌ This account is not an MT5 account. Please check the platform type.');
        return;
      }
      
      user.mt5Accounts.push({ id: accountId, login: account.login, name: account.name });
      bot.sendMessage(chatId, `✅ MT5 Account connected!\nID: ${accountId}\nLogin: ${account.login}\nName: ${account.name}`);
      
    } else if (params.length === 3) {
      // Login, password, server provided - create new account
      const [login, password, server] = params;
      
      bot.sendMessage(chatId, '⏳ Creating and deploying MT5 account...');
      
      const accountData = {
        name: `MT5-${login}`,
        type: 'cloud',
        login: login,
        password: password,
        server: server,
        platform: 'mt5',
        magic: 0
      };
      
      const newAccount = await metaApiRequest('/users/current/accounts', 'POST', accountData);
      accountId = newAccount.id;
      
      // Deploy account
      await metaApiRequest(`/users/current/accounts/${accountId}/deploy`, 'POST');
      
      // Wait for deployment
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check account status
      const accountStatus = await metaApiRequest(`/users/current/accounts/${accountId}`);
      
      user.mt5Accounts.push({ id: accountId, login: login, name: `MT5-${login}` });
      
      bot.sendMessage(chatId, `✅ MT5 Account created and deployed!\n\nID: ${accountId}\nLogin: ${login}\nServer: ${server}\nStatus: ${accountStatus.state}\n\n⚠️ Note: It may take a few moments for the account to fully connect.`);
      
    } else {
      bot.sendMessage(chatId, '❌ Invalid format.\n\n*Option 1: Add existing account*\n\`/add_mt5 ACCOUNT_ID\`\n\n*Option 2: Create new account*\n\`/add_mt5 LOGIN PASSWORD SERVER\`\n\nExample:\n\`/add_mt5 abc123def456\`\nor\n\`/add_mt5 87654321 YOUR_PASSWORD Broker-Server\`', { parse_mode: 'Markdown' });
      return;
    }
    
  } catch (error) {
    let errorMessage = `❌ Error adding MT5 account: ${error.message}`;
    
    // Check for specific error types
    if (error.code === 401 || (error.message && error.message.includes('token'))) {
      errorMessage += '\n\n🔑 *API Token Issue:*\n• Check if your MetaAPI token is valid\n• Token might be expired or revoked\n• Get new token from https://metaapi.cloud';
    } 
    else if (checkMetaApiErrorForFunding(error)) {
      errorMessage += '\n\n💰 *Funding Required:*\n• Your MetaAPI account needs funding\n• Visit https://metaapi.cloud to add credits\n• Free tier available for testing';
    }
    else if (error.message && (error.message.includes('server') || error.message.includes('broker'))) {
      errorMessage += '\n\n🔧 *Server/Broker Issue:*\n• Check broker server name\n• Verify login credentials\n• Ensure broker allows API connections';
    }
    else if (error.message && (error.message.includes('deploy') || error.message.includes('connection'))) {
      errorMessage += '\n\n🌐 *Connection Issue:*\n• Broker server might be down\n• Try different server/demo account\n• Wait and retry in few minutes';
    }
    
    bot.sendMessage(chatId, errorMessage, { parse_mode: 'Markdown' });
  }
});

// Add signal channel
bot.onText(/\/add_channel (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const channelIdentifier = match[1].trim();
  const user = getUserData(userId);
  
  try {
    let channelInfo;
    
    // Get channel information
    if (channelIdentifier.startsWith('@')) {
      channelInfo = await bot.getChat(channelIdentifier);
    } else {
      channelInfo = await bot.getChat(channelIdentifier);
    }
    
    const channelData = {
      id: channelInfo.id,
      title: channelInfo.title || channelIdentifier,
      username: channelInfo.username || null
    };
    
    // Check if already added
    if (user.signalChannels.some(ch => ch.id === channelData.id)) {
      bot.sendMessage(chatId, '⚠️ This channel is already added! Use /list_channels to see all your channels.');
      return;
    }
    
    user.signalChannels.push(channelData);
    
    // Start monitoring this channel
    startChannelMonitoring(userId, chatId, channelData);
    
    bot.sendMessage(chatId, `✅ Signal channel added!\n\n📢 Channel: ${channelData.title}\nID: ${channelData.id}\n\nUse /list_channels to see all your channels.`);
  } catch (error) {
    bot.sendMessage(chatId, `❌ Error adding channel: ${error.message}\n\nMake sure:\n1. The channel ID/username is correct\n2. The bot is a member of the channel\n3. The channel allows bots`);
  }
});

// List channels command
bot.onText(/\/list_channels/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const user = getUserData(userId);
  
  if (user.signalChannels.length === 0) {
    bot.sendMessage(chatId, '📢 No signal channels added yet.\n\nUse /add_channel or forward a message from a channel.');
    return;
  }
  
  let message = '📢 *Your Signal Channels:*\n\n';
  user.signalChannels.forEach((channel, index) => {
    message += `${index + 1}. ${channel.title}\n`;
    message += `   ID: \`${channel.id}\`\n`;
    if (channel.username) {
      message += `   @${channel.username}\n`;
    }
    message += '\n';
  });
  
  message += `Total: ${user.signalChannels.length} channel(s)`;
  
  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

// Handle forwarded messages (for adding channels)
bot.on('message', async (msg) => {
  if (msg.forward_from_chat && msg.forward_from_chat.type === 'channel') {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const user = getUserData(userId);
    const channel = msg.forward_from_chat;
    
    const channelData = {
      id: channel.id,
      title: channel.title,
      username: channel.username || null
    };
    
    if (!user.signalChannels.some(ch => ch.id === channelData.id)) {
      user.signalChannels.push(channelData);
      startChannelMonitoring(userId, chatId, channelData);
      
      bot.sendMessage(chatId, `✅ Signal channel added from forwarded message!\n\n📢 Channel: ${channelData.title}\nID: ${channelData.id}\n\nUse /list_channels to see all your channels.`);
    } else {
      bot.sendMessage(chatId, '⚠️ This channel is already in your list!\n\nUse /list_channels to see all your channels.');
    }
  }
});

// Parse trading signal from text with immediate execution support
function parseSignal(text) {
  const signal = {
    action: null,
    symbol: null,
    entry: null,
    stopLoss: null,
    takeProfit: null,
    tp1: null,
    tp2: null,
    tp3: null,
    immediate: false, // Flag for immediate execution
    hasTPUpdate: false, // Flag for TP updates in follow-up messages
    originalText: text
  };
  
  const upperText = text.toUpperCase();
  
  // Detect action (BUY/SELL/LONG/SHORT)
  if (upperText.includes('BUY') || upperText.includes('LONG')) {
    signal.action = 'BUY';
  } else if (upperText.includes('SELL') || upperText.includes('SHORT')) {
    signal.action = 'SELL';
  } else {
    return null;
  }
  
  // Common forex pairs and instruments
  const instruments = [
    // Forex Major Pairs
    'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD',
    // Forex Minor Pairs
    'EURGBP', 'EURJPY', 'GBPJPY', 'EURCHF', 'AUDJPY', 'GBPAUD', 'EURAUD', 'NZDJPY',
    'GBPCAD', 'EURCAD', 'AUDCAD', 'AUDNZD', 'GBPNZD', 'EURNZD', 'CHFJPY', 'CADCHF',
    // Metals
    'GOLD', 'XAUUSD', 'SILVER', 'XAGUSD', 'XAUEUR', 'XAUAUD', 'XAUJPY',
    // Oil & Energy
    'OIL', 'USOIL', 'UKOIL', 'CRUDE', 'WTI', 'BRENT', 'NGAS', 'NATURALGAS',
    // Crypto
    'BTCUSD', 'BITCOIN', 'BTC', 'ETHUSD', 'ETHEREUM', 'ETH', 'XRPUSD', 'LTCUSD',
    'BCHUSD', 'ADAUSD', 'DOGUSD', 'DOGEUSD', 'SOLUSD', 'BNBUSD', 'MATICUSD',
    // Indices
    'US30', 'DOW', 'DOWJONES', 'US500', 'SPX500', 'SP500', 'NAS100', 'NASDAQ',
    'UK100', 'FTSE', 'GER30', 'DAX', 'FRA40', 'CAC', 'JPN225', 'NIKKEI',
    'AUS200', 'HK50', 'CHINA50', 'EUSTX50', 'SPA35',
    // Commodities
    'COPPER', 'PLATINUM', 'PALLADIUM', 'COCOA', 'COFFEE', 'SUGAR', 'COTTON',
    'WHEAT', 'CORN', 'SOYBEAN'
  ];
  
  // Symbol normalization map
  const symbolMap = {
    'GOLD': 'XAUUSD',
    'SILVER': 'XAGUSD',
    'OIL': 'USOIL',
    'CRUDE': 'USOIL',
    'WTI': 'USOIL',
    'BRENT': 'UKOIL',
    'BITCOIN': 'BTCUSD',
    'BTC': 'BTCUSD',
    'ETHEREUM': 'ETHUSD',
    'ETH': 'ETHUSD',
    'DOW': 'US30',
    'DOWJONES': 'US30',
    'SPX500': 'US500',
    'SP500': 'US500',
    'NASDAQ': 'NAS100',
    'FTSE': 'UK100',
    'DAX': 'GER30',
    'CAC': 'FRA40',
    'NIKKEI': 'JPN225',
    'NATURALGAS': 'NGAS'
  };
  
  for (const inst of instruments) {
    if (upperText.includes(inst)) {
      signal.symbol = symbolMap[inst] || inst;
      break;
    }
  }
  
  if (!signal.symbol) return null;
  
  // Check for immediate execution keywords
  const immediateKeywords = ['NOW', 'IMMEDIATE', 'CURRENT', 'MARKET', 'INSTANT', 'QUICK'];
  if (immediateKeywords.some(keyword => upperText.includes(keyword))) {
    signal.immediate = true;
    signal.entry = 'MARKET'; // Use market price
  }
  
  // Check for TP/SL updates in follow-up messages
  const updateKeywords = ['TP HIT', 'TP1 HIT', 'TAKE PROFIT', 'BREAKEVEN', 'CLOSE', 'EXIT'];
  if (updateKeywords.some(keyword => upperText.includes(keyword))) {
    signal.hasTPUpdate = true;
  }
  
  // Extract prices
  const priceRegex = /(\d+\.?\d*)/g;
  const prices = text.match(priceRegex);
  
  if (prices && prices.length > 0) {
    // Entry price
    const entryMatch = text.match(/(?:entry|@|at|price)[:\s]+(\d+\.?\d*)/i);
    if (entryMatch) {
      signal.entry = parseFloat(entryMatch[1]);
    } else if (!signal.immediate) {
      signal.entry = parseFloat(prices[0]);
    }
    
    // Stop Loss
    const slMatch = text.match(/(?:sl|stop\s*loss|stop)[:\s]+(\d+\.?\d*)/i);
    if (slMatch) {
      signal.stopLoss = parseFloat(slMatch[1]);
    }
    
    // Take Profit levels (TP1, TP2, TP3)
    const tp1Match = text.match(/(?:tp\s*1|take\s*profit\s*1|target\s*1)[:\s]+(\d+\.?\d*)/i);
    const tp2Match = text.match(/(?:tp\s*2|take\s*profit\s*2|target\s*2)[:\s]+(\d+\.?\d*)/i);
    const tp3Match = text.match(/(?:tp\s*3|take\s*profit\s*3|target\s*3)[:\s]+(\d+\.?\d*)/i);
    
    if (tp1Match) {
      signal.tp1 = parseFloat(tp1Match[1]);
      signal.takeProfit = signal.tp1; // Default TP is TP1
    }
    if (tp2Match) {
      signal.tp2 = parseFloat(tp2Match[1]);
    }
    if (tp3Match) {
      signal.tp3 = parseFloat(tp3Match[1]);
    }
    
    // Generic TP if no TP1/TP2/TP3 specified
    if (!signal.tp1) {
      const tpMatch = text.match(/(?:tp|take\s*profit|target)[:\s]+(\d+\.?\d*)/i);
      if (tpMatch) {
        signal.takeProfit = parseFloat(tpMatch[1]);
        signal.tp1 = signal.takeProfit;
      }
    }
  }
  
  return signal;
}

// Store pending signal for TP/SL updates
function storePendingSignal(userId, channelId, signal) {
  const key = `${userId}_${channelId}_${signal.symbol}`;
  pendingSignalUpdates.set(key, {
    signal: signal,
    timestamp: Date.now(),
    positions: [] // Store position IDs for updates
  });
}

// Get pending signal for updates
function getPendingSignal(userId, channelId, symbol) {
  const key = `${userId}_${channelId}_${symbol}`;
  return pendingSignalUpdates.get(key);
}

// Start monitoring a channel
function startChannelMonitoring(userId, chatId, channelData) {
  const monitorKey = `${userId}_${channelData.id}`;
  
  if (channelMonitors.has(monitorKey)) {
    return; // Already monitoring
  }
  
  // Listen for channel posts
  bot.on('channel_post', async (msg) => {
    if (msg.chat.id === channelData.id) {
      const user = getUserData(userId);
      
      if (!user.isActive) return;
      
      // Avoid processing the same message twice
      const msgId = `${msg.chat.id}_${msg.message_id}`;
      if (user.lastProcessedMessages.has(msgId)) return;
      user.lastProcessedMessages.add(msgId);
      
      // Parse signal from message
      const signal = parseSignal(msg.text || '');
      
      if (signal && signal.action && signal.symbol) {
        // Apply reverse if enabled
        if (user.copySettings.reverseSignals) {
          signal.action = signal.action === 'BUY' ? 'SELL' : 'BUY';
        }
        
        let signalMessage = `
🔔 *Signal Detected!*

📢 Channel: ${channelData.title}
${signal.action === 'BUY' ? '📈' : '📉'} Action: *${signal.action}*
💱 Symbol: *${signal.symbol}*`;

        if (signal.immediate) {
          signalMessage += `\n⚡ *IMMEDIATE EXECUTION*`;
        }
        if (signal.entry && signal.entry !== 'MARKET') {
          signalMessage += `\n💰 Entry: ${signal.entry}`;
        } else if (signal.immediate) {
          signalMessage += `\n💰 Entry: MARKET PRICE`;
        }
        if (signal.stopLoss) {
          signalMessage += `\n🛑 SL: ${signal.stopLoss}`;
        }
        if (signal.tp1) {
          signalMessage += `\n🎯 TP1: ${signal.tp1}`;
        }
        if (signal.tp2) {
          signalMessage += `\n🎯 TP2: ${signal.tp2}`;
        }
        if (signal.tp3) {
          signalMessage += `\n🎯 TP3: ${signal.tp3}`;
        }

        signalMessage += `\n\n${user.copySettings.autoCloseAtTP1 ? '✂️ Will close 50% at TP1' : ''}`;
        signalMessage += `\n${user.copySettings.moveToBreakeven ? '🔒 Will move SL to B.E after TP1' : ''}`;

        // Check if this is a TP update message
        if (signal.hasTPUpdate) {
          signalMessage += `\n\n🔄 *TP UPDATE DETECTED* - Updating positions...`;
          await handleTPUpdate(userId, chatId, channelData.id, signal);
        } else {
          signalMessage += `\n\nExecuting on target accounts...`;
        }

        bot.sendMessage(chatId, signalMessage, { parse_mode: 'Markdown' });
        
        if (!signal.hasTPUpdate) {
          // Store signal for potential TP/SL updates
          storePendingSignal(userId, channelData.id, signal);
          
          // Execute on all target accounts
          await executeSignalOnAccounts(userId, chatId, signal, channelData.id);
        }
      }
    }
  });
  
  channelMonitors.set(monitorKey, true);
}

// Handle TP update messages (TP hit, breakeven, close)
async function handleTPUpdate(userId, chatId, channelId, signal) {
  const user = getUserData(userId);
  const allAccounts = [...user.mt4Accounts, ...user.mt5Accounts];
  
  const pendingSignal = getPendingSignal(userId, channelId, signal.symbol);
  
  if (!pendingSignal) {
    bot.sendMessage(chatId, `⚠️ No active positions found for ${signal.symbol} to update.`);
    return;
  }
  
  let updateCount = 0;
  
  for (const account of allAccounts) {
    try {
      // Get current positions
      const positions = await metaApiRequest(`/users/current/accounts/${account.id}/positions`);
      const symbolPositions = positions.filter(p => p.symbol === signal.symbol);
      
      for (const position of symbolPositions) {
        if (signal.originalText.toUpperCase().includes('TP HIT') || signal.originalText.toUpperCase().includes('TP1 HIT')) {
          // Close 50% at TP1 if auto-close enabled
          if (user.copySettings.autoCloseAtTP1) {
            const halfVolume = position.volume / 2;
            await metaApiRequest(
              `/users/current/accounts/${account.id}/positions/${position.id}/close-partially`,
              'POST',
              { volume: halfVolume }
            );
            bot.sendMessage(chatId, `✂️ Closed 50% at TP1!\n💱 ${signal.symbol}\n📊 Account: ${account.login}`);
            updateCount++;
          }
          
          // Move to breakeven
          if (user.copySettings.moveToBreakeven) {
            await metaApiRequest(
              `/users/current/accounts/${account.id}/positions/${position.id}/modify`,
              'PUT',
              { stopLoss: position.openPrice }
            );
            bot.sendMessage(chatId, `🔒 Moved to BREAKEVEN!\n💱 ${signal.symbol}\n📊 Account: ${account.login}`);
            updateCount++;
          }
        }
        
        // Full close signal
        if (signal.originalText.toUpperCase().includes('CLOSE') || signal.originalText.toUpperCase().includes('EXIT')) {
          await metaApiRequest(
            `/users/current/accounts/${account.id}/positions/${position.id}/close`,
            'POST'
          );
          bot.sendMessage(chatId, `🔴 Closed position!\n💱 ${signal.symbol}\n📊 Account: ${account.login}`);
            updateCount++;
        }
      }
    } catch (error) {
      bot.sendMessage(chatId, `❌ Error updating position on ${account.login}: ${error.message}`);
    }
  }
  
  if (updateCount === 0) {
    bot.sendMessage(chatId, `ℹ️ No positions needed updates for ${signal.symbol}`);
  }
}

// Execute signal on target accounts with immediate execution support
async function executeSignalOnAccounts(userId, chatId, signal, channelId = null) {
  const user = getUserData(userId);
  const allAccounts = [...user.mt4Accounts, ...user.mt5Accounts];
  
  if (allAccounts.length === 0) {
    bot.sendMessage(chatId, '⚠️ No target accounts configured!');
    return;
  }
  
  const numberOfOrders = user.copySettings.numberOfOrders;
  const baseLotSize = user.copySettings.baseLotSize;
  const lotMultiplier = user.copySettings.lotMultiplier;
  
  let totalExecuted = 0;
  
  for (const account of allAccounts) {
    try {
      let successCount = 0;
      let totalVolume = 0;
      
      // Open multiple orders
      for (let i = 0; i < numberOfOrders; i++) {
        const tradeData = {
          actionType: signal.action === 'BUY' ? 'ORDER_TYPE_BUY' : 'ORDER_TYPE_SELL',
          symbol: signal.symbol,
          volume: baseLotSize * lotMultiplier
        };
        
        // For immediate execution, use market execution
        if (signal.immediate) {
          tradeData.actionType += '_MARKET';
        } else if (signal.entry) {
          tradeData.openPrice = signal.entry;
        }
        
        // Add SL/TP if available (can be added later for immediate signals)
        if (signal.stopLoss && user.copySettings.copyStopLoss) {
          tradeData.stopLoss = signal.stopLoss;
        }
        
        if (user.copySettings.copyTakeProfit) {
          if (signal.tp1) {
            tradeData.takeProfit = signal.tp1;
          } else if (signal.takeProfit) {
            tradeData.takeProfit = signal.takeProfit;
          }
        }
        
        const result = await metaApiRequest(`/users/current/accounts/${account.id}/trade`, 'POST', tradeData);
        
        successCount++;
        totalVolume += tradeData.volume;
        totalExecuted++;
        
        // Store position for potential updates
        if (result && result.positionId && channelId) {
          const pendingKey = `${userId}_${channelId}_${signal.symbol}`;
          const pendingSignal = pendingSignalUpdates.get(pendingKey);
          if (pendingSignal) {
            pendingSignal.positions.push({
              accountId: account.id,
              positionId: result.positionId,
              symbol: signal.symbol
            });
          }
        }
        
        // Start monitoring for TP1 hit and breakeven
        if (result && result.positionId && user.copySettings.moveToBreakeven && signal.tp1) {
          monitorPositionForBreakeven(userId, chatId, account.id, result.positionId, signal);
        }
        
        // Small delay between orders to avoid rate limiting
        if (i < numberOfOrders - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      bot.sendMessage(chatId, `✅ ${successCount} order(s) executed on ${account.login}\n💰 Total Volume: ${totalVolume} lots`);
      
    } catch (error) {
      let errorMsg = `❌ Error on account ${account.login}: ${error.message}`;
      
      if (checkMetaApiErrorForFunding(error)) {
        errorMsg += '\n\n💰 *MetaAPI Funding Required* - Visit https://metaapi.cloud';
      }
      
      bot.sendMessage(chatId, errorMsg, { parse_mode: 'Markdown' });
    }
  }
  
  if (signal.immediate && (!signal.stopLoss || !signal.takeProfit)) {
    bot.sendMessage(chatId, `⚡ *Immediate Execution Complete*\n\n💱 ${signal.symbol}\n📊 ${totalExecuted} orders executed\n\n⚠️ *Note:* Waiting for SL/TP instructions to update positions...`);
  }
}

// Monitor position and move to breakeven when TP1 is hit
async function monitorPositionForBreakeven(userId, chatId, accountId, positionId, signal) {
  const user = getUserData(userId);
  
  const checkInterval = setInterval(async () => {
    try {
      if (!user.isActive) {
        clearInterval(checkInterval);
        return;
      }
      
      // Get current position
      const positions = await metaApiRequest(`/users/current/accounts/${accountId}/positions`);
      const position = positions.find(p => p.id === positionId);
      
      if (!position) {
        // Position closed
        clearInterval(checkInterval);
        return;
      }
      
      const currentPrice = position.currentPrice;
      const entryPrice = signal.entry || position.openPrice;
      const tp1Price = signal.tp1;
      
      if (!tp1Price) {
        clearInterval(checkInterval);
        return;
      }
      
      // Calculate if price has moved towards TP1
      let distanceToTP1, progressToTP1;
      
      if (signal.action === 'BUY') {
        distanceToTP1 = tp1Price - entryPrice;
        progressToTP1 = currentPrice - entryPrice;
      } else {
        distanceToTP1 = entryPrice - tp1Price;
        progressToTP1 = entryPrice - currentPrice;
      }
      
      const percentProgress = (progressToTP1 / distanceToTP1) * 100;
      
      // Move to breakeven when price reaches specified % of distance to TP1
      if (percentProgress >= user.copySettings.breakEvenTrigger && position.stopLoss !== entryPrice) {
        // Modify position to move SL to breakeven
        await metaApiRequest(
          `/users/current/accounts/${accountId}/positions/${positionId}/modify`,
          'PUT',
          { stopLoss: entryPrice }
        );
        
        bot.sendMessage(chatId, `🔒 Position moved to BREAKEVEN!\n💱 ${signal.symbol}\n📊 Account: ${accountId}`);
        
        // If auto-close at TP1 is enabled, close 50% of position
        if (user.copySettings.autoCloseAtTP1 && percentProgress >= 100) {
          const halfVolume = position.volume / 2;
          
          await metaApiRequest(
            `/users/current/accounts/${accountId}/positions/${positionId}/close-partially`,
            'POST',
            { volume: halfVolume }
          );
          
          bot.sendMessage(chatId, `✂️ Closed 50% at TP1!\n💱 ${signal.symbol}\n💰 TP1: ${tp1Price}\n📊 Account: ${accountId}`);
        }
        
        clearInterval(checkInterval);
      }
      
    } catch (error) {
      console.error('Error monitoring position:', error);
    }
  }, 5000); // Check every 5 seconds
  
  // Stop monitoring after 24 hours
  setTimeout(() => {
    clearInterval(checkInterval);
  }, 24 * 60 * 60 * 1000);
}

// Show user accounts
async function showMyAccounts(chatId, userId) {
  const user = getUserData(userId);
  
  let message = '📋 *My Connected Accounts*\n\n';
  
  if (user.mt4Accounts.length > 0) {
    message += '🟦 *MT4 Accounts:*\n';
    user.mt4Accounts.forEach((acc, idx) => {
      message += `${idx + 1}. ${acc.name || 'MT4 Account'}\n`;
      message += `   ID: \`${acc.id}\`\n`;
      message += `   Login: ${acc.login}\n\n`;
    });
  }
  
  if (user.mt5Accounts.length > 0) {
    message += '🟩 *MT5 Accounts:*\n';
    user.mt5Accounts.forEach((acc, idx) => {
      message += `${idx + 1}. ${acc.name || 'MT5 Account'}\n`;
      message += `   ID: \`${acc.id}\`\n`;
      message += `   Login: ${acc.login}\n\n`;
    });
  }
  
  if (user.signalChannels.length > 0) {
    message += '📢 *Signal Channels:*\n';
    user.signalChannels.forEach((ch, idx) => {
      message += `${idx + 1}. ${ch.title}\n`;
      message += `   ID: \`${ch.id}\`\n`;
      if (ch.username) {
        message += `   @${ch.username}\n`;
      }
      message += '\n';
    });
  }
  
  if (user.mt4Accounts.length === 0 && user.mt5Accounts.length === 0 && user.signalChannels.length === 0) {
    message += '⚠️ No accounts or channels configured yet.';
  }
  
  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

// Start copying
async function startCopying(chatId, userId) {
  const user = getUserData(userId);
  
  if (user.signalChannels.length === 0) {
    bot.sendMessage(chatId, '❌ Please add at least one signal channel first!');
    return;
  }
  
  if (user.mt4Accounts.length === 0 && user.mt5Accounts.length === 0) {
    bot.sendMessage(chatId, '❌ Please connect at least one MT4/MT5 account first!');
    return;
  }
  
  user.isActive = true;
  bot.sendMessage(chatId, '✅ Trade copying started! Monitoring all signal channels...');
}

// Stop copying
function stopCopying(chatId, userId) {
  const user = getUserData(userId);
  user.isActive = false;
  bot.sendMessage(chatId, '🛑 Trade copying stopped.');
}

// Show status
async function showStatus(chatId, userId) {
  const user = getUserData(userId);
  
  const status = `
📊 *Current Status*

*Copying:* ${user.isActive ? '🟢 Active' : '🔴 Inactive'}

*MT4 Accounts:* ${user.mt4Accounts.length}
*MT5 Accounts:* ${user.mt5Accounts.length}
*Signal Channels:* ${user.signalChannels.length}

*Settings:*
• Base Lot Size: ${user.copySettings.baseLotSize}
• Number of Orders: ${user.copySettings.numberOfOrders}
• Lot Multiplier: ${user.copySettings.lotMultiplier}x
• Total Volume: ${(user.copySettings.baseLotSize * user.copySettings.numberOfOrders * user.copySettings.lotMultiplier).toFixed(2)} lots
• Max Risk: ${user.copySettings.maxRisk}%
• Copy SL: ${user.copySettings.copyStopLoss ? '✅' : '❌'}
• Copy TP: ${user.copySettings.copyTakeProfit ? '✅' : '❌'}
• Reverse Signals: ${user.copySettings.reverseSignals ? '✅' : '❌'}
• Auto Close TP1: ${user.copySettings.autoCloseAtTP1 ? '✅' : '❌'}
• Move to B.E: ${user.copySettings.moveToBreakeven ? '✅' : '❌'}
  `;
  
  bot.sendMessage(chatId, status, { parse_mode: 'Markdown' });
}

// Show help
function showHelp(chatId) {
  const helpMessage = `
📚 *Help & Commands*

*Quick Commands:*
/start - Show main menu
/add_mt4 - Connect MT4 account
/add_mt5 - Connect MT5 account
/add_channel - Add signal channel
/list_channels - Show all added channels
/lot_multiplier [value] - Set lot size
/max_risk [%] - Set max risk

*Using Buttons:*
Use the interactive buttons for easy navigation!

*Signal Format Examples:*
✅ BUY GOLD @ 2050.50 SL 2045 TP1 2060 TP2 2070
✅ SELL BTCUSD Entry: 45000 Stop: 46000 TP1: 43000
✅ LONG USDJPY at 150.50 sl 150.00 tp1 151.50
✅ SHORT EURUSD Entry 1.0950 SL 1.0980 TP 1.0900
✅ BUY US30 @ 35000 SL 34800 TP1 35500 TP2 36000
⚡ GOLD/XAUUSD Buy now (immediate execution)
⚡ BTCUSD SELL now (market execution)
🔄 TP1 HIT - Close 50% & move to breakeven
🔄 CLOSE ALL - Close all positions

*Supported Instruments:*
💱 Forex: EURUSD, GBPUSD, USDJPY, USDCHF, AUDUSD, etc.
🥇 Metals: GOLD/XAUUSD, SILVER/XAGUSD
⚫ Oil: OIL/USOIL, UKOIL, BRENT
₿ Crypto: BTCUSD, ETHUSD, XRPUSD, LTCUSD
📊 Indices: US30, US500, NAS100, GER30, UK100
🌾 Commodities: COPPER, WHEAT, CORN, COFFEE

*Features:*
📊 Multiple MT4/MT5 accounts
📢 Telegram channel monitoring
⚙️ Advanced risk management
🔄 Reverse signal option
📈 Real-time execution
⚡ Immediate market execution
✂️ Auto close 50% at TP1
🔒 Move SL to breakeven after TP1
🔄 TP/SL update detection

Need more help? Contact support!
  `;
  
  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
}

// Settings commands
bot.onText(/\/lot_size (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const value = parseFloat(match[1]);
  const user = getUserData(msg.from.id);
  
  if (isNaN(value) || value <= 0) {
    bot.sendMessage(chatId, '❌ Please provide a valid positive number.');
    return;
  }
  
  user.copySettings.baseLotSize = value;
  const totalVolume = value * user.copySettings.numberOfOrders;
  bot.sendMessage(chatId, `✅ Base lot size set to ${value}\n\n💡 With ${user.copySettings.numberOfOrders} orders, total volume will be ${totalVolume} lots per signal`);
});

bot.onText(/\/num_orders (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const value = parseInt(match[1]);
  const user = getUserData(msg.from.id);
  
  if (isNaN(value) || value < 1 || value > 10) {
    bot.sendMessage(chatId, '❌ Please provide a number between 1 and 10.');
    return;
  }
  
  user.copySettings.numberOfOrders = value;
  const totalVolume = user.copySettings.baseLotSize * value;
  bot.sendMessage(chatId, `✅ Number of orders set to ${value}\n\n💡 Each order: ${user.copySettings.baseLotSize} lots\n💡 Total volume: ${totalVolume} lots per signal`);
});

bot.onText(/\/lot_multiplier (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const value = parseFloat(match[1]);
  const user = getUserData(msg.from.id);
  
  if (isNaN(value) || value <= 0) {
    bot.sendMessage(chatId, '❌ Please provide a valid positive number.');
    return;
  }
  
  user.copySettings.lotMultiplier = value;
  bot.sendMessage(chatId, `✅ Lot multiplier set to ${value}x`);
});

bot.onText(/\/max_risk (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const value = parseFloat(match[1]);
  const user = getUserData(msg.from.id);
  
  if (isNaN(value) || value <= 0 || value > 100) {
    bot.sendMessage(chatId, '❌ Please provide a valid percentage between 0 and 100.');
    return;
  }
  
  user.copySettings.maxRisk = value;
  bot.sendMessage(chatId, `✅ Max risk set to ${value}%`);
});

// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

bot.on('webhook_error', (error) => {
  console.error('Webhook error:', error);
});

// Test API connections on startup
async function testConnections() {
  console.log('🔧 Testing API connections...\n');
  
  // Test Telegram Bot
  try {
    const botInfo = await bot.getMe();
    console.log('✅ Telegram Bot Connected!');
    console.log(`   Bot Name: ${botInfo.first_name}`);
    console.log(`   Username: @${botInfo.username}`);
    console.log(`   Bot ID: ${botInfo.id}\n`);
  } catch (error) {
    console.error('❌ Telegram Bot Connection Failed!');
    console.error(`   Error: ${error.message}\n`);
    return false;
  }
  
  // Test Meta API
  try {
    const accounts = await metaApiRequest('/users/current/accounts');
    console.log('✅ Meta API Connected!');
    console.log(`   Found ${accounts.length} account(s) in Meta API`);
    
    if (accounts.length > 0) {
      console.log('\n   📋 Available Accounts:');
      accounts.forEach((acc, idx) => {
        console.log(`   ${idx + 1}. ${acc.name} (${acc.platform.toUpperCase()}) - ID: ${acc.id}`);
      });
    }
    console.log('');
  } catch (error) {
    console.error('❌ Meta API Connection Failed!');
    console.error(`   Error: ${error.message}\n`);
    
    if (checkMetaApiErrorForFunding(error)) {
      console.error('💰 MetaAPI account needs funding! Visit: https://metaapi.cloud');
    }
    return false;
  }
  
  return true;
}

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server started on port ${PORT}`);
  console.log(`🌐 Mode: ${WEBHOOK_URL ? 'WEBHOOK' : 'POLLING'}`);
  console.log(`📱 Bot is ready!`);
});

// Start cleanup routine
startCleanupRoutine();
console.log(`✅ Cleanup routine started (every ${CLEANUP_INTERVAL_HOURS} hours)`);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Run connection tests
testConnections().then(success => {
  if (success) {
    console.log('✅ All systems operational!');
    console.log('🤖 Bot is ready to receive commands...\n');
    console.log('📱 Open Telegram and send /start to your bot to begin!\n');
  } else {
    console.log('❌ Some connections failed. Please check your credentials.');
  }
});

console.log('✅ Advanced Trading Copier Bot is running...');
console.log('📊 Features: MT4/MT5 connection + Signal channel monitoring + Immediate execution');
console.log('🔒 Security: User limits + Automatic cleanup + Secure SSL handling');
