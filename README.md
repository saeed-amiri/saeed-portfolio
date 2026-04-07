# Saeed Portfolio CV (Bilingual + PDF)

Professional, open-source portfolio CV optimized for GitHub Pages.

## Open Portfolio

Live URL: [https://saeed-amiri.github.io/saeed-portfolio/](https://saeed-amiri.github.io/saeed-portfolio/)

GitHub cannot automatically open the website when someone opens the repository page itself, but this top link is the standard way to make it one-click.

## What is included

- Interactive one-page CV in [index.html](index.html)
- Bilingual content (English and German)
- Certification gallery with image links
- Thesis and MLOps project links
- Browser PDF export via print mode
- GitHub Pages deployment workflow in [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml)

## Project structure

- [index.html](index.html): Main CV page (root entry for GitHub Pages)
- [pages/projects.html](pages/projects.html): Secondary page for project-focused content
- [styles/main.css](styles/main.css): Shared visual design and print styles
- [scripts/main.js](scripts/main.js): Language switch and dynamic CV rendering
- [content/en/manifest.json](content/en/manifest.json): English modular content map
- [content/de/manifest.json](content/de/manifest.json): German modular content map
- [assets/](assets): Profile and certification images

## Customize your CV

1. Replace profile and certificate images in [assets/](assets).
2. Update data in [content/en/](content/en) and [content/de/](content/de):
	- Name, headline, contact links
	- Bio
	- Experience and education
	- Thesis URL
	- MLOps project URL
3. Keep both language folders aligned with the same structure.

## Modular content architecture

Each language now uses a section-first folder layout for maintainability:

- [content/en/manifest.json](content/en/manifest.json) (and German equivalent): central config of where section data lives
- [content/en/meta.json](content/en/meta.json): global fields (page title, profile, labels, footer)
- `sections/<section>/front.json`: the content shown in the main CV view
- `sections/<section>/detail.json`: the section-level "More" modal content
- `sections/<section>/items/<id>/front.json`: one subsection/item shown in list views (experience, trainings, education)
- `sections/<section>/items/<id>/detail.json`: the matching subsection/item "More" modal

Examples:

- [content/en/sections/bio/front.json](content/en/sections/bio/front.json)
- [content/en/sections/experience/items/exp-mlops-engineer/front.json](content/en/sections/experience/items/exp-mlops-engineer/front.json)
- [content/en/sections/experience/items/exp-mlops-engineer/detail.json](content/en/sections/experience/items/exp-mlops-engineer/detail.json)

## Modal content blocks (reusable)

Detail popups (`detail.json`) support ordered blocks in `content`:

- `summary`
- `body` / `text` / `html`
- `bullets` / `list`
- `images`
- `links`
- `tabs` (new)

Use `tabs` when you want multiple views inside one popup, and keep each tab's content in the same block format.

```json
{
	"title": "Example Detail",
	"content": [
		{ "type": "summary", "text": "Optional summary" },
		{
			"type": "tabs",
			"tabs": [
				{
					"id": "theory",
					"label": "Theoretical",
					"content": [
						{ "type": "body", "html": "<h2>Concepts</h2><p>...</p>" },
						{ "type": "bullets", "items": ["Point A", "Point B"] }
					]
				},
				{
					"id": "data",
					"label": "Data",
					"content": [
						{ "type": "bullets", "items": ["Pipeline", "Validation"] },
						{ "type": "images", "items": [{ "src": "assets/example.png", "alt": "Diagram" }] },
						{ "type": "links", "items": [{ "label": "Repo", "url": "https://github.com/..." }] }
					]
				}
			]
		}
	]
}
```

## Local preview

Use any static server from repository root.

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## PDF export

- Use the page button `Download PDF`.
- It triggers browser print mode with print-specific styling.
- Save as PDF in your browser dialog.

## Deploy to GitHub Pages

1. Push this repository to GitHub.
2. In repository settings, open `Pages`.
3. Set source to `GitHub Actions`.
4. Push to `main` to deploy.
5. Add the same URL in repository `About -> Website` so visitors see it on the right panel.

## Security and privacy checklist for an open CV repo

- Do not publish exact home address, phone number, full birth date, or private identifiers.
- Use a dedicated professional email account.
- Remove metadata from uploaded images/PDFs (EXIF, location, authoring metadata).
- Verify every external link points to a trusted target.
- Keep `target="_blank"` links protected with `rel="noopener noreferrer"`.
- Add a clear license for source code and define usage rights for personal assets.
- Pin only your strongest repositories on your profile.

## Professional profile strategy

- Pin this portfolio repo.
- Pin your best MLOps project.
- Keep profile README short and outcome-focused.
- Prefer measurable achievements over tool-name lists.
