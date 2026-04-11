#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import chalk from 'chalk';
import ora from 'ora';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const streakFile = path.join(__dirname, '.streak.json');
const logFile = path.join(__dirname, 'streak.log');
const configFile = path.join(__dirname, '.gitstreak-config.json');
const badgesFile = path.join(__dirname, '.badges.json');
const weeklyReportFile = path.join(__dirname, 'weekly-report.md');

// Load config
function loadConfig() {
  if (fs.existsSync(configFile)) {
    return JSON.parse(fs.readFileSync(configFile, 'utf8'));
  }
  return {
    notifications: false,
    autoPush: false,
    reminders: true,
    reminderHour: 20
  };
}

function saveConfig(config) {
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
}

// Badges system
const badgeDefinitions = {
  1: { name: "BEGINNER", emoji: "🌱", requirement: 1 },
  7: { name: "WEEK WARRIOR", emoji: "🔥", requirement: 7 },
  30: { name: "MONTH MASTER", emoji: "⭐", requirement: 30 },
  50: { name: "DEDICATED", emoji: "💪", requirement: 50 },
  100: { name: "CENTURY CLUB", emoji: "🏆", requirement: 100 },
  365: { name: "YEAR KING", emoji: "👑", requirement: 365 }
};

function loadBadges() {
  if (fs.existsSync(badgesFile)) {
    return JSON.parse(fs.readFileSync(badgesFile, 'utf8'));
  }
  return { earned: [] };
}

function saveBadges(badges) {
  fs.writeFileSync(badgesFile, JSON.stringify(badges, null, 2));
}

function checkBadges(streak) {
  const badges = loadBadges();
  const newBadges = [];
  
  for (const [days, badge] of Object.entries(badgeDefinitions)) {
    if (streak.currentStreak >= badge.requirement && !badges.earned.includes(badge.name)) {
      badges.earned.push(badge.name);
      newBadges.push(badge);
    }
  }
  
  if (newBadges.length > 0) {
    saveBadges(badges);
    console.log(chalk.yellow.bold('\n🏆 NEW BADGES UNLOCKED! 🏆'));
    newBadges.forEach(badge => {
      console.log(chalk.green(`  ${badge.emoji} ${badge.name}`));
    });
  }
  
  return newBadges;
}

function showBadges() {
  const badges = loadBadges();
  if (badges.earned.length === 0) {
    console.log(chalk.gray('\n📛 No badges yet. Keep your streak going!'));
    return;
  }
  
  console.log(chalk.cyan.bold('\n🏅 YOUR BADGES 🏅'));
  console.log(chalk.gray('═'.repeat(30)));
  badges.earned.forEach(badge => {
    console.log(chalk.green(`  ✓ ${badge}`));
  });
  console.log(chalk.gray('═'.repeat(30)));
}

function generateWeeklyReport() {
  const streak = loadStreak();
  const today = new Date();
  
  const report = `# GitStreak Weekly Report
Generated: ${today.toLocaleDateString()}

## Streak Statistics
- Current Streak: ${streak.currentStreak} days
- Longest Streak: ${streak.longestStreak} days
- Total Commits: ${streak.totalCommits}

## Badges Earned
${loadBadges().earned.map(b => `- ${b}`).join('\n') || 'None yet'}

## Motivation
${streak.currentStreak === 0 ? "Start your streak today!" : 
  streak.currentStreak < 7 ? "Keep going! First week is the hardest!" :
  streak.currentStreak < 30 ? "Great consistency! You are building a habit!" :
  "Amazing! You are a streak master!"}

---
Keep the streak alive! Commit daily!
`;
  
  fs.writeFileSync(weeklyReportFile, report);
  console.log(chalk.green(`\nWeekly report generated: ${weeklyReportFile}`));
}

function getMotivationalMessage() {
  const messages = [
    "Every journey begins with a single commit!",
    "Don't break the chain!",
    "Your future self will thank you!",
    "One commit today = streak preserved!",
    "Consistency beats intensity!"
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

function getCelebrationMessage(streak) {
  if (streak === 1) return "First day down! Keep going!";
  if (streak === 7) return "Week complete! You are on fire!";
  if (streak === 30) return "Month master! Incredible consistency!";
  if (streak === 100) return "Century club! You are a legend!";
  if (streak > 100) return `${streak} days and counting! Unstoppable!`;
  return `${streak} days strong! Building momentum!`;
}

function showEnhancedStatus() {
  const streak = loadStreak();
  const todayStr = new Date().toISOString().slice(0, 10);
  const hasCommittedToday = streak.lastCommitDate === todayStr;
  
  console.log(chalk.cyan.bold('\n🔥 GITSTREAK STATUS 🔥\n'));
  console.log(chalk.gray('═'.repeat(40)));
  
  // Progress to next badge
  const nextMilestone = Object.keys(badgeDefinitions).find(days => days > streak.currentStreak);
  if (nextMilestone) {
    const percent = (streak.currentStreak / nextMilestone) * 100;
    const barLength = 30;
    const filled = Math.round((barLength * percent) / 100);
    const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
    console.log(chalk.cyan(`Next: ${badgeDefinitions[nextMilestone].emoji} ${badgeDefinitions[nextMilestone].name}`));
    console.log(chalk.white(`[${bar}] ${Math.round(percent)}%`));
  }
  
  console.log(chalk.white(`\n📅 Today: ${todayStr}`));
  console.log(chalk.white(`✅ Committed: ${hasCommittedToday ? chalk.green('Yes') : chalk.red('No')}`));
  console.log(chalk.white(`🔥 Current Streak: ${chalk.green(streak.currentStreak)} days`));
  console.log(chalk.white(`🏆 Longest Streak: ${chalk.yellow(streak.longestStreak)} days`));
  console.log(chalk.white(`📈 Total Commits: ${chalk.cyan(streak.totalCommits)}`));
  console.log(chalk.white(`📝 Last Commit: ${streak.lastCommitDate || 'Never'}`));
  console.log(chalk.gray('═'.repeat(40)));
  
  showBadges();
  
  if (!hasCommittedToday) {
    console.log(chalk.yellow.bold(`\n💡 ${getMotivationalMessage()}`));
  } else if (streak.currentStreak > 0) {
    console.log(chalk.green.bold(`\n🎉 ${getCelebrationMessage(streak.currentStreak)}`));
  }
}

function showAnalytics() {
  const streak = loadStreak();
  
  console.log(chalk.cyan.bold('\n📈 ANALYTICS'));
  console.log(chalk.gray('═'.repeat(40)));
  console.log(chalk.white(`Success Rate: ${(streak.currentStreak / (streak.totalCommits || 1) * 100).toFixed(1)}%`));
  console.log(chalk.white(`Best Streak: ${streak.longestStreak} days`));
  console.log(chalk.white(`Total Activity: ${streak.totalCommits} days`));
  console.log(chalk.white(`Badges Earned: ${loadBadges().earned.length}`));
  
  if (streak.currentStreak > 0) {
    console.log(chalk.green.bold('\n🔮 PROJECTION'));
    console.log(chalk.white(`  In 7 days: ${streak.currentStreak + 7} days`));
    console.log(chalk.white(`  In 30 days: ${streak.currentStreak + 30} days`));
  }
}

function loadStreak() {
  if (fs.existsSync(streakFile)) {
    return JSON.parse(fs.readFileSync(streakFile, 'utf8'));
  }
  return { lastCommitDate: null, currentStreak: 0, longestStreak: 0, totalCommits: 0 };
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
    return streak;
  }

  const yesterdayStr = getYesterday();

  if (streak.lastCommitDate === yesterdayStr) {
    streak.currentStreak++;
  } else if (streak.lastCommitDate !== todayStr) {
    streak.currentStreak = 1;
  }

  if (streak.currentStreak > streak.longestStreak) {
    streak.longestStreak = streak.currentStreak;
  }

  streak.lastCommitDate = todayStr;
  streak.totalCommits++;
  saveStreak(streak);
  return streak;
}

function log(message) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
}

async function enhancedCommit(customMessage = null) {
  const spinner = ora('Preparing your streak commit...').start();
  
  try {
    if (!fs.existsSync('.git')) {
      spinner.fail('Not a git repository!');
      console.log(chalk.yellow("Run 'git init' first"));
      process.exit(1);
    }
    
    const todayStr = today();
    const fileName = `streak_${todayStr}.txt`;
    const currentStreak = loadStreak();
    const message = customMessage || `Daily streak commit - Day ${currentStreak.currentStreak + 1}`;
    
    const content = `Streak Commit
Date: ${todayStr}
Message: ${message}
Streak: ${currentStreak.currentStreak + 1} days
Time: ${new Date().toLocaleString()}
---
Keep the streak alive!
`;
    
    fs.writeFileSync(fileName, content);
    
    spinner.text = 'Adding files to git...';
    execSync('git add .', { stdio: 'pipe' });
    
    spinner.text = 'Committing...';
    execSync(`git commit -m "${message}"`, { stdio: 'pipe' });
    
    spinner.succeed('Commit created!');
    
    const streak = checkAndUpdateStreak();
    const newBadges = checkBadges(streak);
    
    console.log(chalk.green.bold(`\nSuccessfully committed!`));
    console.log(chalk.white(`Message: ${message}`));
    console.log(chalk.cyan(`Streak: ${streak.currentStreak} days (Longest: ${streak.longestStreak})`));
    
    if (newBadges.length > 0) {
      console.log(chalk.yellow(`\nYou unlocked ${newBadges.length} new badge(s)!`));
    }
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('\nPush to remote? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        try {
          execSync('git push', { stdio: 'inherit' });
          console.log(chalk.green('Pushed to GitHub!'));
        } catch (error) {
          console.log(chalk.red('Failed to push. Set up remote first.'));
        }
      }
      rl.close();
    });
    
  } catch (error) {
    spinner.fail('Commit failed');
    console.log(chalk.red(`Error: ${error.message}`));
  }
}

// CLI handling
const command = process.argv[2];
const args = process.argv.slice(3);

switch (command) {
  case 'commit':
    enhancedCommit(args[0]);
    break;
  case 'status':
    showEnhancedStatus();
    break;
  case 'badges':
    showBadges();
    break;
  case 'report':
    generateWeeklyReport();
    break;
  case 'analytics':
    showAnalytics();
    break;
  case 'config':
    console.log(chalk.yellow('\nConfig wizard coming soon!'));
    break;
  case 'help':
  case '--help':
  case '-h':
  default:
    console.log(chalk.cyan.bold('\n🔥 GITSTREAK COMMANDS 🔥'));
    console.log(chalk.white('\nCommands:'));
    console.log(chalk.green('  node index.js commit [message]  ') + '- Make a streak commit');
    console.log(chalk.green('  node index.js status            ') + '- Show streak dashboard');
    console.log(chalk.green('  node index.js badges            ') + '- View your badges');
    console.log(chalk.green('  node index.js report            ') + '- Generate weekly report');
    console.log(chalk.green('  node index.js analytics         ') + '- Show statistics');
    console.log(chalk.white('\nTip: Use "node index.js commit" daily to build your streak!\n'));
}

export { enhancedCommit as makeContribution, showEnhancedStatus as showStatus, loadStreak };