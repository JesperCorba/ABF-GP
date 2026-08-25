using WebsiteComparer.Core.Models;

namespace WebsiteComparer.Core.Interfaces;

/// <summary>
/// Compares two crawled pages.
/// </summary>
public interface IPageAnalyzer
{
    /// <summary>
    /// Produces a comparison result for two pages.
    /// </summary>
    /// <param name="baseResult">The baseline page.</param>
    /// <param name="compareResult">The page being compared.</param>
    /// <returns>The comparison result.</returns>
    PageComparisonResult Compare(CrawlResult baseResult, CrawlResult compareResult);
}
