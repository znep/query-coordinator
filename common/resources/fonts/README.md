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

These steps are written under the assumption a dev is working with a designer or PM.

### Step 1: Desiger/PM updates source assets.

1. Send `socrata-icons.sketch` from this folder to your designer so they can make the required edits.
2. Have them export the changed or added icons (export button on top-right) in Sketch.
   **Designers**: Remember that the image must be flattened, ie. there should be no `translate` entries in the .svg file.
   To do this:
   1. Ungroup the paths (+ delete extraneous layers/groups)
   2. Layers > Combine > Flatten. Removes all the messy transformation and rotation code, but leaves the icon intact.
   3. Open the file in a text editor and make sure "translate" doesn't appear in the file.


### Step 2: Developer generates fonts.

The fonts are generated via Gulp.

1. Obtain `socrata-icons.sketch` and new/updated SVG files from your Designer/PM.
2. Check in the new verison of `socrata-icons.sketch`.
3. Place the new/updated SVGs in `common/resources/fonts/svg` (replace
what's there if needed).
4. Run:
```sh
cd common/resources/fonts && npm i && npm run build
```
5. Inspect the generated fonts (`common/resources/fonts/dist`) with a tool like
[fontforge](https://fontforge.github.io/). If using fontforge, use View->Next Defined Glyph
to help you find the icons.
6. Check in the changes to the files and merge via PR. You're done.
