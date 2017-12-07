import _ from 'lodash';
import { assert } from 'chai';

import ActionsCell from 'components/Table/ActionsCell';
import * as mockData from '../../data/mockFetchTable';
import mockTranslations from '../../mockTranslations';

describe('Table/ActionsCell', () => {

  describe('Show/Hide Details', () => {
    const activity = mockData.data1[3];

    it('renders show details button', () => {
      const props = {
        activity,
        showDetails: _.noop,
        hideDetails: _.noop,
        openDetailsId: null
      };

      const element = renderComponentWithLocalization(ActionsCell, props);
      assert(element.textContent, mockTranslations.show_details);
    });

    it('renders hide details button', () => {
      const props = {
        activity,
        showDetails: _.noop,
        hideDetails: _.noop,
        openDetailsId: 'something'
      };

      const element = renderComponentWithLocalization(ActionsCell, props);
      assert(element.textContent, mockTranslations.hide_details);
    });

  });

});
