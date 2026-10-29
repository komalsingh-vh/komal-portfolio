# Komal Singh – content design portfolio

Built with [Eleventy](https://www.11ty.dev). Case studies are written in Markdown.

## Run it on your computer

You need [Node.js](https://nodejs.org) (version 18 or later). Open this folder in VS Code, then open the terminal (View > Terminal) and run:

```bash
npm install
npm start
```

Open http://localhost:8080 in your browser. The page refreshes each time you save a file. Press `Ctrl + C` in the terminal to stop it.

## How it's organised

The portfolio is a home page at `/` and six separate portals, one for each piece of work. Each portal is one long page with its own colours, fonts and navigation.

| Portal | Folder | Theme file | Web address |
| --- | --- | --- | --- |
| Council tax form | `src/council-form/` | `src/css/themes/council.css` | `/council-form/` |
| Repairs guidance | `src/guidance-page/` | `src/css/themes/repairs.css` | `/guidance-page/` |
| One moment, every touchpoint | `src/touchpoints/` | `src/css/themes/signal.css` | `/touchpoints/` |
| Checkout microcopy | `src/checkout/` | `src/css/themes/shop.css` | `/checkout/` |
| Navigation and labels | `src/navigation/` | `src/css/themes/wayfinding.css` | `/navigation/` |
| Content style guide | `src/style-guide/` | `src/css/themes/sunny.css` | `/style-guide/` |

## Where things are

| What you want to change | File |
| --- | --- |
| Your name, email and location | `src/_data/site.json` |
| Home page text (intro, how I work, toolkit, contact) | `src/index.njk` |
| Home page styles | `src/css/home.css` |
| The six project tiles on the home page | `src/_data/projects.json` |
| A portal's content | `src/<portal>/index.njk` |
| A portal's name, fonts and section links | `src/<portal>/<portal>.11tydata.json` |
| A portal's colours and special styles | `src/css/themes/<theme>.css` |
| Building blocks all portals share (cards, stats, tables) | `src/css/portal.css` |
| Portal header and footer | `src/_includes/portal.njk` |
| Council form prototype pages | `src/council-form/prototype/` |
| Prototype styles, script and form building blocks | `src/css/prototype.css`, `src/js/prototype.js`, `src/_includes/proto-macros.njk` |

Tables such as the question protocol and the content audit are lists at the top of each `index.njk` file, so you can edit a row without touching the HTML.

## Adding research results

The navigation portal's tree test is set up and ready to run. When you have results, add a `result` number (the percentage of people who succeeded) to each task at the top of `src/navigation/index.njk`, for example `result: 92`. A bar appears for each task automatically. Then change the “Ready to run” labels to “Complete”.

## Images

Put screenshots in `src/images/` and refer to them like this:

```html
<figure>
  <img src="/images/my-screenshot.png" alt="Describe what it shows and the content point it makes.">
  <figcaption>Short caption.</figcaption>
</figure>
```

Compress images before adding them (for example with [Squoosh](https://squoosh.app)). Aim for under 300 KB each.

## Publish to GitHub Pages

The repository is [komalsingh-vh/komal-portfolio](https://github.com/komalsingh-vh/komal-portfolio). The site will be at https://komalsingh-vh.github.io/komal-portfolio/.

1. In the VS Code terminal, run:

   ```bash
   git init
   git add .
   git commit -m "First version of portfolio"
   git branch -M main
   git remote add origin https://github.com/komalsingh-vh/komal-portfolio.git
   git push -u origin main
   ```

2. On GitHub, go to the repository's **Settings > Pages** and set **Source** to **GitHub Actions**.
3. Wait about a minute, then open the site.

After that, every time you push to `main`, the site updates automatically. You can check progress in the **Actions** tab.

## Before you share it

- [ ] Home page intro reads the way you want (`src/index.njk`)
- [ ] Add your LinkedIn link when you have it, to `src/_data/site.json` and the footers
- [ ] Every image has meaningful alt text
- [ ] Checked with axe DevTools or WAVE, with no errors
- [ ] Tabbed through every page with the keyboard only
- [ ] Listened to one case study with a screen reader (VoiceOver on Mac: `Cmd + F5`)
- [ ] Checked on a phone
- [ ] Any new colours pass contrast checks
