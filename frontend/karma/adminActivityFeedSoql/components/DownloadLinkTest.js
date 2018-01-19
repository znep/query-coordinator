import { assert } from 'chai';

import DownloadLink from 'adminActivityFeedSoql/components/DownloadLink';
import mockData from '../data/mockFetchTable';
import mockTranslations from '../mockTranslations';
import testStore from '../testStore';

describe('DownloadLink', () => {

  describe('Without Data', () => {
    const store = testStore({
      table: {
        data: []
      },
      filters: {},
      order: {}
    });
    const element = renderComponentWithLocalization(DownloadLink, {}, store);

    it('shouldnt render download button', () => {
      assert.isNull(element);
    });
  });

  describe('With Data', () => {
    const store = testStore({
      table: {
        data: mockData
      },
      filters: {},
      order: {}
    });

    const element = renderComponentWithLocalization(DownloadLink, {}, store);

    it('renders button', () => {
      const button = element.querySelector('.btn');
      assert.isNotNull(button);
      assert.equal(element.textContent, mockTranslations.download);
    });
  });

});
