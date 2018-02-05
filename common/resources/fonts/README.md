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

### Step 3: Minify SVGs

Since we're inlining SVGs in most places, we want to clean up any of the junk that Sketch leaves behind.

1. After adding new icons to the `svg` folder, run `npm run minify`
2. This will minify all the SVG files in-place
3. Note that it will also print out a list of files using `xlink`; this can be a bug if two SVGs define the same `id` for a path/shape and the use it in a `<use>` block (see EN-22022)

To clean up `xlink`:
SVG may look something like this:

```xml
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns:xlink="http://www.w3.org/1999/xlink">
    <defs>
        <path d="long string" id="a"/>
    </defs>
    <use xlink:href="#a" fill-rule="evenodd"/>
</svg>
```

this can easily be turned into...

```xml
<svg width="1024" height="1024" viewBox="0 0 1024 1024">
    <path d="long string" fill-rule="evenodd"/>
</svg>
```

Note:
- Properties inside the `<use>` need to be moved into the `<path>`/`<shape>`/`<whatever>`
- Remove any `id` properties
- Remove `xmlns:xlink="http://www.w3.org/1999/xlink"` from the SVG declaration

If the SVG is more complicated, it's suggested to rename all of the `id` properties to something specific to that icon (like the file name)
