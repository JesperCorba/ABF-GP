namespace WebsiteComparer.Core.Models;

/// <summary>
/// Represents high-level statistics for a completed comparison.
/// </summary>
public sealed class ComparisonSummary
{
    /// <summary>
    /// Gets or sets the total number of scanned pages.
    /// </summary>
    public int PagesScanned { get; set; }

    /// <summary>
    /// Gets or sets the number of pages with non-success status codes.
    /// </summary>
    public int BrokenLinks { get; set; }

    /// <summary>
    /// Gets or sets the number of pages missing from the comparison target.
    /// </summary>
    public int MissingPages { get; set; }

    /// <summary>
    /// Gets or sets the number of pages with one or more detected changes.
    /// </summary>
    public int ChangedPages { get; set; }

    /// <summary>
    /// Gets or sets the number of pages with visual differences.
    /// </summary>
    public int VisualIssues { get; set; }
}
