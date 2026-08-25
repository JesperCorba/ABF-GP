using Microsoft.Extensions.Logging;
using Spectre.Console;
using WebsiteComparer.Core.Interfaces;
using WebsiteComparer.Core.Models;
using WebsiteComparer.Reporting;

namespace WebsiteComparer.CLI;

/// <summary>
/// Executes comparison runs and emits CLI output.
/// </summary>
public sealed class ComparisonRunner
{
    private readonly IComparisonEngine _comparisonEngine;
    private readonly ILogger<ComparisonRunner> _logger;
    private readonly MarkdownReportGenerator _markdownReportGenerator;
    private readonly HtmlReportGenerator _htmlReportGenerator;

    /// <summary>
    /// Initializes a new instance of the <see cref="ComparisonRunner"/> class.
    /// </summary>
    /// <param name="comparisonEngine">The comparison engine.</param>
    /// <param name="logger">The logger.</param>
    /// <param name="markdownReportGenerator">The Markdown report generator.</param>
    /// <param name="htmlReportGenerator">The HTML report generator.</param>
    public ComparisonRunner(
        IComparisonEngine comparisonEngine,
        ILogger<ComparisonRunner> logger,
        MarkdownReportGenerator markdownReportGenerator,
        HtmlReportGenerator htmlReportGenerator)
    {
        _comparisonEngine = comparisonEngine;
        _logger = logger;
        _markdownReportGenerator = markdownReportGenerator;
        _htmlReportGenerator = htmlReportGenerator;
    }

    /// <summary>
    /// Runs the comparison and persists report artifacts.
    /// </summary>
    /// <param name="config">The comparison configuration.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The completed report.</returns>
    public async Task<ComparisonReport> RunAsync(ComparisonConfig config, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(config);

        var report = await AnsiConsole.Status()
            .Spinner(Spinner.Known.Dots)
            .StartAsync("Comparing websites...", async _ =>
            {
                return await _comparisonEngine.RunAsync(config, cancellationToken).ConfigureAwait(false);
            }).ConfigureAwait(false);

        var markdownPath = Path.Combine(config.OutputDirectory, "website-comparison-report.md");
        var htmlPath = Path.Combine(config.OutputDirectory, "website-comparison-report.html");

        await _markdownReportGenerator.GenerateAsync(report, markdownPath, cancellationToken).ConfigureAwait(false);
        await _htmlReportGenerator.GenerateAsync(report, htmlPath, cancellationToken).ConfigureAwait(false);

        _logger.LogInformation("Reports generated at {OutputDirectory}", config.OutputDirectory);

        var table = new Table().RoundedBorder();
        table.AddColumn("Metric");
        table.AddColumn("Value");
        table.AddRow("Pages scanned", report.Summary.PagesScanned.ToString());
        table.AddRow("Changed pages", report.Summary.ChangedPages.ToString());
        table.AddRow("Missing pages", report.Summary.MissingPages.ToString());
        table.AddRow("Visual issues", report.Summary.VisualIssues.ToString());
        table.AddRow("Markdown report", markdownPath);
        table.AddRow("HTML report", htmlPath);

        AnsiConsole.Write(table);
        return report;
    }
}
