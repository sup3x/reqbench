<p align="center">
  <h1 align="center">reqbench</h1>
  <p align="center">
    Simple, beautiful API load testing from the terminal.
  </p>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/reqbench"><img src="https://img.shields.io/npm/v/reqbench.svg" alt="npm version"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://github.com/sup3x/reqbench/actions/workflows/ci.yml"><img src="https://github.com/sup3x/reqbench/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
</p>

---

## The Problem

- You want to load-test an API endpoint but `ab` requires Apache, `wrk` needs compilation, and `k6` demands a config file before it'll run a single request.
- You get a wall of numbers with no sense of what's good or bad.
- You need to hand results to a teammate but all you have is terminal scrollback.

## The Solution

- **One command** to benchmark any URL — no config, no install friction, no boilerplate.
- **Beautiful output** with latency percentiles, status code bars, and a distribution histogram — right in your terminal.
- **JSON export** so results live in your CI artifacts, dashboards, or issue comments.

## Quick Start

```bash
npm install -g reqbench

reqbench https://api.example.com/users
```

That's it. Results appear in seconds.

## Usage

### Basic GET

```bash
reqbench https://api.example.com/users
```

### POST with inline body

```bash
reqbench https://api.example.com/users -m POST -b '{"name":"test"}'
```

### POST with body from file

```bash
reqbench https://api.example.com/users -m POST -b @payload.json
```

### Custom headers

```bash
reqbench https://api.example.com -H "Authorization: Bearer token" -H "X-App-Version: 2"
```

### Duration mode — run for 30 seconds with 50 concurrent connections

```bash
reqbench https://api.example.com -d 30s -c 50
```

### Export results to JSON

```bash
reqbench https://api.example.com -o results.json
```

### Quiet mode — summary only, no progress bar

```bash
reqbench https://api.example.com -q
```

## Sample Output

```
  reqbench — https://api.example.com/users

  Running 100 requests with 10 concurrent connections...

  ──────────────────────────────────────────────────────
  Summary
  ──────────────────────────────────────────────────────

  Total Requests    100
  Succeeded         100          (100.00%)
  Total Time        1.24s
  Requests/sec      80.65

  ──────────────────────────────────────────────────────
  Latency
  ──────────────────────────────────────────────────────

  Min               45ms
  Max               312ms
  Mean              121ms
  Median (p50)      108ms
  p90               198ms
  p95               241ms
  p99               307ms

  ──────────────────────────────────────────────────────
  Status Codes
  ──────────────────────────────────────────────────────

  200                 100  ████████████████████

  ──────────────────────────────────────────────────────
  Latency Distribution
  ──────────────────────────────────────────────────────

  0–50ms     ██                         3
  50–100ms   ████████                  18
  100–150ms  ████████████████████      47
  150–200ms  ████████████              22
  200–250ms  ████                       7
  250–300ms  █                          2
  300ms+     █                          1
```

## CLI Reference

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| `<url>` | — | Target URL (required) | — |
| `--requests` | `-n` | Total number of requests | `100` |
| `--concurrency` | `-c` | Concurrent connections | `10` |
| `--duration` | `-d` | Run for a fixed duration instead of a request count (e.g. `10s`, `1m`, `500ms`) | — |
| `--method` | `-m` | HTTP method | `GET` |
| `--body` | `-b` | Request body — inline string or `@filename` to read from a file | — |
| `--header` | `-H` | HTTP header in `Key: Value` format — repeatable | — |
| `--timeout` | `-t` | Per-request timeout | `10s` |
| `--output` | `-o` | Export results to a JSON file | — |
| `--quiet` | `-q` | Only show summary (no progress bar) | — |
| `--no-color` | — | Disable colored output | — |
| `--version` | `-V` | Print version and exit | — |

**Duration format:** plain milliseconds (`500`), seconds (`10s`), or minutes (`2m`).

**`-d` vs `-n`:** When `--duration` is set it takes precedence and `--requests` is ignored.

## Comparison

| Feature | reqbench | ab | wrk | k6 | autocannon |
|---------|----------|----|-----|----|------------|
| Beautiful output | yes | - | - | partial | - |
| Zero config | yes | yes | yes | - | yes |
| JSON export | yes | - | - | yes | yes |
| Duration mode | yes | yes | yes | yes | yes |
| Custom headers | yes | yes | yes | yes | yes |
| Node.js native | yes | - | - | - | yes |
| No compilation needed | yes | - | - | yes | yes |

## Contributing

Contributions are welcome! Here's how to get started:

```bash
git clone https://github.com/sup3x/reqbench.git
cd reqbench
npm install
npm test        # Run the test suite
npm run build   # Build for production
```

**Development workflow:**

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes and add tests
4. Run `npm test` to ensure all tests pass
5. Submit a pull request

Please make sure all existing tests pass and new features include appropriate test coverage.

## License

[MIT](LICENSE) — Kerim Gulen
