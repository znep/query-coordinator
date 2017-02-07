import { Card } from 'Card';

describe('Card', function() {
  function defaultProps() {
    return {
      categories: ['Fun'],
      description: 'jorts and other denim articles of clothing',
      id: 'abcd-1234',
      isFederated: false,
      isPublic: true,
      link: 'http://davidhasselhoffonline.com/',
      name: 'David Hasselhoff',
      previewImageUrl: '',
      provenance: 'official',
      tags: [],
      type: 'dataset',
      updatedAt: '2016-12-15T22:52:12.006Z',
      viewCount: 9999999
    };
  }

  function getProps(props = {}) {
    return {...defaultProps(), ...props};
  }

  it('renders an empty card with no data', function() {
    var element = renderComponent(Card, {});
    expect(element).to.exist;
    expect(element.className).to.match(/result-card/);
  });

  it('renders a card with correct data', function() {
    var element = renderComponent(Card, getProps());
    expect(element).to.exist;
    expect(element.querySelector('.entry-title').textContent).to.eq('David Hasselhoff');
    expect(element.querySelector('.entry-description').textContent).to.
      eq('jorts and other denim articles of clothing');
    expect(element.querySelector('.first').querySelector('.date').textContent).to.eq('December 15, 2016');
    expect(element.querySelector('.entry-view-type').querySelector('.socrata-icon-dataset')).to.exist;
    expect(element.querySelector('.entry-main').
      querySelector('a[href="http://davidhasselhoffonline.com/"][aria-label="View David Hasselhoff"]')).
      to.exist;
  });

  it('calls onSelect and onClose on click', function() {
    var onCloseSpy = sinon.spy();
    var onSelectSpy = sinon.spy();
    var element = renderComponent(Card, getProps({ onClose: onCloseSpy, onSelect: onSelectSpy }));
    TestUtils.Simulate.click(element.querySelector('.hover-target'));
    expect(onCloseSpy).to.have.been.called;
    expect(onSelectSpy).to.have.been.called;
  });
});
