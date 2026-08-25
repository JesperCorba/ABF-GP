using WebsiteComparer.Core.Models;

namespace WebsiteComparer.Core.Interfaces;

/// <summary>
/// Crawls a page and extracts comparable content.
/// </summary>
public interface ICrawler
{
    /// <summary>
    /// Crawls the provided URL.
    /// </summary>
    /// <param name="url">The absolute URL to crawl.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The crawl result.</returns>
    Task<CrawlResult> CrawlAsync(string url, CancellationToken cancellationToken);
}
