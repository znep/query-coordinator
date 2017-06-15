import _ from 'lodash';

const getInitialState = () => _.get(window, 'initialState.assetCounts', {
  values: {
    charts: 0,
    datasets: 0,
    maps: 0,
    stories: 0
  },
  fetchingAssetCounts: false,
  fetchingAssetCountsError: false
});

export default (state, action) => {
  if (_.isUndefined(state)) {
    return getInitialState();
  }

  if (action.type === 'UPDATE_ASSET_COUNTS') {
    const getCountForAssetType = assetType => {
      const asset = _.filter(action.assetCounts, (assetCount => assetCount.value === assetType))[0];
      return (asset && _.has(asset, 'count')) ? asset.count : 0;
    };

    return {
      ...state,
      values: {
        charts: getCountForAssetType('chart'),
        datasets: getCountForAssetType('dataset'),
        maps: getCountForAssetType('map'),
        stories: getCountForAssetType('story')
      }
    };
  }

  if (action.type === 'FETCH_ASSET_COUNTS') {
    return {
      ...state,
      fetchingAssetCounts: true,
      fetchingAssetCountsError: false
    };
  }

  if (action.type === 'FETCH_ASSET_COUNTS_SUCCESS') {
    return {
      ...state,
      fetchingAssetCounts: false,
      fetchingAssetCountsError: false
    };
  }

  if (action.type === 'FETCH_ASSET_COUNTS_ERROR') {
    return {
      ...state,
      fetchingAssetCounts: false,
      fetchingAssetCountsError: true
    };
  }

  return state;
};
