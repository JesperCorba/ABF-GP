namespace WebsiteComparer.Core.Models;

/// <summary>
/// Represents the configuration used to compare two websites.
/// </summary>
public sealed class ComparisonConfig
{
    /// <summary>
    /// Gets or sets the root URL for the baseline website.
    /// </summary>
    public string BaseUrl { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the root URL for the website being compared.
    /// </summary>
    public string CompareUrl { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the maximum crawl depth.
    /// </summary>
    public int MaxDepth { get; set; } = 3;

    /// <summary>
    /// Gets or sets the maximum number of pages to scan.
    /// </summary>
    public int MaxPages { get; set; } = 100;

    /// <summary>
    /// Gets or sets a value indicating whether screenshots and visual comparison are enabled.
    /// </summary>
    public bool ScreenshotsEnabled { get; set; } = true;

    /// <summary>
    /// Gets or sets the output directory for reports and generated assets.
    /// </summary>
    public string OutputDirectory { get; set; } = string.Empty;
}
