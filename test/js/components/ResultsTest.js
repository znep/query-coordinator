import React from 'react';
import { shallow } from 'enzyme';

import { ResultsClass } from 'components/Results/Results';
import Result from 'components/Results/Result';

/* Note that in these tests noop functions are passed in as props to satisfy propTypes requirements */
describe('<Results />', () => {
  const results = [
    { title: "Birds", display_title: "<span>Birds</span>" },
    { title: "Not Birds", display_title: "Not <span>Birds</span>" },
    { title: "Maybe Birds", display_title: "Maybe <span>Birds</span>" }
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
        visible={true}
        onResultsVisibilityChanged={() => {}}
        onResultFocusChanged={() => {}}
        onQueryChanged={() => {}} />
    );

    expect(wrapper.find(Result)).to.have.length(3);
  })
});
