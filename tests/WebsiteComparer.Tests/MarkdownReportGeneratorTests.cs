using FluentAssertions;
using WebsiteComparer.Core.Models;
using WebsiteComparer.Reporting;

namespace WebsiteComparer.Tests;

public sealed class MarkdownReportGeneratorTests
{
    [Fact]
    public async Task GenerateAsync_ShouldCreateStructuredMarkdownReport()
    {
        var generator = new MarkdownReportGenerator();
        var report = new ComparisonReport
        {
            GeneratedAt = new DateTimeOffset(2026, 1, 1, 12, 0, 0, TimeSpan.Zero),
            Summary = new ComparisonSummary
            {
                PagesScanned = 2,
                BrokenLinks = 1,
                MissingPages = 1,
                ChangedPages = 1,
                VisualIssues = 1
            },
            Results =
            [
                new PageComparisonResult
                {
                    Url = "/about",
                    Issues =
                    [
                        new ComparisonIssue
                        {
                            Category = ComparisonIssueCategory.Seo,
                            Severity = ComparisonIssueSeverity.Warning,
                            Message = "Meta description differs between websites."
                        },
                        new ComparisonIssue
                        {
                            Category = ComparisonIssueCategory.Visual,
                            Severity = ComparisonIssueSeverity.Warning,
                            Message = "Visual difference detected (5.00% pixel variance)."
                        }
                    ]
                }
            ]
        };

        var outputDirectory = Path.Combine(AppContext.BaseDirectory, "test-output", nameof(GenerateAsync_ShouldCreateStructuredMarkdownReport));
        Directory.CreateDirectory(outputDirectory);
        var outputPath = Path.Combine(outputDirectory, "report.md");

        await generator.GenerateAsync(report, outputPath, CancellationToken.None);

        var content = await File.ReadAllTextAsync(outputPath, CancellationToken.None);
        content.Should().Contain("# Website Comparison Report");
        content.Should().Contain("## Summary");
        content.Should().Contain("## Functional Differences");
        content.Should().Contain("## Recommendations");
        content.Should().Contain("/about");
    }
}
