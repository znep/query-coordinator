#AssetBrowser

A high-level component that serves as a user interface for searching for assets in the platform. Backed by Cetera, it allows users to:

* Browse assets page, by page
* Dearch for assets using autocomplete suggestions
* Filter assets according to several criteria
* Perform some actions on individual assets such as delete, edit metadata, make public/private.
* Sort by type, name, last updated, category, or owner
* Show only recently viewed assets

### Properties & Types

Prop | Type | Default | Description
--- | :---: | :---: | ---
`columns` | `array` | [] | Array of column names you want to use (only applies to `list` renderStyle).
`initialTab` | `string` | `null` | Tab that should show on page load (only applies to `list` renderStyle).
`onAssetSelected` | `func` | `null` | Callback function invoked when a user has selected an individual asset. (only applies to `card` renderStyle).
`pageSize` | `number` | `10` | Number of records shown per page.
`renderStyle` | `string` | `list` | Results can be rendered in a `list` layout or a `card` layout.
`selectMode` | `bool` | `false` | Select mode is currently only supported in the "card" renderStyle (and if true, it will override the specified renderStyle). It adds a selection overlay to the cards. When a user selects a card, the `onAssetSelected` prop is called. This is generally a callback function to close the AssetBrowser modal and do something with the selected result.
`showAuthorityFilter` | `bool` | `true` | Show the authority filter (official / community) in the filter panel.
`showFilters` | `bool` | `true` | Show the filter panel (currently only applies to `list` renderStyle).
`showHeader` | `bool` | `true` | Show the header containing tabs and asset counts.
`showManageAssets` | `bool` | `false` | Show the link to SIAM _(myAssets tab is preselected)_.
`showOwnedByFilter` | `bool` | `true` | Show the owned by filter in the filter panel.
`showSearchField` | `bool` | `true` | Show the autocomplete search field.
`tabs` | `obj` |  | Mapping of tab translation key to an object with the following keys: `component` - the React component containing the tab's content. `props` - Mapping of properties for the entire tab. For example, tab-wide baseFilters for catalog results.
