# PageWatch

Monitor webpage changes from the CLI. Watch URLs continuously or check on-demand.

```bash
# Install
npm install -g @mattische/pagewatch

# Add URLs to monitor
pagewatch add https://example.com

# Check for changes
pagewatch check

# Watch continuously (every 30 seconds)
pagewatch watch 1 -i 30

# Open in browser
pagewatch open 1
```

## Installation

### From npm (recommended)

```bash
npm install -g @mattische/pagewatch
```

### From source

```bash
git clone https://github.com/mattische/pagewatch.git
cd pagewatch
npm install
npm link
```

## Usage

### Add a page to monitor

```bash
pagewatch add https://example.com
```

### Check for changes

Check all saved pages:
```bash
pagewatch check
```

Check a specific page (with URL or number):
```bash
pagewatch check https://example.com
# or use the number from the list
pagewatch check 1
```

### Watch a page continuously

Watch a page in real-time with custom interval:

```bash
# Default interval (60 seconds)
pagewatch watch https://example.com
# or use the number from the list
pagewatch watch 1

# Custom interval (10 seconds)
pagewatch watch https://example.com -i 10
# or with number
pagewatch watch 1 -i 10

# Short form
pagewatch watch 1 --interval 5
```

The script will:
- Automatically add the page if not already saved
- Show each check with timestamp
- Give clear notification when page changes
- Continue until you press Ctrl+C

### List all pages

```bash
pagewatch list
```

Shows a nice table with:
- Number (#) for each URL - use this to reference pages
- URL
- Last checked
- Last changed
- Number of checks

**Tip:** Use the number instead of typing the full URL in other commands!

### Remove a page

```bash
# With URL
pagewatch remove https://example.com

# With number from list (easier!)
pagewatch remove 1
```

### Open a page in browser

```bash
# With URL
pagewatch open https://example.com

# With number from list
pagewatch open 1
```

Opens the page in your default browser. Works on macOS, Linux and Windows.

## Working with Numbers

To make it easier to manage your saved pages, you can use numbers instead of typing the full URL each time:

```bash
# 1. List all pages and see their numbers
pagewatch list

# Output:
# ┌───┬─────────────────────────────────────┬────────────┬────────────┬────────┐
# │ # │ URL                                 │ ...        │ ...        │ ...    │
# ├───┼─────────────────────────────────────┼────────────┼────────────┼────────┤
# │ 1 │ https://example.com                 │ ...        │ ...        │ ...    │
# │ 2 │ https://news.ycombinator.com        │ ...        │ ...        │ ...    │
# └───┴─────────────────────────────────────┴────────────┴────────────┴────────┘

# 2. Use the number in commands
pagewatch check 1        # Check first page
pagewatch watch 2 -i 30  # Watch second page
pagewatch open 1         # Open first page in browser
pagewatch remove 1       # Remove first page
```

This saves a lot of time, especially with long URLs!

## Use Cases

### 1. Monitor a product launch
```bash
pagewatch watch https://company.com/new-product -i 300
```
Check every 5 minutes (300 seconds) if the product page updates.

### 2. Watch documentation
```bash
pagewatch add https://docs.example.com/api
pagewatch check
```
Add to cron for daily checks.

### 3. Track competitors
```bash
pagewatch add https://competitor.com/pricing
pagewatch add https://competitor.com/features
pagewatch check
```

### 4. Monitor government sites
```bash
pagewatch watch https://government.site/regulations -i 3600
```
Check every hour (3600 seconds).

### 5. Automatic monitoring with cron

Add to crontab (`crontab -e`):

```bash
# Check all pages every hour
0 * * * * pagewatch check

# Check all pages at 09:00 every weekday
0 9 * * 1-5 pagewatch check
```

## How it Works

- Uses SHA256 hash to detect content changes
- Saves data in `~/.pagewatch/pages.json`
- Color-coded output (green = changed, blue = checking, gray = no change)
- Beautiful tables with `cli-table3`

## Dependencies

- `chalk` - Terminal colors
- `cli-table3` - Beautiful tables
- `commander` - CLI framework

## Publishing to npm

To publish this package to npm (requires npm account):

```bash
# 1. Login to npm (first time)
npm login

# 2. Test that package is correctly configured
npm pack --dry-run

# 3. Publish to npm (scoped packages require public access)
npm publish --access public

# To update the package later:
npm version patch  # for bugfixes (1.0.0 -> 1.0.1)
npm version minor  # for new features (1.0.0 -> 1.1.0)
npm version major  # for breaking changes (1.0.0 -> 2.0.0)
npm publish
```

After publishing, users can install the package globally:
```bash
npm install -g @mattische/pagewatch
pagewatch list
```

## Author

Created by **mattische**

## License

MIT
