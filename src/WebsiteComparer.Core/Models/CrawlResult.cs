namespace WebsiteComparer.Core.Models;

/// <summary>
/// Represents the extracted data for a crawled page.
/// </summary>
public sealed class CrawlResult
{
    /// <summary>
    /// Gets or sets the crawled page URL.
    /// </summary>
    public string Url { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the HTTP status code returned for the page.
    /// </summary>
    public int StatusCode { get; set; }

    /// <summary>
    /// Gets or sets the page title.
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the meta description content.
    /// </summary>
    public string MetaDescription { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the canonical link reference.
    /// </summary>
    public string Canonical { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the H1 values extracted from the page.
    /// </summary>
    public IReadOnlyList<string> H1s { get; set; } = Array.Empty<string>();

    /// <summary>
    /// Gets or sets the internal links discovered on the page.
    /// </summary>
    public IReadOnlyList<string> InternalLinks { get; set; } = Array.Empty<string>();

    /// <summary>
    /// Gets or sets the image URLs discovered on the page.
    /// </summary>
    public IReadOnlyList<string> ImageUrls { get; set; } = Array.Empty<string>();

    /// <summary>
    /// Gets or sets the raw HTML content.
    /// </summary>
    public string HtmlContent { get; set; } = string.Empty;
}
