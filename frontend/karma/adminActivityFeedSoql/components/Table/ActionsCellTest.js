import { assert } from 'chai';

import ActionsCell from 'components/Table/ActionsCell';
import mockData from '../../data/mockFetchTable';
import mockTranslations from '../../mockTranslations';
import testStore from '../../testStore';

describe('Table/ActionsCell', () => {

  describe('Show/Hide Details', () => {
    const activity = mockData[3];

    it('renders show details button', () => {
      const props = { activity };

      const element = renderComponentWithLocalization(ActionsCell, props);
      assert(element.textContent, mockTranslations.show_details);
    });

    it('renders hide details button', () => {
      const props = {
        activity,
        openDetailsId: 'something'
      };

      const element = renderComponentWithLocalization(ActionsCell, props);
      assert(element.textContent, mockTranslations.hide_details);
    });

  });

  describe('Restore button', () => {
    it('renders restore button for restorable dataset', () => {
      const store = testStore({
        table: {
          data: mockData,
          restorableList: { 'yqbx-qy9u': true }
        }
      });

      const props = {
        activity: mockData[4]
      };

      const element = renderComponentWithLocalization(ActionsCell, props, store);
      assert.equal(element.textContent, mockTranslations.restore);
    });

    it('renders a restored text for restored dataset', () => {
      const store = testStore({
        table: {
          data: mockData,
          restorableList: { 'yqbx-qy9u': false }
        }
      });

      const props = {
        activity: mockData[4]
      };

      const element = renderComponentWithLocalization(ActionsCell, props, store);
      assert.equal(element.textContent, mockTranslations.restored);
    });

    it('doesn\'t renders restore button for non-restorable dataset', () => {
      const store = testStore({
        table: {
          data: mockData,
          restorableList: {}
        }
      });

      const props = {
        activity: mockData[4]
      };

      const element = renderComponentWithLocalization(ActionsCell, props, store);
      assert.isNull(element);
    });
  });

});
