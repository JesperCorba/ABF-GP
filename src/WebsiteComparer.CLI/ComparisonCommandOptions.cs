using WebsiteComparer.Core.Models;

namespace WebsiteComparer.CLI;

/// <summary>
/// Represents parsed CLI options for a comparison run.
/// </summary>
public sealed class ComparisonCommandOptions
{
    /// <summary>
    /// Gets or sets the baseline site URL.
    /// </summary>
    public string BaseUrl { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the comparison site URL.
    /// </summary>
    public string CompareUrl { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the maximum crawl depth.
    /// </summary>
    public int MaxDepth { get; set; } = 3;

    /// <summary>
    /// Gets or sets the maximum number of pages to scan.
    /// </summary>
    public int MaxPages { get; set; } = 100;

    /// <summary>
    /// Gets or sets a value indicating whether screenshots are enabled.
    /// </summary>
    public bool ScreenshotsEnabled { get; set; } = true;

    /// <summary>
    /// Gets or sets the output directory.
    /// </summary>
    public string OutputDirectory { get; set; } = string.Empty;

    /// <summary>
    /// Parses command-line arguments by applying configuration defaults first.
    /// </summary>
    /// <param name="args">The raw command-line arguments.</param>
    /// <param name="defaults">The default configuration values.</param>
    /// <param name="error">The parse error, when parsing fails.</param>
    /// <returns>The parsed options, or <see langword="null"/> on failure.</returns>
    public static ComparisonCommandOptions? Parse(string[] args, ComparisonConfig defaults, out string? error)
    {
        ArgumentNullException.ThrowIfNull(args);
        ArgumentNullException.ThrowIfNull(defaults);

        error = null;
        if (args.Length == 0 || !string.Equals(args[0], "compare", StringComparison.OrdinalIgnoreCase))
        {
            error = "The first command must be 'compare'.";
            return null;
        }

        var options = new ComparisonCommandOptions
        {
            MaxDepth = defaults.MaxDepth,
            MaxPages = defaults.MaxPages,
            ScreenshotsEnabled = defaults.ScreenshotsEnabled,
            OutputDirectory = defaults.OutputDirectory
        };

        for (var index = 1; index < args.Length; index++)
        {
            var current = args[index];
            switch (current)
            {
                case "--base":
                    options.BaseUrl = ReadValue(args, ref index, current);
                    break;
                case "--compare":
                    options.CompareUrl = ReadValue(args, ref index, current);
                    break;
                case "--depth":
                    if (!int.TryParse(ReadValue(args, ref index, current), out var depth))
                    {
                        error = "--depth must be an integer.";
                        return null;
                    }

                    options.MaxDepth = depth;
                    break;
                case "--max-pages":
                    if (!int.TryParse(ReadValue(args, ref index, current), out var maxPages))
                    {
                        error = "--max-pages must be an integer.";
                        return null;
                    }

                    options.MaxPages = maxPages;
                    break;
                case "--output":
                    options.OutputDirectory = ReadValue(args, ref index, current);
                    break;
                case "--no-screenshots":
                    options.ScreenshotsEnabled = false;
                    break;
                case "--help":
                case "-h":
                    error = string.Empty;
                    return null;
                default:
                    error = $"Unknown argument: {current}";
                    return null;
            }
        }

        if (string.IsNullOrWhiteSpace(options.BaseUrl) || string.IsNullOrWhiteSpace(options.CompareUrl))
        {
            error = "Both --base and --compare are required.";
            return null;
        }

        options.OutputDirectory = Path.GetFullPath(string.IsNullOrWhiteSpace(options.OutputDirectory) ? "./reports" : options.OutputDirectory);
        return options;
    }

    /// <summary>
    /// Converts the CLI options to a comparison configuration.
    /// </summary>
    /// <returns>The comparison configuration.</returns>
    public ComparisonConfig ToConfig() => new()
    {
        BaseUrl = BaseUrl,
        CompareUrl = CompareUrl,
        MaxDepth = MaxDepth,
        MaxPages = MaxPages,
        ScreenshotsEnabled = ScreenshotsEnabled,
        OutputDirectory = OutputDirectory
    };

    private static string ReadValue(string[] args, ref int index, string option)
    {
        if (index + 1 >= args.Length)
        {
            throw new ArgumentException($"Missing value for {option}.", nameof(args));
        }

        index++;
        return args[index];
    }
}
