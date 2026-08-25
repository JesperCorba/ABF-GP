using WebsiteComparer.Core.Models;

namespace WebsiteComparer.Core.Interfaces;

/// <summary>
/// Orchestrates crawling and comparison across both websites.
/// </summary>
public interface IComparisonEngine
{
    /// <summary>
    /// Runs the comparison workflow.
    /// </summary>
    /// <param name="config">The comparison configuration.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The completed comparison report.</returns>
    Task<ComparisonReport> RunAsync(ComparisonConfig config, CancellationToken cancellationToken);
}
