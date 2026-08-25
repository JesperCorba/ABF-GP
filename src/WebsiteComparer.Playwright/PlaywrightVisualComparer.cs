using Microsoft.Extensions.Logging;
using Microsoft.Playwright;
using StbImageSharp;
using StbColorComponents = StbImageSharp.ColorComponents;
using StbImageWriteSharp;
using StbWriterColorComponents = StbImageWriteSharp.ColorComponents;
using WebsiteComparer.Core.Interfaces;
using WebsiteComparer.Core.Models;

namespace WebsiteComparer.Playwright;

/// <summary>
/// Compares two pages visually by capturing screenshots with Playwright.
/// </summary>
public sealed class PlaywrightVisualComparer : IVisualComparer, IOutputDirectoryAwareVisualComparer
{
    private readonly ILogger<PlaywrightVisualComparer> _logger;
    private string _outputDirectory = Path.GetFullPath(Path.Combine(Environment.CurrentDirectory, "reports"));

    /// <summary>
    /// Initializes a new instance of the <see cref="PlaywrightVisualComparer"/> class.
    /// </summary>
    /// <param name="logger">The logger.</param>
    public PlaywrightVisualComparer(ILogger<PlaywrightVisualComparer> logger)
    {
        _logger = logger;
    }

    /// <inheritdoc />
    public void SetOutputDirectory(string outputDirectory)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(outputDirectory);
        _outputDirectory = Path.GetFullPath(outputDirectory);
        Directory.CreateDirectory(_outputDirectory);
    }

    /// <inheritdoc />
    public async Task<VisualComparisonResult> CompareAsync(string url, string baseUrl, string compareUrl, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(url);
        ArgumentException.ThrowIfNullOrWhiteSpace(baseUrl);
        ArgumentException.ThrowIfNullOrWhiteSpace(compareUrl);

        Directory.CreateDirectory(_outputDirectory);
        var pageKey = Sanitize(url);
        var visualDirectory = Path.Combine(_outputDirectory, "visual");
        Directory.CreateDirectory(visualDirectory);

        var basePagePath = Path.Combine(visualDirectory, $"{pageKey}.base.png");
        var comparePagePath = Path.Combine(visualDirectory, $"{pageKey}.compare.png");
        var diffPagePath = Path.Combine(visualDirectory, $"{pageKey}.diff.png");

        var baselineUri = BuildPageUri(baseUrl, url);
        var comparisonUri = BuildPageUri(compareUrl, url);

        _logger.LogInformation("Running visual comparison for {Url}", url);

        using var playwright = await Microsoft.Playwright.Playwright.CreateAsync().ConfigureAwait(false);
        await using var browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
        {
            Headless = true
        }).ConfigureAwait(false);

        await using var basePage = await browser.NewPageAsync().ConfigureAwait(false);
        await basePage.GotoAsync(baselineUri, new PageGotoOptions
        {
            WaitUntil = WaitUntilState.NetworkIdle
        }).ConfigureAwait(false);
        await basePage.ScreenshotAsync(new PageScreenshotOptions
        {
            Path = basePagePath,
            FullPage = true
        }).ConfigureAwait(false);

        await using var comparePage = await browser.NewPageAsync().ConfigureAwait(false);
        await comparePage.GotoAsync(comparisonUri, new PageGotoOptions
        {
            WaitUntil = WaitUntilState.NetworkIdle
        }).ConfigureAwait(false);
        await comparePage.ScreenshotAsync(new PageScreenshotOptions
        {
            Path = comparePagePath,
            FullPage = true
        }).ConfigureAwait(false);

        using var baseStream = File.OpenRead(basePagePath);
        using var compareStream = File.OpenRead(comparePagePath);
        var baseImage = ImageResult.FromStream(baseStream, StbColorComponents.RedGreenBlueAlpha);
        var compareImage = ImageResult.FromStream(compareStream, StbColorComponents.RedGreenBlueAlpha);
        var width = Math.Max(baseImage.Width, compareImage.Width);
        var height = Math.Max(baseImage.Height, compareImage.Height);
        var diffData = new byte[width * height * 4];

        long differentPixels = 0;
        var totalPixels = (long)width * height;

        for (var y = 0; y < height; y++)
        {
            cancellationToken.ThrowIfCancellationRequested();
            for (var x = 0; x < width; x++)
            {
                var targetIndex = ((y * width) + x) * 4;
                var baseIndex = ((y * baseImage.Width) + x) * 4;
                var compareIndex = ((y * compareImage.Width) + x) * 4;
                var inBaseBounds = x < baseImage.Width && y < baseImage.Height;
                var inCompareBounds = x < compareImage.Width && y < compareImage.Height;

                var baseR = inBaseBounds ? baseImage.Data[baseIndex] : (byte)0;
                var baseG = inBaseBounds ? baseImage.Data[baseIndex + 1] : (byte)0;
                var baseB = inBaseBounds ? baseImage.Data[baseIndex + 2] : (byte)0;
                var baseA = inBaseBounds ? baseImage.Data[baseIndex + 3] : (byte)0;
                var compareR = inCompareBounds ? compareImage.Data[compareIndex] : (byte)0;
                var compareG = inCompareBounds ? compareImage.Data[compareIndex + 1] : (byte)0;
                var compareB = inCompareBounds ? compareImage.Data[compareIndex + 2] : (byte)0;
                var compareA = inCompareBounds ? compareImage.Data[compareIndex + 3] : (byte)0;

                var pixelsDiffer = baseR != compareR || baseG != compareG || baseB != compareB || baseA != compareA;
                if (pixelsDiffer)
                {
                    differentPixels++;
                    diffData[targetIndex] = 255;
                    diffData[targetIndex + 1] = 0;
                    diffData[targetIndex + 2] = 0;
                    diffData[targetIndex + 3] = 255;
                    continue;
                }

                diffData[targetIndex] = baseR;
                diffData[targetIndex + 1] = baseG;
                diffData[targetIndex + 2] = baseB;
                diffData[targetIndex + 3] = baseA == 0 ? (byte)255 : baseA;
            }
        }

        using (var diffStream = File.Create(diffPagePath))
        {
            new ImageWriter().WritePng(diffData, width, height, StbWriterColorComponents.RedGreenBlueAlpha, diffStream);
        }

        var diffPercentage = totalPixels == 0 ? 0 : differentPixels * 100d / totalPixels;
        return new VisualComparisonResult
        {
            BaseScreenshotPath = basePagePath,
            CompareScreenshotPath = comparePagePath,
            DiffImagePath = diffPagePath,
            DiffPercentage = diffPercentage,
            HasDifferences = differentPixels > 0
        };
    }

    private static string BuildPageUri(string siteRoot, string relativePath)
    {
        var rootUri = new Uri(siteRoot.EndsWith("/", StringComparison.Ordinal) ? siteRoot : siteRoot + "/", UriKind.Absolute);
        return new Uri(rootUri, relativePath.TrimStart('/')).AbsoluteUri;
    }

    private static string Sanitize(string relativePath)
    {
        var candidate = relativePath == "/" ? "root" : relativePath.Trim('/');
        foreach (var invalidChar in Path.GetInvalidFileNameChars())
        {
            candidate = candidate.Replace(invalidChar, '-');
        }

        candidate = candidate.Replace('/', '-').Replace('?', '_').Replace('&', '_').Replace('=', '-');
        return string.IsNullOrWhiteSpace(candidate) ? "root" : candidate;
    }
}
