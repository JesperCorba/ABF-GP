# WebsiteComparer

WebsiteComparer is a production-ready .NET 10 framework for crawling, comparing, and reporting on differences between two websites. It combines structural analysis, SEO checks, content comparison, and optional Playwright-powered visual diffs in a layered solution.

## Overview

The solution is organized into four runtime projects and one test project:

- `WebsiteComparer.Core` - domain models, crawler, analyzer, and orchestration engine.
- `WebsiteComparer.Playwright` - headless Chromium screenshots and visual diffing.
- `WebsiteComparer.Reporting` - Markdown and HTML report generation.
- `WebsiteComparer.CLI` - command-line host with dependency injection and styled console output.
- `WebsiteComparer.Tests` - xUnit and FluentAssertions coverage for the core workflow.

## Prerequisites

- .NET SDK 10.0 or later
- Playwright browser binaries for visual comparison
- Network access to the websites you want to compare

## Installation

```bash
dotnet restore /home/runner/work/ABF-GP/ABF-GP/WebsiteComparer.sln
dotnet build /home/runner/work/ABF-GP/ABF-GP/WebsiteComparer.sln --no-restore
pwsh /home/runner/work/ABF-GP/ABF-GP/src/WebsiteComparer.CLI/bin/Debug/net10.0/playwright.ps1 install
```

If PowerShell is unavailable, use the Playwright installation guidance for your platform after restoring packages.

## Configuration

The CLI reads `/home/runner/work/ABF-GP/ABF-GP/src/WebsiteComparer.CLI/appsettings.json`.

```json
{
  "Comparison": {
    "MaxDepth": 3,
    "MaxPages": 100,
    "ScreenshotsEnabled": true,
    "OutputDirectory": "./reports"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information"
    }
  }
}
```

Use `/home/runner/work/ABF-GP/ABF-GP/docs/examples/appsettings.example.json` as a starting point for environment-specific settings.

## Usage

Run comparisons through the CLI project:

```bash
dotnet run --project /home/runner/work/ABF-GP/ABF-GP/src/WebsiteComparer.CLI -- compare --base https://old.example.com --compare https://new.example.com
dotnet run --project /home/runner/work/ABF-GP/ABF-GP/src/WebsiteComparer.CLI -- compare --base https://old.example.com --compare https://new.example.com --depth 2 --max-pages 25 --output /home/runner/work/ABF-GP/ABF-GP/docs/reports
dotnet run --project /home/runner/work/ABF-GP/ABF-GP/src/WebsiteComparer.CLI -- compare --base https://old.example.com --compare https://new.example.com --no-screenshots
```

### Command Syntax

```text
compare --base <url> --compare <url> [--depth N] [--max-pages N] [--output dir] [--no-screenshots]
```

## Output

Each run produces:

- `website-comparison-report.md` - structured Markdown summary
- `website-comparison-report.html` - styled HTML report
- `visual/*.base.png` - baseline screenshots
- `visual/*.compare.png` - comparison screenshots
- `visual/*.diff.png` - pixel diff images

The report summarizes:

- Pages scanned
- Broken links and missing pages
- SEO metadata differences
- Content differences in H1s, images, and internal links
- Visual diffs and recommendations

## CI/CD Integration

GitHub Actions is configured in `/home/runner/work/ABF-GP/ABF-GP/.github/workflows/ci.yml` to restore, build, test, and upload test artifacts for every push and pull request.

Use the CLI inside release pipelines to compare a staging deployment against production before promoting changes.

## Architecture Overview

```text
WebsiteComparer.CLI
  -> WebsiteComparer.Core
  -> WebsiteComparer.Reporting
  -> WebsiteComparer.Playwright
       -> WebsiteComparer.Core

WebsiteComparer.Tests
  -> WebsiteComparer.Core
  -> WebsiteComparer.Reporting
```

The core engine crawls the baseline site breadth-first, maps each discovered path to the comparison site, then enriches results with visual diffs and generated reports.

## Contributing

1. Restore dependencies with `dotnet restore`.
2. Build with `dotnet build`.
3. Run tests with `dotnet test`.
4. Keep public APIs documented and preserve cancellation token support on async members.
5. Update docs and examples when behavior changes.

Additional architecture notes and roadmap details are available in `/home/runner/work/ABF-GP/ABF-GP/docs/Architecture.md` and `/home/runner/work/ABF-GP/ABF-GP/docs/Roadmap.md`.
