using System.Text;
using Markdig;
using WebsiteComparer.Core.Interfaces;
using WebsiteComparer.Core.Models;
using WebsiteComparer.Reporting.Internal;

namespace WebsiteComparer.Reporting;

/// <summary>
/// Generates a styled HTML comparison report.
/// </summary>
public sealed class HtmlReportGenerator : IReportGenerator
{
    private readonly MarkdownReportBuilder _builder = new();

    /// <inheritdoc />
    public async Task GenerateAsync(ComparisonReport report, string outputPath, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(report);
        ArgumentException.ThrowIfNullOrWhiteSpace(outputPath);

        var directory = Path.GetDirectoryName(outputPath);
        if (!string.IsNullOrWhiteSpace(directory))
        {
            Directory.CreateDirectory(directory);
        }

        var markdown = _builder.Build(report);
        var htmlBody = Markdown.ToHtml(markdown);
        var html = BuildDocument(htmlBody);
        await File.WriteAllTextAsync(outputPath, html, Encoding.UTF8, cancellationToken).ConfigureAwait(false);
    }

    private static string BuildDocument(string htmlBody) => $@"<!DOCTYPE html>
<html lang=""en"">
<head>
  <meta charset=""utf-8"" />
  <meta name=""viewport"" content=""width=device-width, initial-scale=1"" />
  <title>Website Comparison Report</title>
  <style>
    body {{ font-family: Arial, sans-serif; margin: 0; background: #f5f7fb; color: #1f2937; }}
    main {{ max-width: 960px; margin: 0 auto; padding: 2rem; }}
    h1, h2 {{ color: #111827; }}
    code {{ background: #e5e7eb; padding: 0.15rem 0.35rem; border-radius: 4px; }}
    ul {{ line-height: 1.6; }}
    .content {{ background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); }}
  </style>
</head>
<body>
  <main><div class=""content"">{htmlBody}</div></main>
</body>
</html>";
}
