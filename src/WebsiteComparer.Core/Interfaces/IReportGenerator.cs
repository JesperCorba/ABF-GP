using WebsiteComparer.Core.Models;

namespace WebsiteComparer.Core.Interfaces;

/// <summary>
/// Generates a comparison report artifact.
/// </summary>
public interface IReportGenerator
{
    /// <summary>
    /// Generates a report file at the specified path.
    /// </summary>
    /// <param name="report">The report content.</param>
    /// <param name="outputPath">The output file path.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task that completes when generation finishes.</returns>
    Task GenerateAsync(ComparisonReport report, string outputPath, CancellationToken cancellationToken);
}
