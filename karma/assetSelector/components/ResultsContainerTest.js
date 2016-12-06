// ./node_modules/karma/bin/karma start karma/assetSelector/karma.conf.js --singleRun false --browsers Chrome --reporters mocha

import _ from 'lodash';
import { ResultsContainer } from 'components/ResultsContainer';

describe('components/ResultsContainer', function() {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      results: [
        {
          id: 'abcd-1234',
          data: {
            resource: {
              name: 'test view',
              description: 'test view description',
              id: 'abcd-1234',
              type: 'dataset',
            },
            link: 'https://localhost/A/B/abcd-1234'
          }
        }
      ]
    });
  }

  it('renders the results container if the results array is present', function() {
    var element = renderComponent(ResultsContainer, getProps());
    expect(element).to.exist;
    expect(element.className).to.eq('results-container');
  });

  it('renders the "no results" element if the results array is empty', function() {
    var element = renderComponent(ResultsContainer, { results: [] });
    expect(element).to.exist;
    expect(element.className).to.eq('no-results');
  });
});
