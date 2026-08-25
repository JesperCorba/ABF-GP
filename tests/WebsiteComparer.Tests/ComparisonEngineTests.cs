using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using WebsiteComparer.Core.Interfaces;
using WebsiteComparer.Core.Models;
using WebsiteComparer.Core.Services;

namespace WebsiteComparer.Tests;

public sealed class ComparisonEngineTests
{
    [Fact]
    public async Task RunAsync_ShouldCrawlAnalyzeAndComparePages()
    {
        var crawler = Substitute.For<ICrawler>();
        var analyzer = Substitute.For<IPageAnalyzer>();
        var visualComparer = Substitute.For<IVisualComparer>();
        var config = new ComparisonConfig
        {
            BaseUrl = "https://base.example.com",
            CompareUrl = "https://compare.example.com",
            MaxDepth = 1,
            MaxPages = 10,
            ScreenshotsEnabled = true,
            OutputDirectory = "/home/runner/work/ABF-GP/ABF-GP/docs/reports"
        };

        var baseRoot = CreateResult("https://base.example.com", 200, ["https://base.example.com/about"]);
        var compareRoot = CreateResult("https://compare.example.com", 200, []);
        var baseAbout = CreateResult("https://base.example.com/about", 200, []);
        var compareAbout = CreateResult("https://compare.example.com/about", 200, []);

        crawler.CrawlAsync("https://base.example.com/", Arg.Any<CancellationToken>()).Returns(baseRoot);
        crawler.CrawlAsync("https://compare.example.com/", Arg.Any<CancellationToken>()).Returns(compareRoot);
        crawler.CrawlAsync("https://base.example.com/about", Arg.Any<CancellationToken>()).Returns(baseAbout);
        crawler.CrawlAsync("https://compare.example.com/about", Arg.Any<CancellationToken>()).Returns(compareAbout);

        analyzer.Compare(baseRoot, compareRoot).Returns(new PageComparisonResult { Url = "/", Issues = [] });
        analyzer.Compare(baseAbout, compareAbout).Returns(new PageComparisonResult { Url = "/about", Issues = [] });
        visualComparer.CompareAsync("/", "https://base.example.com", "https://compare.example.com", Arg.Any<CancellationToken>())
            .Returns(new VisualComparisonResult { DiffPercentage = 1.25, HasDifferences = true, DiffImagePath = "/diff-root.png" });
        visualComparer.CompareAsync("/about", "https://base.example.com", "https://compare.example.com", Arg.Any<CancellationToken>())
            .Returns(new VisualComparisonResult { DiffPercentage = 0, HasDifferences = false });

        var engine = new ComparisonEngine(crawler, analyzer, visualComparer, NullLogger<ComparisonEngine>.Instance);

        var report = await engine.RunAsync(config, CancellationToken.None);

        report.Results.Should().HaveCount(2);
        report.Summary.PagesScanned.Should().Be(2);
        report.Summary.ChangedPages.Should().Be(1);
        report.Results.Should().Contain(result => result.Url == "/" && result.HasVisualDiff);
        await crawler.Received(1).CrawlAsync("https://base.example.com/", Arg.Any<CancellationToken>());
        await crawler.Received(1).CrawlAsync("https://compare.example.com/about", Arg.Any<CancellationToken>());
    }

    private static CrawlResult CreateResult(string url, int statusCode, IReadOnlyList<string> links) => new()
    {
        Url = url,
        StatusCode = statusCode,
        InternalLinks = links,
        H1s = [],
        ImageUrls = [],
        Title = "Title",
        MetaDescription = "Description",
        Canonical = url
    };
}
