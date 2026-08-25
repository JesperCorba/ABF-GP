namespace WebsiteComparer.Core.Models;

/// <summary>
/// Defines the category of a comparison issue.
/// </summary>
public enum ComparisonIssueCategory
{
    /// <summary>
    /// Search engine optimization issue.
    /// </summary>
    Seo,

    /// <summary>
    /// Content difference issue.
    /// </summary>
    Content,

    /// <summary>
    /// Visual difference issue.
    /// </summary>
    Visual,

    /// <summary>
    /// Functional behavior issue.
    /// </summary>
    Functional
}
