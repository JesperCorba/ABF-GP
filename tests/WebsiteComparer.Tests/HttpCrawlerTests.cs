using System.Net;
using System.Net.Http;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using WebsiteComparer.Core.Services;
using WebsiteComparer.Tests.TestUtilities;

namespace WebsiteComparer.Tests;

public sealed class HttpCrawlerTests
{
    [Fact]
    public async Task CrawlAsync_ShouldParseExpectedFields()
    {
        const string html = """
            <html>
              <head>
                <title>Example title</title>
                <meta name="description" content="Example description" />
                <link rel="canonical" href="/products" />
              </head>
              <body>
                <h1>Products</h1>
                <h1>Featured</h1>
                <a href="/contact">Contact</a>
                <a href="https://example.com/products/details">Details</a>
                <a href="https://external.example.org/ignored">External</a>
                <img src="/images/product.png" />
              </body>
            </html>
            """;

        var handler = new FakeHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(html)
        });
        using var httpClient = new HttpClient(handler);
        var crawler = new HttpCrawler(httpClient, NullLogger<HttpCrawler>.Instance);

        var result = await crawler.CrawlAsync("https://example.com/products", CancellationToken.None);

        result.StatusCode.Should().Be(200);
        result.Title.Should().Be("Example title");
        result.MetaDescription.Should().Be("Example description");
        result.Canonical.Should().Be("https://example.com/products");
        result.H1s.Should().BeEquivalentTo(["Products", "Featured"]);
        result.InternalLinks.Should().BeEquivalentTo(["https://example.com/contact", "https://example.com/products/details"]);
        result.ImageUrls.Should().BeEquivalentTo(["https://example.com/images/product.png"]);
        result.HtmlContent.Should().Contain("Featured");
    }
}
