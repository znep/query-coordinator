import _ from 'lodash';

export default function(state, action) {

  const clearSearchAndRedirect = () => document.location.search = '';

  if (_.isUndefined(state)) {
    var term = _.fromPairs(_.compact(_.map(location.search.slice(1).split('&'), (item) => {
      if (item) return item.split('=');
    }))).q;

    // The default is needed because null or undefined results in "changing an uncontrolled input..." warning
    return {
      term: term || ''
    };
  }

  if (action.type === 'CLEAR_SEARCH') {
    clearSearchAndRedirect();
  }

  if (action.type === 'PERFORM_SEARCH') {
    if (action.term.length === 0) {
      clearSearchAndRedirect();
    } else {
      document.location = `?q=${action.term}`;
    }
  }

  if (action.type === 'UPDATE_SEARCH_TERM') {
    return {
      ...state,
      term: action.term
    };
  }

  return state;
}
