# WebsiteComparer Architecture

## Layered design

WebsiteComparer uses a classic layered architecture so responsibilities stay isolated and testable.

- **WebsiteComparer.Core** handles crawling contracts, page models, comparison rules, and orchestration.
- **WebsiteComparer.Playwright** adds browser automation and pixel-based screenshot comparison.
- **WebsiteComparer.Reporting** transforms results into Markdown and HTML deliverables.
- **WebsiteComparer.CLI** wires everything together with configuration, dependency injection, and terminal UX.
- **WebsiteComparer.Tests** validates parsing, comparison logic, reporting, and orchestration behavior.

## Dependency diagram

```text
WebsiteComparer.CLI
├── WebsiteComparer.Core
├── WebsiteComparer.Playwright
│   └── WebsiteComparer.Core
└── WebsiteComparer.Reporting
    └── WebsiteComparer.Core

WebsiteComparer.Tests
├── WebsiteComparer.Core
└── WebsiteComparer.Reporting
```

## Key design decisions

1. **Core-first contracts** keep interfaces and models independent from any browser or reporting technology.
2. **Breadth-first crawl strategy** ensures shallow, high-value pages are scanned before deeper branches.
3. **Host-agnostic comparison rules** compare canonical paths, internal links, and image references semantically rather than by domain alone.
4. **Optional visual comparison** allows functional-only checks when Playwright browsers are unavailable.
5. **Separate report generators** make it easy to add future formats without changing crawl logic.

## Runtime flow

1. The CLI loads defaults from `appsettings.json` and merges command-line overrides.
2. The comparison engine crawls pages from the baseline website.
3. Each discovered path is mirrored against the comparison website.
4. The page analyzer records SEO, content, and functional differences.
5. The Playwright layer optionally captures screenshots and produces diff images.
6. Reporting generators create Markdown and HTML outputs in the configured report directory.
