namespace WebsiteComparer.Core.Models;

/// <summary>
/// Represents the full comparison report for two websites.
/// </summary>
public sealed class ComparisonReport
{
    /// <summary>
    /// Gets or sets the configuration used for the comparison.
    /// </summary>
    public ComparisonConfig Config { get; set; } = new();

    /// <summary>
    /// Gets or sets the UTC timestamp when the report was generated.
    /// </summary>
    public DateTimeOffset GeneratedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// Gets or sets the per-page comparison results.
    /// </summary>
    public IReadOnlyList<PageComparisonResult> Results { get; set; } = Array.Empty<PageComparisonResult>();

    /// <summary>
    /// Gets or sets the summary statistics.
    /// </summary>
    public ComparisonSummary Summary { get; set; } = new();
}
