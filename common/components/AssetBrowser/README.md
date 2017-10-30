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
`baseFilters` | `object` | `{}` | Set of filters applied to all Cetera interactions. `baseFilters` are merged with and take precedence over user specified filters. For example on the My Assets tab and on the user profile page, a `baseFilters` entry on `ownedBy` is set to `currentUser`.
`onAssetSelected` | `func` | `null` | Callback function invoked when a user has selected an individual asset.
`pageSize` | `number` | `10` | Number of records shown per page.
`showAuthorityFilter` | `bool` | `true` | Show the authority filter (official / community) in the filter panel.
`showFilters` | `bool` | `true` | Show the filter panel.
`showHeader` | `bool` | `true` | Show the header containing tabs and asset counts.
`showManageAssets` | `bool` | `false` | Show the link to SIAM _(myAssets tab is preselected)_.
`showOwnedByFilter` | `bool` | `true` | Show the owned by filter in the filter panel.
`showSearchField` | `bool` | `true` | Show the autocomplete search field.
`tabs` | `obj` |  | Mapping of tab translation key to a React component containing the tab's content.
