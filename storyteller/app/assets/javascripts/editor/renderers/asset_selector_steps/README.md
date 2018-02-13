Sadly, most renderers are built with a giant glob of jQuery in AssetSelectorRenderer.js.
However, some renderer steps are rendered with dedicated React components. These components
can be found in here.

To add a React-powered step:

  1. Add the WIZARD_STEP and associated JSX to the list of React-powered steps at the top of
     _renderSelector().
  2. Rejoice.
