namespace WebsiteComparer.Core.Models;

/// <summary>
/// Defines the severity of a comparison issue.
/// </summary>
public enum ComparisonIssueSeverity
{
    /// <summary>
    /// Informational issue.
    /// </summary>
    Info,

    /// <summary>
    /// Warning issue.
    /// </summary>
    Warning,

    /// <summary>
    /// Error issue.
    /// </summary>
    Error
}
