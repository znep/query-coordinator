import _ from 'lodash';
import { Simulate } from 'react-addons-test-utils';
import ViewCard from 'components/ViewCard';

describe('ViewCard', function() {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      description: 'The final frontier',
      icon: 'icon-bar-chart',
      imageUrl: null,
      isPrivate: false,
      linkProps: {},
      metadataLeft: null,
      metadataRight: null,
      name: '&nbsp;',
      onClick: null,
      url: 'http://socrata.com'
    });
  }

  it('renders an element', function() {
    var element = renderComponent(ViewCard, getProps());
    expect(element).to.exist;
  });

  describe('markup', function() {
    it('renders the name', function() {
      var element = renderComponent(ViewCard, getProps({
        name: 'Nollywood'
      }));
      expect(element.querySelector('.entry-title').innerText).to.eq('Nollywood');
    });

    it('renders an icon if the dataset is private', function() {
      var element = renderComponent(ViewCard, getProps({
        isPrivate: true
      }));
      expect(element.querySelector('.icon-private')).to.exist;
    });

    it('does not render an icon if the dataset is public', function() {
      var element = renderComponent(ViewCard, getProps({
        isPrivate: false
      }));
      expect(element.querySelector('.icon-private')).to.not.exist;
    });

    it('renders the metadata values', function() {
      var element = renderComponent(ViewCard, getProps({
        metadataLeft: 'some metadata',
        metadataRight: 'some more metadata'
      }));

      expect(element.querySelector('.entry-meta .first').innerText).to.eq('some metadata');
      expect(element.querySelector('.entry-meta .second').innerText).to.eq('some more metadata');
    });

    describe('image preview', function() {
      it('renders an icon if no image is provided', function() {
        var element = renderComponent(ViewCard, getProps());
        expect(element.querySelector('img')).to.not.exist;
      });

      it('renders an image if one is provided', function() {
        var element = renderComponent(ViewCard, getProps({
          imageUrl: '/image.png'
        }));

        expect(element.querySelector('img')).to.exist;
      });

      it('renders an image if one is provided and resource is external', function() {
        var element = renderComponent(ViewCard, getProps({
          imageUrl: '/image.png',
          isExternal: true
        }));

        expect(element.querySelector('img')).to.exist;
      });
    });

    it('renders the description if provided', function() {
      var element = renderComponent(ViewCard, getProps());
      expect(element.querySelector('.entry-description')).to.exist;
    });

    it('applies linkProps to the links', function() {
      var element = renderComponent(ViewCard, getProps({
        linkProps: {
          'aria-label': 'Carrots'
        }
      }));

      _.each(element.querySelectorAll('a'), link => {
        expect(link.getAttribute('aria-label')).to.equal('Carrots');
      });
    });
  });
});
