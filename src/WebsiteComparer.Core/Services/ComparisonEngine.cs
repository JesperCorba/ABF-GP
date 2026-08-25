using Microsoft.Extensions.Logging;
using WebsiteComparer.Core.Interfaces;
using WebsiteComparer.Core.Models;

namespace WebsiteComparer.Core.Services;

/// <summary>
/// Coordinates site crawling, page analysis, and optional visual comparison.
/// </summary>
public sealed class ComparisonEngine : IComparisonEngine
{
    private readonly ICrawler _crawler;
    private readonly IPageAnalyzer _pageAnalyzer;
    private readonly IVisualComparer? _visualComparer;
    private readonly ILogger<ComparisonEngine> _logger;

    /// <summary>
    /// Initializes a new instance of the <see cref="ComparisonEngine"/> class.
    /// </summary>
    /// <param name="crawler">The crawler.</param>
    /// <param name="pageAnalyzer">The page analyzer.</param>
    /// <param name="visualComparer">The visual comparer.</param>
    /// <param name="logger">The logger.</param>
    public ComparisonEngine(ICrawler crawler, IPageAnalyzer pageAnalyzer, IVisualComparer? visualComparer, ILogger<ComparisonEngine> logger)
    {
        _crawler = crawler;
        _pageAnalyzer = pageAnalyzer;
        _visualComparer = visualComparer;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<ComparisonReport> RunAsync(ComparisonConfig config, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(config);
        Validate(config);

        var baseRoot = NormalizeSiteRoot(config.BaseUrl);
        var compareRoot = NormalizeSiteRoot(config.CompareUrl);
        var outputDirectory = Path.GetFullPath(config.OutputDirectory);
        Directory.CreateDirectory(outputDirectory);

        if (_visualComparer is IOutputDirectoryAwareVisualComparer configurableVisualComparer)
        {
            configurableVisualComparer.SetOutputDirectory(outputDirectory);
        }

        var discoveredPaths = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var queue = new Queue<(string RelativePath, int Depth)>();
        var results = new List<PageComparisonResult>();

        queue.Enqueue(("/", 0));
        discoveredPaths.Add("/");

        while (queue.Count > 0 && results.Count < config.MaxPages)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var (relativePath, depth) = queue.Dequeue();
            var basePageUrl = CombineSiteAndRelativePath(baseRoot, relativePath);
            var comparePageUrl = CombineSiteAndRelativePath(compareRoot, relativePath);

            CrawlResult baseResult;
            CrawlResult compareResult;

            try
            {
                baseResult = await _crawler.CrawlAsync(basePageUrl, cancellationToken).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to crawl baseline page {Url}", basePageUrl);
                baseResult = CreateFailedResult(basePageUrl);
            }

            try
            {
                compareResult = await _crawler.CrawlAsync(comparePageUrl, cancellationToken).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to crawl comparison page {Url}", comparePageUrl);
                compareResult = CreateFailedResult(comparePageUrl);
            }

            var comparison = _pageAnalyzer.Compare(baseResult, compareResult);
            comparison.Url = relativePath;

            if (config.ScreenshotsEnabled && _visualComparer is not null && baseResult.StatusCode < 400 && compareResult.StatusCode < 400)
            {
                try
                {
                    var visualResult = await _visualComparer.CompareAsync(relativePath, baseRoot, compareRoot, cancellationToken).ConfigureAwait(false);
                    comparison.HasVisualDiff = visualResult.HasDifferences;
                    comparison.DiffPercentage = visualResult.DiffPercentage;
                    comparison.BaseScreenshotPath = visualResult.BaseScreenshotPath;
                    comparison.CompareScreenshotPath = visualResult.CompareScreenshotPath;
                    comparison.DiffImagePath = visualResult.DiffImagePath;

                    if (visualResult.HasDifferences)
                    {
                        comparison.Issues.Add(new ComparisonIssue
                        {
                            Severity = ComparisonIssueSeverity.Warning,
                            Category = ComparisonIssueCategory.Visual,
                            Message = $"Visual difference detected ({visualResult.DiffPercentage:F2}% pixel variance)."
                        });
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Visual comparison failed for {RelativePath}", relativePath);
                    comparison.Issues.Add(new ComparisonIssue
                    {
                        Severity = ComparisonIssueSeverity.Warning,
                        Category = ComparisonIssueCategory.Visual,
                        Message = "Visual comparison could not be completed."
                    });
                }
            }

            results.Add(comparison);

            if (depth >= config.MaxDepth || baseResult.StatusCode >= 400)
            {
                continue;
            }

            foreach (var nextPath in baseResult.InternalLinks.Select(ToRelativePath))
            {
                if (string.IsNullOrWhiteSpace(nextPath) || discoveredPaths.Contains(nextPath))
                {
                    continue;
                }

                if (discoveredPaths.Count >= config.MaxPages)
                {
                    break;
                }

                discoveredPaths.Add(nextPath);
                queue.Enqueue((nextPath, depth + 1));
            }
        }

        return new ComparisonReport
        {
            Config = new ComparisonConfig
            {
                BaseUrl = baseRoot,
                CompareUrl = compareRoot,
                MaxDepth = config.MaxDepth,
                MaxPages = config.MaxPages,
                ScreenshotsEnabled = config.ScreenshotsEnabled,
                OutputDirectory = outputDirectory
            },
            GeneratedAt = DateTimeOffset.UtcNow,
            Results = results.OrderBy(result => result.Url, StringComparer.OrdinalIgnoreCase).ToArray(),
            Summary = BuildSummary(results)
        };
    }

    private static void Validate(ComparisonConfig config)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(config.BaseUrl);
        ArgumentException.ThrowIfNullOrWhiteSpace(config.CompareUrl);
        ArgumentException.ThrowIfNullOrWhiteSpace(config.OutputDirectory);

        if (config.MaxDepth < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(config.MaxDepth), "MaxDepth must be zero or greater.");
        }

        if (config.MaxPages <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(config.MaxPages), "MaxPages must be greater than zero.");
        }
    }

    private static string NormalizeSiteRoot(string siteUrl)
    {
        var uri = new Uri(siteUrl, UriKind.Absolute);
        return uri.AbsoluteUri.TrimEnd('/');
    }

    private static string CombineSiteAndRelativePath(string siteRoot, string relativePath)
    {
        var rootUri = new Uri(siteRoot.EndsWith("/", StringComparison.Ordinal) ? siteRoot : siteRoot + "/", UriKind.Absolute);
        var normalizedPath = relativePath.TrimStart('/');
        return new Uri(rootUri, normalizedPath).AbsoluteUri;
    }

    private static CrawlResult CreateFailedResult(string url) => new()
    {
        Url = url,
        StatusCode = 500
    };

    private static string ToRelativePath(string url)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
        {
            return "/";
        }

        var path = string.Concat(uri.AbsolutePath.TrimEnd('/'), uri.Query);
        return string.IsNullOrWhiteSpace(path) ? "/" : path;
    }

    private static ComparisonSummary BuildSummary(IEnumerable<PageComparisonResult> results)
    {
        var materialized = results.ToArray();
        return new ComparisonSummary
        {
            PagesScanned = materialized.Length,
            BrokenLinks = materialized.Count(result => result.BaseStatus >= 400 || result.CompareStatus >= 400),
            MissingPages = materialized.Count(result => result.CompareStatus == 404),
            ChangedPages = materialized.Count(result => result.Issues.Count > 0),
            VisualIssues = materialized.Count(result => result.HasVisualDiff)
        };
    }
}
