using System.Text;
using WebsiteComparer.Core.Interfaces;
using WebsiteComparer.Core.Models;
using WebsiteComparer.Reporting.Internal;

namespace WebsiteComparer.Reporting;

/// <summary>
/// Generates a Markdown comparison report.
/// </summary>
public sealed class MarkdownReportGenerator : IReportGenerator
{
    private readonly MarkdownReportBuilder _builder = new();

    /// <inheritdoc />
    public async Task GenerateAsync(ComparisonReport report, string outputPath, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(report);
        ArgumentException.ThrowIfNullOrWhiteSpace(outputPath);

        var directory = Path.GetDirectoryName(outputPath);
        if (!string.IsNullOrWhiteSpace(directory))
        {
            Directory.CreateDirectory(directory);
        }

        var content = _builder.Build(report);
        await File.WriteAllTextAsync(outputPath, content, Encoding.UTF8, cancellationToken).ConfigureAwait(false);
    }
}
