import { Card } from 'components/assetSelector/Card';

describe('Card', function() {
  const defaultProps = {
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

  function getProps(props = {}) {
    return {...defaultProps, ...props};
  }

  it('renders an empty card with no data', function() {
    var element = renderComponent(Card, {});
    assert.isDefined(element);
    assert.match(element.className, /result-card/);
  });

  it('renders a card with correct data', function() {
    var element = renderComponent(Card, getProps());
    assert.isDefined(element);
    assert.equal(element.querySelector('.entry-title').textContent, 'David Hasselhoff');
    assert.equal(element.querySelector('.entry-description').textContent,
      'jorts and other denim articles of clothing');
    assert.equal(element.querySelector('.first').querySelector('.date').textContent,
      'December 15, 2016');
    assert.isNotNull(element.querySelector('.entry-view-type').querySelector('.socrata-icon-dataset'));
    assert.isNotNull(element.querySelector('.entry-main').
      querySelector('a[href="http://davidhasselhoffonline.com/"][aria-label="View David Hasselhoff"]'));
  });

  it('calls onSelect and onClose on click', function() {
    var onCloseSpy = sinon.spy();
    var onSelectSpy = sinon.spy();
    var element = renderComponent(Card, getProps({ onClose: onCloseSpy, onSelect: onSelectSpy }));
    TestUtils.Simulate.click(element.querySelector('.hover-target'));
    sinon.assert.calledOnce(onCloseSpy);
    sinon.assert.calledOnce(onSelectSpy);
  });
});
