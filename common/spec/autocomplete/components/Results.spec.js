import React from 'react';
import { shallow } from 'enzyme';

import { ResultsClass } from 'common/autocomplete/components/Results/Results';
import Result from 'common/autocomplete/components/Results/Result';

/* Note that in these tests noop functions are passed in as props to satisfy propTypes requirements */
describe('<Results />', () => {
  const results = [
    { title: 'Birds', match_offset: [{ start: 0, length: 5 }] },
    { title: 'Not Birds', match_offset: [{ start: 4, length: 5 }] },
    { title: 'Maybe Birds', match_offset: [{ start: 6, length: 5 }] }
  ];

  it('is empty when hidden', () => {
    const wrapper = shallow(
      <ResultsClass
        results={results}
        visible={false}
        onResultsVisibilityChanged={() => {}}
        onResultFocusChanged={() => {}}
        onQueryChanged={() => {}} />
    );

    expect(wrapper.find(Result)).to.have.length(0);
  });

  it('renders all results when not hidden', () => {
    const wrapper = shallow(
      <ResultsClass
        results={results}
        visible
        onResultsVisibilityChanged={() => {}}
        onResultFocusChanged={() => {}}
        onQueryChanged={() => {}} />
    );

    expect(wrapper.find(Result)).to.have.length(3);
  });
});
