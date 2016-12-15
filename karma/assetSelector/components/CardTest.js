import { Card } from 'components/Card';

describe('components/Card', function() {
  function defaultProps() {
    return {
      categories: ['Fun'],
      description: 'jorts and other denim articles of clothing',
      display_title: 'Table',
      id: 'abcd-1234',
      is_federated: false,
      is_public: true,
      link: 'http://davidhasselhoffonline.com/',
      name: 'david hasselhoff',
      preview_image_url: '',
      provenance: 'official',
      tags: [],
      type: 'dataset',
      updated_at: '2016-12-15T22:52:12.006Z',
      view_count: 9999999
    };
  }

  function getProps(props = {}) {
    return Object.assign({}, defaultProps(), props);
  }

  it('renders an empty card with no data', function() {
    var element = renderComponent(Card, {});
    expect(element).to.exist;
    expect(element.className).to.match(/result-card/);
  });

  it('renders a card with correct data', function() {
    var element = renderComponent(Card, getProps());
    expect(element).to.exist;
    expect(element.querySelector('.entry-title').textContent).to.eq('david hasselhoff');
    expect(element.querySelector('.entry-description').textContent).to.
      eq('jorts and other denim articles of clothing');
    expect(element.querySelector('.first').querySelector('.date').textContent).to.eq('December 15, 2016');
    expect(element.querySelector('.entry-view-type').querySelector('.icon-dataset')).to.exist;
    expect(element.querySelector('.entry-main').
      querySelector('a[href="http://davidhasselhoffonline.com/"][aria-label="View david hasselhoff"]')).
      to.exist;
  });
});
