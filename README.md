# PageWatch

Monitor webpage changes from the CLI. Watch URLs continuously or check on-demand.

[npjms.com](https://www.npmjs.com/package/@mattische/pagewatch)

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

### Watch a page or monitor several pages continuously

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

# Monitor a list of pages (1, 2 and 4 from list) with an interval of 5 seconds
pagewatch monitor 1 2 4 -i 5
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
Or use with pm.

### 3. Automatic monitoring with cron

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
- Tables with `cli-table3`

## Dependencies

- `chalk` - Terminal colors
- `cli-table3` - Beautiful tables
- `commander` - CLI framework

## Author

Created by **mattische**

npm: https://www.npmjs.com/package/@mattische/pagewatch

## License

MIT
