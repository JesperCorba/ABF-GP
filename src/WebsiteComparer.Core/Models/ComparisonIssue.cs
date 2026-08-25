namespace WebsiteComparer.Core.Models;

/// <summary>
/// Represents a single difference detected during comparison.
/// </summary>
public sealed class ComparisonIssue
{
    /// <summary>
    /// Gets or sets the issue severity.
    /// </summary>
    public ComparisonIssueSeverity Severity { get; set; }

    /// <summary>
    /// Gets or sets the issue category.
    /// </summary>
    public ComparisonIssueCategory Category { get; set; }

    /// <summary>
    /// Gets or sets the issue message.
    /// </summary>
    public string Message { get; set; } = string.Empty;
}
