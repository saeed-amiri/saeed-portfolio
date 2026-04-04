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

- [index.html](index.html): Page layout and sections
- [styles.css](styles.css): Visual design and print styles for PDF
- [script.js](script.js): Language switch and dynamic rendering
- [content/en.json](content/en.json): English CV content
- [content/de.json](content/de.json): German CV content
- [assets/](assets): Profile and certification images

## Customize your CV

1. Replace profile and certificate images in [assets/](assets).
2. Update data in [content/en.json](content/en.json) and [content/de.json](content/de.json):
	- Name, headline, contact links
	- Bio
	- Experience and education
	- Thesis URL
	- MLOps project URL
3. Keep both language files aligned with the same structure.

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
