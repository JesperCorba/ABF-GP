using System.Text;
using WebsiteComparer.Core.Models;

namespace WebsiteComparer.Reporting.Internal;

internal sealed class MarkdownReportBuilder
{
    public string Build(ComparisonReport report)
    {
        ArgumentNullException.ThrowIfNull(report);

        var functionalIssues = Filter(report, ComparisonIssueCategory.Functional);
        var contentIssues = Filter(report, ComparisonIssueCategory.Content);
        var seoIssues = Filter(report, ComparisonIssueCategory.Seo);
        var visualIssues = Filter(report, ComparisonIssueCategory.Visual);

        var builder = new StringBuilder();
        builder.AppendLine("# Website Comparison Report");
        builder.AppendLine();
        builder.AppendLine($"Generated: {report.GeneratedAt:O}");
        builder.AppendLine();
        builder.AppendLine("## Summary");
        builder.AppendLine();
        builder.AppendLine($"- Pages scanned: {report.Summary.PagesScanned}");
        builder.AppendLine($"- Broken links: {report.Summary.BrokenLinks}");
        builder.AppendLine($"- Missing pages: {report.Summary.MissingPages}");
        builder.AppendLine($"- Changed pages: {report.Summary.ChangedPages}");
        builder.AppendLine($"- Visual issues: {report.Summary.VisualIssues}");
        builder.AppendLine();
        builder.AppendLine("## Functional Differences");
        builder.Append(BuildIssueSection(functionalIssues));
        builder.AppendLine("## Content Differences");
        builder.Append(BuildIssueSection(contentIssues));
        builder.AppendLine("## SEO Differences");
        builder.Append(BuildIssueSection(seoIssues));
        builder.AppendLine("## Visual Differences");
        builder.Append(BuildIssueSection(visualIssues));
        builder.AppendLine("## Recommendations");
        builder.AppendLine();

        foreach (var recommendation in BuildRecommendations(report))
        {
            builder.AppendLine($"- {recommendation}");
        }

        return builder.ToString();
    }

    private static IReadOnlyList<(string Url, ComparisonIssue Issue)> Filter(ComparisonReport report, ComparisonIssueCategory category)
    {
        return report.Results
            .SelectMany(result => result.Issues
                .Where(issue => issue.Category == category)
                .Select(issue => (result.Url, issue)))
            .ToArray();
    }

    private static string BuildIssueSection(IReadOnlyList<(string Url, ComparisonIssue Issue)> issues)
    {
        var builder = new StringBuilder();
        builder.AppendLine();

        if (issues.Count == 0)
        {
            builder.AppendLine("No differences detected.");
            builder.AppendLine();
            return builder.ToString();
        }

        foreach (var (url, issue) in issues)
        {
            builder.AppendLine($"- **{url}** [{issue.Severity}] {issue.Message}");
        }

        builder.AppendLine();
        return builder.ToString();
    }

    private static IEnumerable<string> BuildRecommendations(ComparisonReport report)
    {
        if (report.Summary.MissingPages > 0)
        {
            yield return "Restore or redirect missing pages on the comparison site before release.";
        }

        if (report.Results.Any(result => !result.TitleMatch || !result.MetaDescriptionMatch || !result.CanonicalMatch))
        {
            yield return "Align SEO metadata so crawlers see equivalent canonical, title, and description values.";
        }

        if (report.Results.Any(result => result.HasVisualDiff))
        {
            yield return "Review the generated diff images to confirm whether visual changes are intentional.";
        }

        if (report.Results.Any(result => result.Issues.Any(issue => issue.Category == ComparisonIssueCategory.Functional)))
        {
            yield return "Investigate non-success status codes and mismatched internal links to prevent broken navigation.";
        }

        if (!report.Results.Any(result => result.Issues.Count > 0))
        {
            yield return "No action required; the compared site matches the baseline for the scanned scope.";
        }
    }
}
