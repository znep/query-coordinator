# Socrata Fonts (really just socrata-icons).

The `socrata-icons` font is generated here. Since this font is rarely changed, the
build artifacts are checked in and referenced directly. If you need to update the
font, see below.

## Using socrata-icons

If you're using `styleguide.scss` already (if you're using components from `common/components`, you probably
are), you don't need to do any more setup. If you need to use socrata-icons outside of styleguide, pull in
both SCSS files at `common/resources/fonts/dist/`:

```scss
@import "common/resources/fonts/dist/socrata-icons-font-family";
@import "common/resources/fonts/dist/socrata-icons";
```

## Updating socrata-icons

The fonts are generated via Gulp. With your UX designer, make the requisite changes to
`socrata-icons.sketch`, then export the icons as SVG in `common/resources/fonts/svg` (replace
what's there). Then run:
```sh
cd common/resources/fonts && npm i && npm run build
```
Check in the changes to the files. You're done.
