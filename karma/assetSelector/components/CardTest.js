import { Card } from 'components/Card';

describe('components/Card', function() {
  function defaultProps() {
    return {
      categories: ['Fun'],
      description: 'jorts and other denim articles of clothing',
      id: 'abcd-1234',
      isFederated: false,
      isPublic: true,
      link: 'http://davidhasselhoffonline.com/',
      name: 'david hasselhoff',
      previewImageUrl: '',
      provenance: 'official',
      tags: [],
      type: 'dataset',
      updatedAt: '2016-12-15T22:52:12.006Z',
      viewCount: 9999999
    };
  }

  function getProps(props = {}) {
    return Object.assign({}, defaultProps(), props);
  }

  it('renders an empty card with no data', function() {
    var element = renderComponentWithStore(Card, {});
    expect(element).to.exist;
    expect(element.className).to.match(/result-card/);
  });

  it('renders a card with correct data', function() {
    var element = renderComponentWithStore(Card, getProps());
    expect(element).to.exist;
    expect(element.querySelector('.entry-title').textContent).to.eq('david hasselhoff');
    expect(element.querySelector('.entry-description').textContent).to.
      eq('jorts and other denim articles of clothing');
    expect(element.querySelector('.first').querySelector('.date').textContent).to.eq('December 15, 2016');
    expect(element.querySelector('.entry-view-type').querySelector('.socrata-icon-dataset')).to.exist;
    expect(element.querySelector('.entry-main').
      querySelector('a[href="http://davidhasselhoffonline.com/"][aria-label="View david hasselhoff"]')).
      to.exist;
  });
});
