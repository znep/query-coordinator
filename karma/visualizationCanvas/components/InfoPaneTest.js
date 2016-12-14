import InfoPane from 'components/InfoPane';
import mockView from 'data/mockView';
import mockParentView from 'data/mockParentView';
import { getStore } from 'testStore';

describe('InfoPane', () => {
  it('renders an element', () => {
    const element = renderComponentWithStore(InfoPane, {});
    expect(element).to.exist;
  });

  describe('updatedDate', () => {
    it('renders "unsaved" if no date provided', () => {
      const element = renderComponentWithStore(InfoPane, {}, getStore({
        view: _.merge({}, mockView, { lastUpdatedAt: null })
      }));
      expect(element.querySelector('.entry-meta .date').innerText).to.equal('Unsaved');
    });

    it('renders a timestamp if a date is provided', () => {
      const element = renderComponentWithStore(InfoPane, {});
      expect(element.querySelector('.entry-meta .date').innerText).to.equal('November 15, 2016');
    });
  });

  it('generates the correct link for the footer', () => {
    const element = renderComponentWithStore(InfoPane, {});
    const footer = element.querySelector('.entry-meta.first a');

    expect(footer.innerText).to.equal('Based on ' + mockParentView.name);
    expect(footer.href).to.have.string(mockParentView.url);
  });
});
