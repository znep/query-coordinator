export const updateCatalogResults = (response, onlyRecentlyViewed = false, sortByRecentlyViewed = false) =>
  ({ type: 'UPDATE_CATALOG_RESULTS', response, onlyRecentlyViewed, sortByRecentlyViewed });

export const fetchingResults = () => (
  { type: 'FETCH_RESULTS' }
);

export const fetchingResultsSuccess = () => (
  { type: 'FETCH_RESULTS_SUCCESS' }
);

export const fetchingResultsError = (errMsg = null) => (
  { type: 'FETCH_RESULTS_ERROR', details: errMsg }
);

export const updateAssetCounts = (assetCounts) => (
  { type: 'UPDATE_ASSET_COUNTS', assetCounts }
);

export const fetchingAssetCounts = () => (
  { type: 'FETCH_ASSET_COUNTS' }
);

export const fetchingAssetCountsSuccess = () => (
  { type: 'FETCH_ASSET_COUNTS_SUCCESS' }
);

export const fetchingAssetCountsError = () => (
  { type: 'FETCH_ASSET_COUNTS_ERROR' }
);
