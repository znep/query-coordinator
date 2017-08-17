import * as actions from 'common/autocomplete/actions'

describe('actions', () => {
  it('should create query changed action', () => {
    const query = 'Birds';
    const expectedAction = {
      type: actions.QUERY_CHANGED,
      query
    };
    expect(actions.queryChanged(query)).to.eql(expectedAction);
  });

  it('should create results changed action', () => {
    const someResponse = {
      results: [
        { title: 'Birds', display_title: '<span>Birds</span>' },
        { title: 'Not Birds', display_title: 'Not <span>Birds</span>' },
        { title: 'Maybe Birds', display_title: 'Maybe <span>Birds</span>' }
      ]
    };
    const expectedAction = {
      type: actions.RESULTS_CHANGED,
      response: someResponse
    };
    expect(actions.resultsChanged(someResponse)).to.eql(expectedAction)
  });

  it('should create results visibility changed action', () => {
    const visible = false;
    const expectedAction = {
      type: actions.RESULT_VISIBILITY_CHANGED,
      visible
    };
    expect(actions.resultVisibilityChanged(visible)).to.eql(expectedAction);
  });

  it('should create results focus changed', () => {
    const focus = 3;
    const expectedAction = {
      type: actions.RESULT_FOCUS_CHANGED,
      focus
    };
    expect(actions.resultFocusChanged(focus)).to.eql(expectedAction);
  });

  it('should create collapse changed', () => {
    const collapsed = true;
    const expectedAction = {
      type: actions.COLLAPSE_CHANGED,
      collapsed
    };
    expect(actions.collapseChanged(collapsed)).to.eql(expectedAction);
  });

  it('should create search cleared', () => {
    const expectedAction = { type: actions.CLEAR_SEARCH };
    expect(actions.clearSearch()).to.eql(expectedAction);
  });

})
