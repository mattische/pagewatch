#!/usr/bin/env node

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { createHash } from 'crypto';
import { homedir, platform } from 'os';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';

const execAsync = promisify(exec);

const CONFIG_DIR = join(homedir(), '.pagewatch');
const DATA_FILE = join(CONFIG_DIR, 'pages.json');

// Ensure config directory exists
if (!existsSync(CONFIG_DIR)) {
  await mkdir(CONFIG_DIR, { recursive: true });
}

// Load or initialize data
async function loadData() {
  try {
    const content = await readFile(DATA_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

async function saveData(data) {
  await writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// Fetch and hash page content
async function fetchPageHash(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const content = await response.text();
  return createHash('sha256').update(content).digest('hex');
}

// Resolve URL from number or return URL as-is
async function resolveUrl(input) {
  const data = await loadData();
  const urls = Object.keys(data);

  // Check if input is a number
  const num = parseInt(input);
  if (!isNaN(num) && num > 0 && num <= urls.length) {
    return urls[num - 1];
  }

  // Otherwise return the input as URL
  return input;
}

// Add a URL to monitor
async function addUrl(url) {
  const data = await loadData();

  if (data[url]) {
    console.log(chalk.yellow(`⚠️  URL already monitored: ${url}`));
    return;
  }

  console.log(chalk.blue(`Fetching ${url}...`));

  try {
    const hash = await fetchPageHash(url);
    data[url] = {
      hash,
      lastChecked: new Date().toISOString(),
      lastChanged: new Date().toISOString(),
      checkCount: 1
    };

    await saveData(data);
    console.log(chalk.green(`✓ Added and initialized: ${url}`));
  } catch (error) {
    console.log(chalk.red(`✗ Error fetching URL: ${error.message}`));
  }
}

// Check a URL or all URLs
async function checkUrls(urlOrNumber = null) {
  const data = await loadData();
  let urlsToCheck;

  if (urlOrNumber) {
    const resolvedUrl = await resolveUrl(urlOrNumber);
    urlsToCheck = [resolvedUrl];
  } else {
    urlsToCheck = Object.keys(data);
  }

  if (urlsToCheck.length === 0) {
    console.log(chalk.yellow('No URLs to check. Add some with: pagechecker add <url>'));
    return;
  }

  const results = [];

  for (const checkUrl of urlsToCheck) {
    if (!data[checkUrl]) {
      console.log(chalk.red(`✗ URL not found: ${checkUrl}`));
      continue;
    }

    process.stdout.write(chalk.blue(`Checking ${checkUrl}... `));

    try {
      const newHash = await fetchPageHash(checkUrl);
      const oldHash = data[checkUrl].hash;
      const changed = newHash !== oldHash;

      data[checkUrl].lastChecked = new Date().toISOString();
      data[checkUrl].checkCount++;

      if (changed) {
        data[checkUrl].hash = newHash;
        data[checkUrl].lastChanged = new Date().toISOString();
        console.log(chalk.green.bold('CHANGED! ✨'));
      } else {
        console.log(chalk.gray('no change'));
      }

      results.push({ url: checkUrl, changed, error: null });
    } catch (error) {
      console.log(chalk.red(`error: ${error.message}`));
      results.push({ url: checkUrl, changed: false, error: error.message });
    }
  }

  await saveData(data);

  // Show summary table
  const changedUrls = results.filter(r => r.changed);
  if (changedUrls.length > 0) {
    console.log(chalk.green.bold(`\n${changedUrls.length} page(s) changed!`));
  }
}

// List all monitored URLs
async function listUrls() {
  const data = await loadData();
  const urls = Object.keys(data);

  if (urls.length === 0) {
    console.log(chalk.yellow('No URLs monitored yet. Add some with: pagechecker add <url>'));
    return;
  }

  const table = new Table({
    head: [
      chalk.cyan('#'),
      chalk.cyan('URL'),
      chalk.cyan('Last Checked'),
      chalk.cyan('Last Changed'),
      chalk.cyan('Checks')
    ],
    colWidths: [5, 45, 20, 20, 10]
  });

  urls.forEach((url, index) => {
    const info = data[url];
    const lastChecked = new Date(info.lastChecked).toLocaleString();
    const lastChanged = new Date(info.lastChanged).toLocaleString();

    table.push([
      chalk.yellow(index + 1),
      url.length > 42 ? url.substring(0, 39) + '...' : url,
      lastChecked,
      lastChanged,
      info.checkCount
    ]);
  });

  console.log(table.toString());
  console.log(chalk.gray(`\nTotal: ${urls.length} URL(s)`));
  console.log(chalk.gray(`Use the number to reference a URL (e.g., "check 1" or "remove 2")`));
}

// Remove a URL
async function removeUrl(urlOrNumber) {
  const url = await resolveUrl(urlOrNumber);
  const data = await loadData();

  if (!data[url]) {
    console.log(chalk.red(`✗ URL not found: ${url}`));
    return;
  }

  delete data[url];
  await saveData(data);
  console.log(chalk.green(`✓ Removed: ${url}`));
}

// Watch a URL continuously
async function watchUrl(urlOrNumber, options) {
  const url = await resolveUrl(urlOrNumber);
  const interval = options.interval || 60;
  let data = await loadData();

  // Initialize URL if not already monitored
  if (!data[url]) {
    console.log(chalk.blue(`Initializing ${url}...`));
    try {
      const hash = await fetchPageHash(url);
      data[url] = {
        hash,
        lastChecked: new Date().toISOString(),
        lastChanged: new Date().toISOString(),
        checkCount: 0
      };
      await saveData(data);
      console.log(chalk.green(`✓ URL added to monitoring\n`));
    } catch (error) {
      console.log(chalk.red(`✗ Error initializing URL: ${error.message}`));
      return;
    }
  }

  console.log(chalk.cyan.bold(`👁️  Watching: ${url}`));
  console.log(chalk.gray(`Checking every ${interval} seconds. Press Ctrl+C to stop.\n`));

  let checkNumber = 0;

  const check = async () => {
    checkNumber++;
    const timestamp = new Date().toLocaleTimeString();

    process.stdout.write(chalk.blue(`[${timestamp}] Check #${checkNumber}: `));

    try {
      data = await loadData();
      const newHash = await fetchPageHash(url);
      const oldHash = data[url].hash;
      const changed = newHash !== oldHash;

      data[url].lastChecked = new Date().toISOString();
      data[url].checkCount++;

      if (changed) {
        data[url].hash = newHash;
        data[url].lastChanged = new Date().toISOString();
        await saveData(data);

        console.log(chalk.green.bold('CHANGED! ✨'));
        console.log(chalk.yellow(`🔔 Page has been updated at ${timestamp}\n`));
      } else {
        await saveData(data);
        console.log(chalk.gray('no change'));
      }
    } catch (error) {
      console.log(chalk.red(`error: ${error.message}`));
    }
  };

  // Initial check
  await check();

  // Set up interval for subsequent checks
  const intervalId = setInterval(check, interval * 1000);

  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    clearInterval(intervalId);
    console.log(chalk.cyan(`\n\n✓ Stopped watching ${url}`));
    console.log(chalk.gray(`Total checks performed: ${checkNumber}`));
    process.exit(0);
  });
}

// Open URL in browser
async function openInBrowser(urlOrNumber) {
  const url = await resolveUrl(urlOrNumber);
  const data = await loadData();

  if (!data[url]) {
    console.log(chalk.red(`✗ URL not found: ${url}`));
    return;
  }

  console.log(chalk.blue(`Opening ${url} in browser...`));

  try {
    const platformName = platform();
    let command;

    if (platformName === 'darwin') {
      command = `open "${url}"`;
    } else if (platformName === 'win32') {
      command = `start "" "${url}"`;
    } else {
      command = `xdg-open "${url}"`;
    }

    await execAsync(command);
    console.log(chalk.green('✓ Opened in browser'));
  } catch (error) {
    console.log(chalk.red(`✗ Error opening browser: ${error.message}`));
  }
}

// Monitor multiple URLs continuously
async function monitorUrls(urlsOrNumbers, options) {
  const interval = options.interval || 60;
  let data = await loadData();
  const allUrls = Object.keys(data);

  // Determine which URLs to monitor
  let urlsToMonitor = [];

  if (!urlsOrNumbers || urlsOrNumbers.length === 0) {
    // No arguments - monitor all URLs
    urlsToMonitor = allUrls;
  } else {
    // Resolve each URL/number
    for (const item of urlsOrNumbers) {
      const url = await resolveUrl(item);
      if (data[url]) {
        urlsToMonitor.push(url);
      } else {
        console.log(chalk.yellow(`⚠️  Skipping unknown URL: ${item}`));
      }
    }
  }

  if (urlsToMonitor.length === 0) {
    console.log(chalk.yellow('No URLs to monitor. Add some with: pagewatch add <url>'));
    return;
  }

  console.log(chalk.cyan.bold(`👁️  Monitoring ${urlsToMonitor.length} page(s)`));
  console.log(chalk.gray(`Checking every ${interval} seconds. Press Ctrl+C to stop.\n`));

  // Display URLs being monitored
  urlsToMonitor.forEach((url, index) => {
    const shortUrl = url.length > 60 ? url.substring(0, 57) + '...' : url;
    console.log(chalk.gray(`  ${index + 1}. ${shortUrl}`));
  });
  console.log('');

  let checkNumber = 0;

  const check = async () => {
    checkNumber++;
    const timestamp = new Date().toLocaleTimeString();

    console.log(chalk.blue(`[${timestamp}] Check #${checkNumber}`));

    data = await loadData();
    let changedCount = 0;

    for (const url of urlsToMonitor) {
      const shortUrl = url.length > 50 ? url.substring(0, 47) + '...' : url;
      process.stdout.write(chalk.gray(`  ${shortUrl} ... `));

      try {
        const newHash = await fetchPageHash(url);
        const oldHash = data[url].hash;
        const changed = newHash !== oldHash;

        data[url].lastChecked = new Date().toISOString();
        data[url].checkCount++;

        if (changed) {
          data[url].hash = newHash;
          data[url].lastChanged = new Date().toISOString();
          changedCount++;
          console.log(chalk.green.bold('CHANGED! ✨'));
        } else {
          console.log(chalk.gray('no change'));
        }
      } catch (error) {
        console.log(chalk.red(`error: ${error.message}`));
      }
    }

    await saveData(data);

    if (changedCount > 0) {
      console.log(chalk.yellow(`\n🔔 ${changedCount} page(s) changed!\n`));
    } else {
      console.log('');
    }
  };

  // Initial check
  await check();

  // Set up interval for subsequent checks
  const intervalId = setInterval(check, interval * 1000);

  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    clearInterval(intervalId);
    console.log(chalk.cyan(`\n\n✓ Stopped monitoring`));
    console.log(chalk.gray(`Total checks performed: ${checkNumber}`));
    process.exit(0);
  });
}

// CLI setup
const program = new Command();

program
  .name('pagewatch')
  .description('Monitor webpage changes from the CLI')
  .version('1.0.0');

program
  .command('add <url>')
  .description('Add a URL to monitor')
  .action(addUrl);

program
  .command('check [url]')
  .description('Check a URL or all URLs for changes')
  .action(checkUrls);

program
  .command('list')
  .description('List all monitored URLs')
  .action(listUrls);

program
  .command('remove <url>')
  .description('Remove a URL from monitoring')
  .action(removeUrl);

program
  .command('watch <url>')
  .description('Continuously watch a URL for changes')
  .option('-i, --interval <seconds>', 'Check interval in seconds', '60')
  .action((url, options) => {
    options.interval = parseInt(options.interval);
    watchUrl(url, options);
  });

program
  .command('monitor [urls...]')
  .description('Monitor multiple URLs continuously (all if none specified)')
  .option('-i, --interval <seconds>', 'Check interval in seconds', '60')
  .action((urls, options) => {
    options.interval = parseInt(options.interval);
    monitorUrls(urls, options);
  });

program
  .command('open <url>')
  .description('Open a URL in the browser')
  .action(openInBrowser);

program.parse();
