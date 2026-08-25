using WebsiteComparer.Core.Models;

namespace WebsiteComparer.Core.Interfaces;

/// <summary>
/// Performs pixel-based visual comparison between two pages.
/// </summary>
public interface IVisualComparer
{
    /// <summary>
    /// Compares the same relative page on two websites.
    /// </summary>
    /// <param name="url">The relative page URL to compare.</param>
    /// <param name="baseUrl">The baseline site root URL.</param>
    /// <param name="compareUrl">The comparison site root URL.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The visual comparison result.</returns>
    Task<VisualComparisonResult> CompareAsync(string url, string baseUrl, string compareUrl, CancellationToken cancellationToken);
}
