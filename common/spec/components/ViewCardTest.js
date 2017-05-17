import _ from 'lodash';
import { Simulate } from 'react-addons-test-utils';
import { renderComponent } from '../helpers';
import ViewCard from 'components/ViewCard';

describe('ViewCard', function() {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      description: 'The final frontier',
      icon: 'socrata-icon-bar-chart',
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
    assert.isNotNull(element);
  });

  describe('markup', function() {
    it('renders the name', function() {
      var element = renderComponent(ViewCard, getProps({
        name: 'Nollywood'
      }));
      assert.deepEqual(element.querySelector('.entry-title').innerText, 'Nollywood');
    });

    it('renders an icon if the dataset is private', function() {
      var element = renderComponent(ViewCard, getProps({
        isPrivate: true
      }));
      assert.isNotNull(element.querySelector('.socrata-icon-private'));
    });

    it('does not render an icon if the dataset is public', function() {
      var element = renderComponent(ViewCard, getProps({
        isPrivate: false
      }));
      assert.isNull(element.querySelector('.socrata-icon-private'));
    });

    it('renders the metadata values', function() {
      var element = renderComponent(ViewCard, getProps({
        metadataLeft: 'some metadata',
        metadataRight: 'some more metadata'
      }));

      assert.deepEqual(element.querySelector('.entry-meta .first').innerText, 'some metadata');
      assert.deepEqual(element.querySelector('.entry-meta .second').innerText, 'some more metadata');
    });

    describe('image preview', function() {
      it('renders an icon if no image is provided', function() {
        var element = renderComponent(ViewCard, getProps());
        assert.isNull(element.querySelector('.preview-image'));
      });

      it('renders an image if one is provided', function() {
        var element = renderComponent(ViewCard, getProps({
          imageUrl: '/image.png'
        }));

        assert.isNotNull(element.querySelector('.preview-image'));
        assert.isNotNull(element.querySelector('.preview-image').style.backgroundImage);
        assert.include(element.querySelector('.preview-image').style.backgroundImage, '/image.png');
      });

      it('renders an image if one is provided and resource is external', function() {
        var element = renderComponent(ViewCard, getProps({
          imageUrl: '/image.png',
          isExternal: true
        }));

        assert.isNotNull(element.querySelector('.preview-image'));
        assert.isNotNull(element.querySelector('.preview-image').style.backgroundImage);
        assert.include(element.querySelector('.preview-image').style.backgroundImage, '/image.png');
      });
    });

    it('renders the description if provided', function() {
      var element = renderComponent(ViewCard, getProps());
      assert.isNotNull(element.querySelector('.entry-description'));
    });

    it('applies linkProps to the links', function() {
      var element = renderComponent(ViewCard, getProps({
        linkProps: {
          'aria-label': 'Carrots'
        }
      }));

      _.each(element.querySelectorAll('a'), link => {
        assert.equal(link.getAttribute('aria-label'), 'Carrots');
      });
    });
  });
});
