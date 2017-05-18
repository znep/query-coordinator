# Common Styles (aka: Styleguide implementation).

Baseline styles for Socrata pages. Don't leave /home without it.

See also: 
[Styleguide Sample App](https://github.com/socrata/platform-ui/blob/master/styleguide-sample-app/)

## Contents

1. A set of designer-approved colors, typographical layouts, and other constants.
2. A canonical means of pulling all styles from `common/components`.
3. An optional standard reset.
4. Miscellaneous legacy or loose styles.

### Partials - `src/scss/partials`
These partials are directly related to markup only. For React component styling, see
the [components README](https://github.com/socrata/platform-ui/blob/master/common/components/)
The type of component informs the name of your new partial.
For example, if you're adding a Hero container, you'd add a partial called `_hero.scss`.

### Variables - `src/scss/variables`
These are normal SASS variables shared across all partials and in React component styles.

## Usage

*Side note*: Detailed instructions will be added here soon - we need to stabilize the styleguide's
inclusion into platform-ui before we can fully canonicalize this.

If you are authoring a Socrata-only page that can accept aggressive resets, you should
pull `common/styleguide/styleguide.scss` into your project. This is baseline usage.

If you want to use Styleguide in a way that discourages aggressive resets (say, old UX
pages or off-platform embed usage), you will want to pull in
`common/styleguide/styleguide-no-tag-level.scss` instead.
