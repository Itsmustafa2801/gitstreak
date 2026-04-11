#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const streakFile = path.join(__dirname, '.streak.json');
const logFile = path.join(__dirname, 'streak.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
  console.log(message);
}

function loadStreak() {
  if (fs.existsSync(streakFile)) {
    return JSON.parse(fs.readFileSync(streakFile, 'utf8'));
  }
  return { 
    lastCommitDate: null, 
    currentStreak: 0,
    longestStreak: 0,
    totalCommits: 0
  };
}

function saveStreak(streak) {
  fs.writeFileSync(streakFile, JSON.stringify(streak, null, 2));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function getYesterday() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().slice(0, 10);
}

function checkAndUpdateStreak() {
  const streak = loadStreak();
  const todayStr = today();

  if (streak.lastCommitDate === todayStr) {
    log("✅ Already committed today! Streak continues...");
    return streak;
  }

  const yesterdayStr = getYesterday();

  if (streak.lastCommitDate === yesterdayStr) {
    streak.currentStreak++;
    log(`🔥 Streak increased! Current streak: ${streak.currentStreak} days`);
  } else if (streak.lastCommitDate !== todayStr) {
    if (streak.currentStreak > 0) {
      log(`⚠️ Streak broken! Last commit was ${streak.lastCommitDate}`);
    }
    streak.currentStreak = 1;
    log(`🌟 Starting new streak! Day 1`);
  }

  if (streak.currentStreak > streak.longestStreak) {
    streak.longestStreak = streak.currentStreak;
    log(`🏆 NEW RECORD! Longest streak: ${streak.longestStreak} days`);
  }

  streak.lastCommitDate = todayStr;
  streak.totalCommits++;
  saveStreak(streak);
  return streak;
}

function makeContribution(customMessage = null) {
  try {
    // Check if git repo exists
    if (!fs.existsSync('.git')) {
      log("❌ Not a git repository! Run 'git init' first");
      process.exit(1);
    }

    const todayStr = today();
    const fileName = `streak_${todayStr}.txt`;
    const currentStreak = loadStreak();
    const message = customMessage || `Daily streak commit - Day ${currentStreak.currentStreak + 1}`;
    
    // Create streak file
    const content = `Streak Commit
Date: ${todayStr}
Message: ${message}
Time: ${new Date().toLocaleString()}
---
Keep the streak alive! 🔥
`;
    
    fs.writeFileSync(fileName, content);
    
    // Git operations - FIXED: changed to 'inherit' to see errors
    console.log("📝 Adding files to git...");
    execSync('git add .', { stdio: 'inherit' });
    
    console.log("💾 Committing...");
    execSync(`git commit -m "${message}"`, { stdio: 'inherit' });
    
    const streak = checkAndUpdateStreak();
    
    log(`\n✨ Successfully committed!`);
    log(`📝 Commit message: ${message}`);
    log(`📊 Current streak: ${streak.currentStreak} days`);
    log(`🏆 Longest streak: ${streak.longestStreak} days`);
    log(`📈 Total commits: ${streak.totalCommits}`);
    
    // Optional: Push to remote
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('\n🚀 Push to remote? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        try {
          execSync('git push', { stdio: 'inherit' });
          log('✅ Pushed to remote successfully!');
        } catch (error) {
          log('⚠️ Failed to push. Set up remote with: git remote add origin <url>');
        }
      }
      rl.close();
    });
    
  } catch (error) {
    log(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

function showStatus() {
  const streak = loadStreak();
  const todayStr = today();
  const hasCommittedToday = streak.lastCommitDate === todayStr;
  
  console.log('\n📊 GITSTREAK STATUS 📊');
  console.log('═'.repeat(30));
  console.log(`📅 Today: ${todayStr}`);
  console.log(`✅ Committed today: ${hasCommittedToday ? 'Yes' : 'No'}`);
  console.log(`🔥 Current streak: ${streak.currentStreak} days`);
  console.log(`🏆 Longest streak: ${streak.longestStreak} days`);
  console.log(`📈 Total commits: ${streak.totalCommits}`);
  console.log(`📝 Last commit: ${streak.lastCommitDate || 'Never'}`);
  console.log('═'.repeat(30));
  
  if (!hasCommittedToday) {
    console.log('\n💡 Run "gitstreak commit" to keep your streak alive!');
  }
}

function showHelp() {
  console.log(`
╔═══════════════════════════════════════════╗
║         GITSTREAK - CLI Tool             ║
╚═══════════════════════════════════════════╝

Usage:
  gitstreak commit [message]    Make a streak commit
  gitstreak status              Show current streak status
  gitstreak help                Show this help message

Examples:
  gitstreak commit
  gitstreak commit "Fixed bug"
  gitstreak status

Commands:
  commit    Create a commit and update streak
  status    Display streak statistics
  help      Show this help

Features:
  🔥 Tracks daily commit streaks
  🏆 Records longest streak
  📈 Counts total contributions
  💾 Saves data locally
  🚀 Optional auto-push to remote
  `);
}

// CLI handling
const command = process.argv[2];
const args = process.argv.slice(3);

switch (command) {
  case 'commit':
    const message = args[0] || null;
    makeContribution(message);
    break;
  case 'status':
    showStatus();
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    if (!command) {
      showHelp();
    } else {
      console.log(`❌ Unknown command: ${command}`);
      console.log('Run "gitstreak help" for usage');
      process.exit(1);
    }
}

export { makeContribution, showStatus, loadStreak };