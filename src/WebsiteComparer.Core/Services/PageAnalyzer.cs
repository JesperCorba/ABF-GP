using WebsiteComparer.Core.Interfaces;
using WebsiteComparer.Core.Models;

namespace WebsiteComparer.Core.Services;

/// <summary>
/// Compares crawled page content and produces structured issues.
/// </summary>
public sealed class PageAnalyzer : IPageAnalyzer
{
    /// <inheritdoc />
    public PageComparisonResult Compare(CrawlResult baseResult, CrawlResult compareResult)
    {
        ArgumentNullException.ThrowIfNull(baseResult);
        ArgumentNullException.ThrowIfNull(compareResult);

        var titleMatch = Matches(baseResult.Title, compareResult.Title);
        var metaMatch = Matches(baseResult.MetaDescription, compareResult.MetaDescription);
        var canonicalMatch = MatchesReference(baseResult.Canonical, compareResult.Canonical);
        var baseLinks = NormalizeCollection(baseResult.InternalLinks, referenceMode: true);
        var compareLinks = NormalizeCollection(compareResult.InternalLinks, referenceMode: true);
        var baseImages = NormalizeCollection(baseResult.ImageUrls, referenceMode: true);
        var compareImages = NormalizeCollection(compareResult.ImageUrls, referenceMode: true);
        var baseHeaders = NormalizeCollection(baseResult.H1s, referenceMode: false);
        var compareHeaders = NormalizeCollection(compareResult.H1s, referenceMode: false);

        var result = new PageComparisonResult
        {
            Url = ToComparableReference(baseResult.Url),
            BaseStatus = baseResult.StatusCode,
            CompareStatus = compareResult.StatusCode,
            TitleMatch = titleMatch,
            MetaDescriptionMatch = metaMatch,
            CanonicalMatch = canonicalMatch,
            BaseH1Headers = baseHeaders,
            CompareH1Headers = compareHeaders,
            BaseInternalLinks = baseLinks,
            CompareInternalLinks = compareLinks,
            BaseImages = baseImages,
            CompareImages = compareImages
        };

        if (baseResult.StatusCode >= 400)
        {
            result.Issues.Add(CreateIssue(ComparisonIssueSeverity.Error, ComparisonIssueCategory.Functional, $"Baseline page returned status {baseResult.StatusCode}."));
        }

        if (compareResult.StatusCode >= 400)
        {
            var severity = compareResult.StatusCode == 404 ? ComparisonIssueSeverity.Error : ComparisonIssueSeverity.Warning;
            result.Issues.Add(CreateIssue(severity, ComparisonIssueCategory.Functional, $"Comparison page returned status {compareResult.StatusCode}."));
        }

        if (!titleMatch)
        {
            result.Issues.Add(CreateIssue(ComparisonIssueSeverity.Warning, ComparisonIssueCategory.Seo, "Page title differs between websites."));
        }

        if (!metaMatch)
        {
            result.Issues.Add(CreateIssue(ComparisonIssueSeverity.Warning, ComparisonIssueCategory.Seo, "Meta description differs between websites."));
        }

        if (!canonicalMatch)
        {
            result.Issues.Add(CreateIssue(ComparisonIssueSeverity.Warning, ComparisonIssueCategory.Seo, "Canonical link differs between websites."));
        }

        AppendCollectionIssue(result.Issues, baseHeaders, compareHeaders, ComparisonIssueCategory.Content, "H1 headings");
        AppendCollectionIssue(result.Issues, baseLinks, compareLinks, ComparisonIssueCategory.Functional, "internal links");
        AppendCollectionIssue(result.Issues, baseImages, compareImages, ComparisonIssueCategory.Content, "images");

        return result;
    }

    private static bool Matches(string? left, string? right) =>
        string.Equals((left ?? string.Empty).Trim(), (right ?? string.Empty).Trim(), StringComparison.OrdinalIgnoreCase);

    private static bool MatchesReference(string? left, string? right) =>
        string.Equals(ToComparableReference(left), ToComparableReference(right), StringComparison.OrdinalIgnoreCase);

    private static IReadOnlyList<string> NormalizeCollection(IEnumerable<string>? values, bool referenceMode)
    {
        return (values ?? [])
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => referenceMode ? ToComparableReference(value) : value.Trim())
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(value => value, StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    private static string ToComparableReference(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return "/";
        }

        if (Uri.TryCreate(value, UriKind.Absolute, out var absoluteUri))
        {
            var normalized = string.Concat(absoluteUri.AbsolutePath.TrimEnd('/'), absoluteUri.Query);
            return string.IsNullOrWhiteSpace(normalized) ? "/" : normalized;
        }

        if (Uri.TryCreate(value, UriKind.Relative, out _))
        {
            var cleaned = value.Trim();
            if (!cleaned.StartsWith("/", StringComparison.Ordinal))
            {
                cleaned = "/" + cleaned;
            }

            return cleaned.TrimEnd('/').Length == 0 ? "/" : cleaned.TrimEnd('/');
        }

        return value.Trim();
    }

    private static void AppendCollectionIssue(
        ICollection<ComparisonIssue> issues,
        IReadOnlyCollection<string> baseValues,
        IReadOnlyCollection<string> compareValues,
        ComparisonIssueCategory category,
        string label)
    {
        if (baseValues.Count == compareValues.Count && baseValues.All(value => compareValues.Contains(value, StringComparer.OrdinalIgnoreCase)))
        {
            return;
        }

        var missing = baseValues.Except(compareValues, StringComparer.OrdinalIgnoreCase).ToArray();
        var added = compareValues.Except(baseValues, StringComparer.OrdinalIgnoreCase).ToArray();
        var segments = new List<string>();

        if (missing.Length > 0)
        {
            segments.Add($"missing: {string.Join(", ", missing)}");
        }

        if (added.Length > 0)
        {
            segments.Add($"added: {string.Join(", ", added)}");
        }

        issues.Add(CreateIssue(
            ComparisonIssueSeverity.Warning,
            category,
            $"{label} differ ({string.Join("; ", segments)})."));
    }

    private static ComparisonIssue CreateIssue(ComparisonIssueSeverity severity, ComparisonIssueCategory category, string message) =>
        new()
        {
            Severity = severity,
            Category = category,
            Message = message
        };
}
