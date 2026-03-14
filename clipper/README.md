# Publix Coupon Clipper (Personal)

Local Puppeteer script that logs into Publix and clips all digital coupons.

## Quick run

```bash
./clip.sh
```

This starts the Express/Puppeteer server on port 10001, clips all coupons, then shuts down.

## Scheduled (launchd)

A launchd job runs this every Sunday at 8am. If the Mac is asleep, it fires when the machine wakes.

```
~/Library/LaunchAgents/com.bogo.clipper.plist
```

Output goes to `~/clip-log.txt`.

### Manage the schedule

```bash
# Check status
launchctl list | grep bogo

# Disable
launchctl unload ~/Library/LaunchAgents/com.bogo.clipper.plist

# Re-enable
launchctl load ~/Library/LaunchAgents/com.bogo.clipper.plist
```

## Dependencies

```bash
cd clipper && npm install
```

Requires Node.js and Chromium (installed via puppeteer).
