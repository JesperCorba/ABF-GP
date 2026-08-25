using FluentAssertions;
using WebsiteComparer.Core.Models;
using WebsiteComparer.Core.Services;

namespace WebsiteComparer.Tests;

public sealed class PageAnalyzerTests
{
    [Fact]
    public void Compare_ShouldNotCreateIssues_WhenPagesMatchSemantically()
    {
        var analyzer = new PageAnalyzer();
        var baseline = CreateResult("https://base.example.com/about", 200, "About", "Description", "https://base.example.com/about", ["About us"], ["https://base.example.com/contact"], ["https://base.example.com/assets/logo.png"]);
        var comparison = CreateResult("https://compare.example.com/about", 200, "About", "Description", "https://compare.example.com/about", ["About us"], ["https://compare.example.com/contact"], ["https://compare.example.com/assets/logo.png"]);

        var result = analyzer.Compare(baseline, comparison);

        result.TitleMatch.Should().BeTrue();
        result.MetaDescriptionMatch.Should().BeTrue();
        result.CanonicalMatch.Should().BeTrue();
        result.Issues.Should().BeEmpty();
    }

    [Fact]
    public void Compare_ShouldCreateExpectedIssues_WhenPagesDiffer()
    {
        var analyzer = new PageAnalyzer();
        var baseline = CreateResult("https://base.example.com/about", 200, "About", "Old description", "https://base.example.com/about", ["About us"], ["https://base.example.com/contact"], ["https://base.example.com/assets/logo.png"]);
        var comparison = CreateResult("https://compare.example.com/about", 404, "About us", "New description", "https://compare.example.com/about-us", ["About the team"], ["https://compare.example.com/support"], ["https://compare.example.com/assets/hero.png"]);

        var result = analyzer.Compare(baseline, comparison);

        result.TitleMatch.Should().BeFalse();
        result.MetaDescriptionMatch.Should().BeFalse();
        result.CanonicalMatch.Should().BeFalse();
        result.Issues.Should().Contain(issue => issue.Category == ComparisonIssueCategory.Functional && issue.Message.Contains("404"));
        result.Issues.Should().Contain(issue => issue.Category == ComparisonIssueCategory.Seo && issue.Message.Contains("Page title"));
        result.Issues.Should().Contain(issue => issue.Category == ComparisonIssueCategory.Content && issue.Message.Contains("H1 headings"));
    }

    private static CrawlResult CreateResult(string url, int statusCode, string title, string description, string canonical, IReadOnlyList<string> h1s, IReadOnlyList<string> links, IReadOnlyList<string> images) => new()
    {
        Url = url,
        StatusCode = statusCode,
        Title = title,
        MetaDescription = description,
        Canonical = canonical,
        H1s = h1s,
        InternalLinks = links,
        ImageUrls = images,
        HtmlContent = "<html></html>"
    };
}
