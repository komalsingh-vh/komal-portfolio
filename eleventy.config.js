import { HtmlBasePlugin } from "@11ty/eleventy";

export default function (eleventyConfig) {
  // Rewrites links like /css/style.css to /your-repo-name/css/style.css
  // when the site is published on GitHub Pages.
  eleventyConfig.addPlugin(HtmlBasePlugin);

  // Copy CSS, JavaScript and images to the built site as they are
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");

  // Current year for the footer
  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);
}

export const config = {
  dir: {
    input: "src",
    includes: "_includes",
    data: "_data",
    output: "_site",
  },
  markdownTemplateEngine: "njk",
  htmlTemplateEngine: "njk",
  // Set automatically by the GitHub deploy workflow. Leave as "/" locally.
  pathPrefix: process.env.PATH_PREFIX || "/",
};
