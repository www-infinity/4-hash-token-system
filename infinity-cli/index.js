#!/usr/bin/env node
'use strict';

/**
 * Infinity CLI — command-line builder for the Infinity Spin-Token System.
 *
 * Usage:
 *   node infinity-cli/index.js <command> [options]
 *
 * Commands:
 *   create page          Scaffold a new page config in /pages
 *   create token-system  Scaffold the token system module files
 *   create slot-machine  Scaffold a slot machine component
 *   create research      Scaffold a research engine component
 *   create visualizer    Scaffold a token visualizer component
 *   create wallet        Scaffold a wallet viewer component
 *   create radio         Scaffold a radio module component
 *   status               Show treasury + ledger status
 *   verify <tokenDir>    Verify a token's 4 hashes
 *   help                 Show this help text
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Lazy-load project modules so the CLI works standalone too
function loadModule(mod) {
  try { return require(path.join(ROOT, 'src', mod)); } catch { return null; }
}

/* ------------------------------------------------------------------ */
/*  Scaffolding helpers                                                 */
/* ------------------------------------------------------------------ */

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeIfAbsent(filePath, content) {
  if (fs.existsSync(filePath)) {
    console.log(`  skip   ${path.relative(ROOT, filePath)} (already exists)`);
    return;
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  create ${path.relative(ROOT, filePath)}`);
}

/* ------------------------------------------------------------------ */
/*  Commands                                                            */
/* ------------------------------------------------------------------ */

function cmdCreatePage(name = 'index') {
  const pagesDir = path.join(ROOT, 'pages');
  ensureDir(pagesDir);
  const config = {
    page: name,
    components: [],
  };
  writeIfAbsent(
    path.join(pagesDir, `${name}.json`),
    JSON.stringify(config, null, 2)
  );
  console.log(`\n✅ Page '${name}' scaffolded. Edit pages/${name}.json to add components.`);
  console.log('   Available components: bitcoin-slot, token-network, research-feed, wallet-viewer, quantum-visualizer, radio-module\n');
}

function cmdCreateTokenSystem() {
  console.log('\n📦 Token System — already implemented in src/token-system/');
  console.log('   Modules: hashEngine.js · tokenGenerator.js · ledger.js · verifier.js\n');
}

function cmdCreateSlotMachine() {
  const dir = path.join(ROOT, 'components', 'bitcoin-slot');
  ensureDir(dir);
  writeIfAbsent(
    path.join(dir, 'component.json'),
    JSON.stringify({ id: 'bitcoin-slot', label: 'Bitcoin Slot Machine', entry: 'slot.js' }, null, 2)
  );
  writeIfAbsent(
    path.join(dir, 'slot.js'),
    `'use strict';
// Bitcoin Slot Machine component
// Wire up the spin button and connect to the spin engine
// See: src/spin-engine/research-writer/index.js

module.exports = {
  id: 'bitcoin-slot',
  render() {
    return '<div class="component bitcoin-slot">🎰 Bitcoin Slot (placeholder)</div>';
  },
};
`
  );
  console.log('\n✅ Bitcoin Slot component scaffolded at components/bitcoin-slot/\n');
}

function cmdCreateResearch() {
  const dir = path.join(ROOT, 'components', 'research-feed');
  ensureDir(dir);
  writeIfAbsent(
    path.join(dir, 'component.json'),
    JSON.stringify({ id: 'research-feed', label: 'Research Feed', entry: 'feed.js' }, null, 2)
  );
  writeIfAbsent(
    path.join(dir, 'feed.js'),
    `'use strict';
// Research Feed component
// Reads from the /spins directory and renders recent research packets
// See: src/spin-engine/research-writer/index.js

module.exports = {
  id: 'research-feed',
  render() {
    return '<div class="component research-feed">🔬 Research Feed (placeholder)</div>';
  },
};
`
  );
  console.log('\n✅ Research Feed component scaffolded at components/research-feed/\n');
}

function cmdCreateVisualizer() {
  const dir = path.join(ROOT, 'components', 'token-network');
  ensureDir(dir);
  writeIfAbsent(
    path.join(dir, 'component.json'),
    JSON.stringify({ id: 'token-network', label: 'Token Network Visualizer', entry: 'visualizer.js' }, null, 2)
  );
  writeIfAbsent(
    path.join(dir, 'visualizer.js'),
    `'use strict';
// Token Network Visualizer component
// Renders a constellation/galaxy of token nodes from /tokens
// See: src/token-system/index.js

module.exports = {
  id: 'token-network',
  render() {
    return '<div class="component token-network">🌌 Token Network (placeholder)</div>';
  },
};
`
  );
  console.log('\n✅ Token Network Visualizer scaffolded at components/token-network/\n');
}

function cmdCreateWallet() {
  const dir = path.join(ROOT, 'components', 'wallet-viewer');
  ensureDir(dir);
  writeIfAbsent(
    path.join(dir, 'component.json'),
    JSON.stringify({ id: 'wallet-viewer', label: 'Wallet Viewer', entry: 'wallet.js' }, null, 2)
  );
  writeIfAbsent(
    path.join(dir, 'wallet.js'),
    `'use strict';
// Wallet Viewer component
// Displays tokens in a user wallet — integrates with src/auth/userAuth.js
// Distribution rule: one token per hour per wallet (src/distribution/index.js)

module.exports = {
  id: 'wallet-viewer',
  render() {
    return '<div class="component wallet-viewer">💼 Wallet Viewer (placeholder)</div>';
  },
};
`
  );
  console.log('\n✅ Wallet Viewer scaffolded at components/wallet-viewer/\n');
}

function cmdCreateRadio() {
  const dir = path.join(ROOT, 'components', 'radio-module');
  ensureDir(dir);
  writeIfAbsent(
    path.join(dir, 'component.json'),
    JSON.stringify({ id: 'radio-module', label: 'Index Radio', entry: 'radio.js' }, null, 2)
  );
  writeIfAbsent(
    path.join(dir, 'radio.js'),
    `'use strict';
// Index Radio component — spectrum visualizer + audio playback module

module.exports = {
  id: 'radio-module',
  render() {
    return '<div class="component radio-module">📻 Index Radio (placeholder)</div>';
  },
};
`
  );
  console.log('\n✅ Radio Module scaffolded at components/radio-module/\n');
}

function cmdStatus() {
  const treasury = loadModule('treasury/index');
  const tokenSystem = loadModule('token-system/index');

  console.log('\n📊 Infinity System Status');
  console.log('─'.repeat(40));

  if (treasury) {
    const stats = treasury.getTreasuryStats();
    console.log(`🏦 Treasury   : ${stats.treasury} tokens held`);
    console.log(`📤 Distributed: ${stats.distributed} tokens sent`);
    console.log(`🔢 Total      : ${stats.total} tokens minted`);
  } else {
    console.log('⚠️  Treasury module unavailable');
  }

  if (tokenSystem) {
    const ledger = tokenSystem.readLedger();
    console.log(`📒 Ledger     : ${ledger.length} entries`);
  } else {
    console.log('⚠️  Token ledger unavailable');
  }

  const receiptsDir = path.join(ROOT, 'receipts');
  const receiptCount = fs.existsSync(receiptsDir)
    ? fs.readdirSync(receiptsDir).filter((f) => f.endsWith('.json')).length
    : 0;
  console.log(`🧾 Receipts   : ${receiptCount} issued`);
  console.log('─'.repeat(40) + '\n');
}

function cmdVerify(tokenDir) {
  if (!tokenDir) {
    console.error('Usage: infinity-cli verify <tokenDir>');
    process.exit(1);
  }
  const absDir = path.isAbsolute(tokenDir) ? tokenDir : path.join(ROOT, tokenDir);
  const verifier = loadModule('token-system/verifier');
  if (!verifier) {
    console.error('❌ Verifier module not found');
    process.exit(1);
  }
  const report = verifier.verifyTokenReport(absDir);
  console.log('\n' + report + '\n');
}

function cmdHelp() {
  console.log(`
∞ Infinity CLI — Spin-Token System Builder
==========================================

Usage:
  node infinity-cli/index.js <command> [args]

Commands:
  create page [name]     Scaffold a new page config  (default: index)
  create token-system    Show token system module info
  create slot-machine    Scaffold a Bitcoin Slot component
  create research        Scaffold a Research Feed component
  create visualizer      Scaffold a Token Network Visualizer
  create wallet          Scaffold a Wallet Viewer component
  create radio           Scaffold an Index Radio component
  status                 Show treasury + ledger statistics
  verify <tokenDir>      Verify the 4 hashes of a token folder
  help                   Show this help text

Directories managed by this CLI:
  /pages        — page layout configs
  /components   — UI component modules
  /treasury     — token distribution ledger
  /receipts     — spin activity receipts
  /wallets      — wallet records
  /tokens       — minted token folders
  /spins        — spin research packets
`);
}

/* ------------------------------------------------------------------ */
/*  Entry point                                                         */
/* ------------------------------------------------------------------ */

function main(argv) {
  const [cmd, sub, ...rest] = argv;

  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') {
    cmdHelp();
    return;
  }

  if (cmd === 'create') {
    switch (sub) {
      case 'page':         return cmdCreatePage(rest[0]);
      case 'token-system': return cmdCreateTokenSystem();
      case 'slot-machine': return cmdCreateSlotMachine();
      case 'research':     return cmdCreateResearch();
      case 'visualizer':   return cmdCreateVisualizer();
      case 'wallet':       return cmdCreateWallet();
      case 'radio':        return cmdCreateRadio();
      default:
        console.error(`Unknown create target: '${sub}'. Run 'infinity-cli help' for options.`);
        process.exit(1);
    }
  }

  if (cmd === 'status') return cmdStatus();
  if (cmd === 'verify') return cmdVerify(sub);

  console.error(`Unknown command: '${cmd}'. Run 'infinity-cli help' for options.`);
  process.exit(1);
}

// Run only when invoked directly
if (require.main === module) {
  main(process.argv.slice(2));
}

module.exports = {
  main,
  cmdCreatePage,
  cmdCreateTokenSystem,
  cmdCreateSlotMachine,
  cmdCreateResearch,
  cmdCreateVisualizer,
  cmdCreateWallet,
  cmdCreateRadio,
  cmdStatus,
  cmdVerify,
};
