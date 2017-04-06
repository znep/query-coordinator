import { expect, assert } from 'chai';
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

      expect(element.querySelector('.entry-meta .date').innerText).to.equal('Unsaved');
    });

    it('renders the lastUpdatedAt value if the view is not ephemeral', () => {
      const element = renderComponentWithStore(InfoPane, {}, getStore({
        isEphemeral: false
      }));

      expect(element.querySelector('.entry-meta .date').innerText).to.equal('November 15, 2016');
    });
  });

  it('generates the correct link for the footer', () => {
    const element = renderComponentWithStore(InfoPane, {});
    const footer = element.querySelector('.entry-meta.first a');

    expect(footer.innerText).to.equal('Based on ' + mockParentView.name);
    expect(footer.href).to.have.string(mockParentView.path);
  });
});
