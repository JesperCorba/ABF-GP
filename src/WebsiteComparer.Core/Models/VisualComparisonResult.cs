namespace WebsiteComparer.Core.Models;

/// <summary>
/// Represents the output of a visual comparison.
/// </summary>
public sealed class VisualComparisonResult
{
    /// <summary>
    /// Gets or sets the screenshot path for the baseline page.
    /// </summary>
    public string BaseScreenshotPath { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the screenshot path for the compared page.
    /// </summary>
    public string CompareScreenshotPath { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the generated diff image path.
    /// </summary>
    public string DiffImagePath { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the percentage of differing pixels.
    /// </summary>
    public double DiffPercentage { get; set; }

    /// <summary>
    /// Gets or sets a value indicating whether visual differences were detected.
    /// </summary>
    public bool HasDifferences { get; set; }
}
