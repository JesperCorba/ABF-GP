namespace WebsiteComparer.Core.Models;

/// <summary>
/// Represents the comparison output for a single page.
/// </summary>
public sealed class PageComparisonResult
{
    /// <summary>
    /// Gets or sets the page URL or relative path.
    /// </summary>
    public string Url { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the baseline status code.
    /// </summary>
    public int BaseStatus { get; set; }

    /// <summary>
    /// Gets or sets the compared status code.
    /// </summary>
    public int CompareStatus { get; set; }

    /// <summary>
    /// Gets or sets a value indicating whether titles match.
    /// </summary>
    public bool TitleMatch { get; set; }

    /// <summary>
    /// Gets or sets a value indicating whether meta descriptions match.
    /// </summary>
    public bool MetaDescriptionMatch { get; set; }

    /// <summary>
    /// Gets or sets a value indicating whether canonical references match.
    /// </summary>
    public bool CanonicalMatch { get; set; }

    /// <summary>
    /// Gets or sets the baseline H1 headers.
    /// </summary>
    public IReadOnlyList<string> BaseH1Headers { get; set; } = Array.Empty<string>();

    /// <summary>
    /// Gets or sets the compared H1 headers.
    /// </summary>
    public IReadOnlyList<string> CompareH1Headers { get; set; } = Array.Empty<string>();

    /// <summary>
    /// Gets or sets the baseline internal links.
    /// </summary>
    public IReadOnlyList<string> BaseInternalLinks { get; set; } = Array.Empty<string>();

    /// <summary>
    /// Gets or sets the compared internal links.
    /// </summary>
    public IReadOnlyList<string> CompareInternalLinks { get; set; } = Array.Empty<string>();

    /// <summary>
    /// Gets or sets the baseline images.
    /// </summary>
    public IReadOnlyList<string> BaseImages { get; set; } = Array.Empty<string>();

    /// <summary>
    /// Gets or sets the compared images.
    /// </summary>
    public IReadOnlyList<string> CompareImages { get; set; } = Array.Empty<string>();

    /// <summary>
    /// Gets or sets a value indicating whether a visual difference exists.
    /// </summary>
    public bool HasVisualDiff { get; set; }

    /// <summary>
    /// Gets or sets the visual difference percentage.
    /// </summary>
    public double DiffPercentage { get; set; }

    /// <summary>
    /// Gets or sets the generated baseline screenshot path.
    /// </summary>
    public string BaseScreenshotPath { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the generated comparison screenshot path.
    /// </summary>
    public string CompareScreenshotPath { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the generated diff image path.
    /// </summary>
    public string DiffImagePath { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the list of detected issues.
    /// </summary>
    public List<ComparisonIssue> Issues { get; set; } = [];
}
