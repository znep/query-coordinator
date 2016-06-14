import { Simulate } from 'react-addons-test-utils';
import ViewWidget from 'components/ViewWidget';
import mockViewWidget from 'data/mockViewWidget';

describe('components/ViewWidget', function() {
  function getProps(props) {
    return _.defaultsDeep({}, props, mockViewWidget);
  }

  it('renders an element', function() {
    var element = renderComponent(ViewWidget, getProps());
    expect(element).to.exist;
  });

  describe('markup', function() {
    it('renders the name', function() {
      var element = renderComponent(ViewWidget, getProps({
        name: 'Nollywood'
      }));
      expect(element.querySelector('.entry-title').innerText).to.eq('Nollywood');
    });

    it('renders an icon if the dataset is private', function() {
      var element = renderComponent(ViewWidget, getProps({
        isPrivate: true
      }));
      expect(element.querySelector('.icon-private')).to.exist;
    });

    it('does not render an icon if the dataset is public', function() {
      var element = renderComponent(ViewWidget, getProps({
        isPrivate: false
      }));
      expect(element.querySelector('.icon-private')).to.not.exist;
    });

    it('renders a message if isExternal is true', function() {
      var element = renderComponent(ViewWidget, getProps({
        isExternal: true
      }));
      expect(element.querySelector('.entry-meta').innerText).to.eq(I18n.view_widget.external_content);
    });

    it('renders the date and view count if isExternal is false', function() {
      var element = renderComponent(ViewWidget, getProps({
        isExternal: false,
        updatedAt: '2016-06-08T15:52:10.000-07:00',
        viewCount: 99
      }));
      var metadataRow = element.querySelector('.entry-meta');

      expect(metadataRow.querySelector('.first').innerText).to.eq('June 8, 2016');
      expect(metadataRow.querySelector('.second').innerText).to.eq('99 Views');
    });

    it('renders an image if provided', function() {
      var element = renderComponent(ViewWidget, getProps({
        imageUrl: '/image.png'
      }));
      expect(element.querySelector('img')).to.exist;
    });

    it('renders an icon if no image is provided', function() {
      var element = renderComponent(ViewWidget, getProps());
      expect(element.querySelector('img')).to.not.exist;
    });

    it('renders the description if provided', function() {
      var element = renderComponent(ViewWidget, getProps());
      expect(element.querySelector('.entry-description')).to.exist;
    });
  });
});
