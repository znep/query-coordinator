import { assert } from 'chai';
import React from 'react';
import NoMatch from 'pages/NoMatch/NoMatch';
import { shallow } from 'enzyme';

describe('components/NoMatch', () => {
  const testParams = {
    category: 'dataset',
    name: 'dfsdfdsf',
    fourfour: 'kg5j-unyr',
    revisionSeq: '0',
    sourceId: '115',
    inputSchemaId: '98',
    outputSchemaId: '144'
  };

  it('renders without errors', () => {
    const element = shallow(<NoMatch />, {
      context: {
        router: {
          params: testParams,
          push: () => {},
          replace: () => {},
          go: () => {},
          goBack: () => {},
          goForward: () => {},
          createHref: () => {},
          createPath: () => {},
          setRouteLeaveHook: () => {},
          isActive: () => {}
        }
      },
      childContextTypes: {
        store: React.PropTypes.object
      }
    });

    assert.isFalse(element.isEmpty());
  });
});
