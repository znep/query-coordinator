import _ from 'lodash';
import { redirectToQueryString, urlParams } from 'common/http';

export default (state, action) => {
  // Takes existing search query string, modifes the `q` to equal the provided query,
  // then rebuilds the query string and redirects to it.
  const changeSearchQueryAndRedirect = (newQuery = null) => {
    const newUrlParams = urlParams();
    if (newQuery) {
      newUrlParams.q = newQuery;
    } else {
      delete newUrlParams.q;
    }

    const newUrlParamString = _(newUrlParams).
      toPairs().
      filter((value) => value[0] !== 'page').
      map((param) => param.join('=')).
      value().
      join('&');

    redirectToQueryString(`?${newUrlParamString}`);
  };

  if (_.isUndefined(state)) {
    // The default is needed because null or undefined results in "changing an uncontrolled input..." warning
    return {
      term: urlParams().q || ''
    };
  }

  if (action.type === 'CLEAR_SEARCH') {
    changeSearchQueryAndRedirect();
  }

  if (action.type === 'PERFORM_SEARCH') {
    changeSearchQueryAndRedirect(state.term);
  }

  if (action.type === 'UPDATE_SEARCH_TERM') {
    return {
      ...state,
      term: action.term
    };
  }

  return state;
};
