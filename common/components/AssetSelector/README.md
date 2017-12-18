#AssetSelector

A wrapper around the AssetBrowser component. Allows users to query the catalog for results and select a given result.

### Properties & Types

Prop | Type | Default | Description
--- | :---: | :---: | ---
`additionalTopbarComponents` | `array` | `[]` | Array of components to be rendered in the topbar alongside the "Back" button. This is pretty specific to CLP's use case and can most likely be ignored.
`baseFilters` | `obj` | `{}` | Mapping of cetera filters for the selectable catalog results. For the accepted object keys, see `translateFiltersToQueryParameters` in `AssetBrowser/lib/helpers/cetera.js`.
`onClose` | `func` | `null` | Callback that gets called when the "Back" button or escape key are hit. It generally just sets state on the parent component to not show the AssetSelector.
`onAssetSelected` | `func` | `null` | Callback that gets called when an asset is selected. It is passed a parameter with the selected asset's cetera result.
`resultsPerPage` | `number` | `6` | Number of results displayed per page.
`title` | `string` | `Select Featured Content` | Title of the modal.
