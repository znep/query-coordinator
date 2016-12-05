import EditBar from 'components/EditBar';
import mockView from 'data/mockView';

describe('EditBar', () => {
  it('renders', () => {
    const element = renderComponentWithStore(EditBar);
    expect(element).to.exist;
  });

  it('renders the page name', () => {
    const element = renderComponentWithStore(EditBar);
    expect(element.innerText).to.contain(mockView.name);
  });
});
