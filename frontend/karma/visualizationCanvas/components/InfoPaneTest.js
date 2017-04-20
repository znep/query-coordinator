import { assert } from 'chai';
import InfoPane from 'components/InfoPane';
import mockView from 'data/mockView';
import mockParentView from 'data/mockParentView';
import { getStore } from 'testStore';

describe('InfoPane', () => {
  it('renders an element', () => {
    const element = renderComponentWithStore(InfoPane, {});
    assert.ok(element);
  });

  describe('updatedDate', () => {
    it('renders "unsaved" if the view is ephemeral', () => {
      const element = renderComponentWithStore(InfoPane, {}, getStore({
        isEphemeral: true
      }));

      assert.equal(element.querySelector('.entry-meta .date').innerText, 'Unsaved');
    });

    it('renders the lastUpdatedAt value if the view is not ephemeral', () => {
      const element = renderComponentWithStore(InfoPane, {}, getStore({
        isEphemeral: false
      }));

      assert.equal(element.querySelector('.entry-meta .date').innerText, 'November 15, 2016');
    });
  });

  it('generates the correct link for the footer', () => {
    const element = renderComponentWithStore(InfoPane, {});
    const footer = element.querySelector('.entry-meta.first a');

    assert.equal(footer.innerText, 'Based on ' + mockParentView.name);
    assert.isTrue(footer.href.includes(mockParentView.path));
  });
});
