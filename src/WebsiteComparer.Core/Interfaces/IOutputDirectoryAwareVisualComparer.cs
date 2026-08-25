namespace WebsiteComparer.Core.Interfaces;

/// <summary>
/// Allows a visual comparer to receive an output directory for generated assets.
/// </summary>
public interface IOutputDirectoryAwareVisualComparer
{
    /// <summary>
    /// Sets the output directory used to persist generated screenshots and diff images.
    /// </summary>
    /// <param name="outputDirectory">The absolute output directory path.</param>
    void SetOutputDirectory(string outputDirectory);
}
