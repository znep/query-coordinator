import _ from 'lodash';

import { AUTHORITY_OFFICIAL, AUTHORITY_COMMUNITY } from 'common/components/AssetBrowser/lib/constants';
import * as ceteraActions from 'common/components/AssetBrowser/actions/cetera';

const getInitialState = () => ({
  values: {
    [AUTHORITY_OFFICIAL]: 0,
    [AUTHORITY_COMMUNITY]: 0
  },
  fetchingProvenanceCounts: false,
  fetchingProvenanceCountsError: false
});

export default (state = getInitialState(), action) => {
  if (action.type === ceteraActions.UPDATE_PROVENANCE_COUNTS) {
    const getCountForProvenanceType = (provenanceType) => {
      const provenance = _.filter(action.provenanceCounts, (provenanceCount => provenanceCount.value === provenanceType))[0];
      return (provenance && _.has(provenance, 'count')) ? provenance.count : 0;
    };

    return {
      ...state,
      values: {
        [AUTHORITY_OFFICIAL]: getCountForProvenanceType(AUTHORITY_OFFICIAL),
        [AUTHORITY_COMMUNITY]: getCountForProvenanceType(AUTHORITY_COMMUNITY)
      }
    };
  }

  if (action.type === ceteraActions.FETCH_PROVENANCE_COUNTS) {
    return {
      ...state,
      fetchingProvenanceCounts: true,
      fetchingProvenanceCountsError: false
    };
  }

  if (action.type === ceteraActions.FETCH_PROVENANCE_COUNTS_SUCCESS) {
    return {
      ...state,
      fetchingProvenanceCounts: false,
      fetchingProvenanceCountsError: false
    };
  }

  if (action.type === ceteraActions.FETCH_PROVENANCE_COUNTS_ERROR) {
    return {
      ...state,
      fetchingProvenanceCounts: false,
      fetchingProvenanceCountsError: true
    };
  }

  return state;
};
