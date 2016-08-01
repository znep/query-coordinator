import React from 'react';
import TestUtils from 'react-addons-test-utils';

import defaultProps from '../../defaultProps';
import renderComponent from '../../renderComponent';
import { DataPane } from 'src/authoringWorkflow/components/panes/DataPane';

describe('DataPane', function() {
  describe('rendering', function() {
    describe('with an error', function() {
      it('renders a metadata error message', function() {
        var component = renderComponent(DataPane, defaultProps({
          metadata: { error: true }
        }));

        expect(component.querySelector('.metadata-error')).to.exist;
      });
    });

    describe('while loading', function() {
      it('renders a loading spinner', function() {
        var component = renderComponent(DataPane, defaultProps({
          metadata: { isLoading: true }
        }));

        expect(component.querySelector('.metadata-loading')).to.exist;
      });
    });
  });
});
