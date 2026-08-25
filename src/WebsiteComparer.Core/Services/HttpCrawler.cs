using System.Net;
using HtmlAgilityPack;
using Microsoft.Extensions.Logging;
using WebsiteComparer.Core.Interfaces;
using WebsiteComparer.Core.Models;

namespace WebsiteComparer.Core.Services;

/// <summary>
/// Crawls pages by using <see cref="HttpClient"/> and parses HTML content.
/// </summary>
public sealed class HttpCrawler : ICrawler
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<HttpCrawler> _logger;

    /// <summary>
    /// Initializes a new instance of the <see cref="HttpCrawler"/> class.
    /// </summary>
    /// <param name="httpClient">The HTTP client used for requests.</param>
    /// <param name="logger">The logger.</param>
    public HttpCrawler(HttpClient httpClient, ILogger<HttpCrawler> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<CrawlResult> CrawlAsync(string url, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(url);

        _logger.LogInformation("Crawling {Url}", url);

        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        using var response = await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);
        var html = response.Content is null
            ? string.Empty
            : await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);

        return Parse(url, response.StatusCode, html);
    }

    /// <summary>
    /// Parses raw HTML into a <see cref="CrawlResult"/> instance.
    /// </summary>
    /// <param name="url">The crawled URL.</param>
    /// <param name="statusCode">The response status code.</param>
    /// <param name="htmlContent">The raw HTML content.</param>
    /// <returns>The parsed crawl result.</returns>
    public static CrawlResult Parse(string url, HttpStatusCode statusCode, string? htmlContent)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(url);

        var safeHtml = htmlContent ?? string.Empty;
        var pageUri = new Uri(url, UriKind.Absolute);
        var document = new HtmlDocument();
        document.LoadHtml(safeHtml);

        var title = document.DocumentNode.SelectSingleNode("//title")?.InnerText?.Trim() ?? string.Empty;
        var metaDescription = document.DocumentNode
            .SelectSingleNode("//meta[translate(@name, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')='description']")?
            .GetAttributeValue("content", string.Empty)
            .Trim() ?? string.Empty;
        var canonical = document.DocumentNode
            .SelectSingleNode("//link[contains(translate(@rel, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'canonical')]")?
            .GetAttributeValue("href", string.Empty)
            .Trim() ?? string.Empty;

        var h1s = document.DocumentNode
            .SelectNodes("//h1")?
            .Select(node => HtmlEntity.DeEntitize(node.InnerText).Trim())
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray() ?? [];

        var internalLinks = document.DocumentNode
            .SelectNodes("//a[@href]")?
            .Select(node => node.GetAttributeValue("href", string.Empty))
            .Select(link => NormalizeNavigableUrl(pageUri, link, requireSameHost: true))
            .Where(static value => !string.IsNullOrWhiteSpace(value))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray() ?? [];

        var imageUrls = document.DocumentNode
            .SelectNodes("//img[@src]")?
            .Select(node => node.GetAttributeValue("src", string.Empty))
            .Select(link => NormalizeNavigableUrl(pageUri, link, requireSameHost: false))
            .Where(static value => !string.IsNullOrWhiteSpace(value))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray() ?? [];

        return new CrawlResult
        {
            Url = url,
            StatusCode = (int)statusCode,
            Title = title,
            MetaDescription = metaDescription,
            Canonical = NormalizeNavigableUrl(pageUri, canonical, requireSameHost: false),
            H1s = h1s,
            InternalLinks = internalLinks,
            ImageUrls = imageUrls,
            HtmlContent = safeHtml
        };
    }

    private static string NormalizeNavigableUrl(Uri pageUri, string? candidate, bool requireSameHost)
    {
        if (string.IsNullOrWhiteSpace(candidate))
        {
            return string.Empty;
        }

        candidate = candidate.Trim();
        if (candidate.StartsWith("#", StringComparison.Ordinal) ||
            candidate.StartsWith("mailto:", StringComparison.OrdinalIgnoreCase) ||
            candidate.StartsWith("tel:", StringComparison.OrdinalIgnoreCase) ||
            candidate.StartsWith("javascript:", StringComparison.OrdinalIgnoreCase))
        {
            return string.Empty;
        }

        if (!Uri.TryCreate(pageUri, candidate, out var resolved))
        {
            return string.Empty;
        }

        if (requireSameHost && !string.Equals(resolved.Host, pageUri.Host, StringComparison.OrdinalIgnoreCase))
        {
            return string.Empty;
        }

        var builder = new UriBuilder(resolved)
        {
            Fragment = string.Empty,
            Port = resolved.IsDefaultPort ? -1 : resolved.Port
        };

        return builder.Uri.AbsoluteUri.TrimEnd('/');
    }
}
