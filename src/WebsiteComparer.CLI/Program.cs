using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Spectre.Console;
using WebsiteComparer.Core.Interfaces;
using WebsiteComparer.Core.Models;
using WebsiteComparer.Core.Services;
using WebsiteComparer.Playwright;
using WebsiteComparer.Reporting;

namespace WebsiteComparer.CLI;

/// <summary>
/// Application entry point for WebsiteComparer.
/// </summary>
public static class Program
{
    /// <summary>
    /// Runs the WebsiteComparer command-line application.
    /// </summary>
    /// <param name="args">The command-line arguments.</param>
    /// <returns>The process exit code.</returns>
    public static async Task<int> Main(string[] args)
    {
        var builder = Host.CreateApplicationBuilder(args);
        builder.Configuration
            .SetBasePath(AppContext.BaseDirectory)
            .AddJsonFile("appsettings.json", optional: false, reloadOnChange: false)
            .AddEnvironmentVariables(prefix: "WEBSITECOMPARER_");

        builder.Logging.ClearProviders();
        builder.Logging.AddSimpleConsole(options =>
        {
            options.SingleLine = true;
            options.TimestampFormat = "HH:mm:ss ";
        });

        builder.Services.AddSingleton(new HttpClient());
        builder.Services.AddSingleton<ICrawler, HttpCrawler>();
        builder.Services.AddSingleton<IPageAnalyzer, PageAnalyzer>();
        builder.Services.AddSingleton<IVisualComparer, PlaywrightVisualComparer>();
        builder.Services.AddSingleton<IComparisonEngine, ComparisonEngine>();
        builder.Services.AddSingleton<MarkdownReportGenerator>();
        builder.Services.AddSingleton<HtmlReportGenerator>();
        builder.Services.AddSingleton<ComparisonRunner>();

        using var host = builder.Build();
        var defaults = LoadDefaults(host.Services.GetRequiredService<IConfiguration>());
        var exitCode = 0;

        try
        {
            var parsed = ComparisonCommandOptions.Parse(args, defaults, out var parseError);
            if (parsed is null)
            {
                WriteHelp(parseError);
                return string.IsNullOrEmpty(parseError) ? 0 : 1;
            }

            await host.Services.GetRequiredService<ComparisonRunner>()
                .RunAsync(parsed.ToConfig(), CancellationToken.None)
                .ConfigureAwait(false);
        }
        catch (ArgumentException ex)
        {
            AnsiConsole.MarkupLine($"[red]Input error:[/] {Markup.Escape(ex.Message)}");
            WriteHelp(ex.Message);
            exitCode = 1;
        }
        catch (Exception ex)
        {
            host.Services.GetRequiredService<ILoggerFactory>()
                .CreateLogger("Program")
                .LogError(ex, "Unhandled exception while comparing websites.");
            AnsiConsole.MarkupLine("[red]Comparison failed. See logs for details.[/]");
            exitCode = 1;
        }

        return exitCode;
    }

    private static ComparisonConfig LoadDefaults(IConfiguration configuration)
    {
        var section = configuration.GetSection("Comparison");
        return new ComparisonConfig
        {
            BaseUrl = string.Empty,
            CompareUrl = string.Empty,
            MaxDepth = ParseInt(section["MaxDepth"], 3),
            MaxPages = ParseInt(section["MaxPages"], 100),
            ScreenshotsEnabled = ParseBool(section["ScreenshotsEnabled"], true),
            OutputDirectory = Path.GetFullPath(section["OutputDirectory"] ?? "./reports")
        };
    }

    private static int ParseInt(string? value, int fallback) => int.TryParse(value, out var parsed) ? parsed : fallback;

    private static bool ParseBool(string? value, bool fallback) => bool.TryParse(value, out var parsed) ? parsed : fallback;

    private static void WriteHelp(string? message)
    {
        if (!string.IsNullOrWhiteSpace(message))
        {
            AnsiConsole.MarkupLine($"[yellow]{Markup.Escape(message)}[/]");
        }

        AnsiConsole.Write(new Rule("WebsiteComparer CLI"));
        AnsiConsole.MarkupLine("Usage: [green]compare[/] [blue]--base[/] <url> [blue]--compare[/] <url> [[blue]--depth[/] N] [[blue]--max-pages[/] N] [[blue]--output[/] dir] [[blue]--no-screenshots[/]]");
        AnsiConsole.MarkupLine("Example: [green]compare --base https://old.example.com --compare https://new.example.com --depth 2 --output ./reports[/]");
    }
}
