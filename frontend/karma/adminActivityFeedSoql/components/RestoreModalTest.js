import { assert } from 'chai';

import RestoreModal from 'adminActivityFeedSoql/components/RestoreModal';
import mockData from '../data/mockFetchTable';
import mockTranslations from '../mockTranslations';
import testStore from '../testStore';

describe('RestoreModal', () => {
  const store = testStore({
    common: {
      restoreModal: 'yqbx-qy9u'
    },
    table: {
      data: mockData
    }
  });

  const element = renderComponentWithLocalization(RestoreModal, {}, store);

  it('renders cancel button', () => {
    const cancelButton = element.querySelector('.dismiss-button');
    assert.equal(cancelButton.innerText, mockTranslations.cancel);
  });

  it('renders accept button', () => {
    const acceptButton = element.querySelector('.accept-button');
    assert.equal(acceptButton.innerText, mockTranslations.restore);
  });

  it('renders title', () => {
    const title = element.querySelector('.modal-header-title');
    assert.equal(title.textContent, mockTranslations.restore);
  });

  it('renders description', () => {
    const description = element.querySelector('.description');
    assert.equal(
      description.textContent,
      mockTranslations.restore_confirmation.replace('%{dataset}', mockData[4].dataset_name)
    );
  });
});
