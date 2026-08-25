# Example Website Comparison

This example shows a typical staging-versus-production comparison.

## Step 1: Configure defaults

Copy the sample settings file and adjust the output directory if needed.

```bash
cp /home/runner/work/ABF-GP/ABF-GP/docs/examples/appsettings.example.json /home/runner/work/ABF-GP/ABF-GP/src/WebsiteComparer.CLI/appsettings.Local.json
```

## Step 2: Run the CLI

```bash
dotnet run --project /home/runner/work/ABF-GP/ABF-GP/src/WebsiteComparer.CLI -- compare           --base https://www.example.com           --compare https://staging.example.com           --depth 2           --max-pages 15           --output /home/runner/work/ABF-GP/ABF-GP/docs/reports
```

## Step 3: Review generated artifacts

The output directory contains Markdown, HTML, and optional visual diff files.

## Sample report excerpt

```markdown
# Website Comparison Report

## Summary

- Pages scanned: 15
- Broken links: 1
- Missing pages: 1
- Changed pages: 4
- Visual issues: 2

## SEO Differences

- **/about** [Warning] Meta description differs between websites.

## Visual Differences

- **/pricing** [Warning] Visual difference detected (8.42% pixel variance).
```

## Suggested config choices

- Use `--depth 1` for smoke checks on navigation and landing pages.
- Use `--depth 3` for fuller release validation on medium sites.
- Disable screenshots with `--no-screenshots` when only structural checks are required.
