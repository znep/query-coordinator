import { expect, assert } from 'chai';
import _ from 'lodash';
import { HrefDownload } from 'components/HrefDownload';
import mockServerConfig from 'data/mockServerConfig';

describe('components/HrefDownload', function() {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      view: {
        id: 'viewId',
        isHref: true,
        editMetadataUrl: '/editThatMetadata',
        allAccessPoints: [
          {
            title: 'Reflect',
            description: 'A wondrous wall is put up to suppress damage from physical attacks for five turns.',
            urls: {
              'application/mr': 'Monsieur',
              'application/mime': 'Mime'
            },
            describedBy: 'bulbapedia'
          },
          {
            title: 'Light Screen',
            description: 'A wondrous wall of light is put up to suppress damage from special attacks for five turns.',
            urls: {
              'application/ms': 'Mademoiselle',
              'application/mime': 'Mime'
            }
          }
        ]
      }
    });
  }

  it('renders an element if the view is an href', function() {
    var element = renderComponent(HrefDownload, getProps());
    assert.ok(element);
    assert.ok(element.querySelector('h2'));
    assert.ok(element.querySelector('.section-content'));
  });

  it('does not render an element if the view is not an href', function() {
    var element = renderComponent(HrefDownload, getProps({
      view: {
        isHref: false
      }
    }));

    assert.isNull(element);
  });

  describe('edit prompt', function() {
    afterEach(function() {
      window.serverConfig = _.cloneDeep(mockServerConfig);
    });

    it('is hidden if the user is not a publisher or an admin', function() {
      window.serverConfig.currentUser = null;
      var element = renderComponent(HrefDownload, getProps());
      assert.isNull(element.querySelector('.edit-prompt'));
    });

    it('is visible if the user is a publisher or an admin', function() {
      window.serverConfig.currentUser = { rights: [ 'edit_others_datasets' ] };
      var element = renderComponent(HrefDownload, getProps());
      assert.ok(element.querySelector('.edit-prompt'));
    });

    it('has a button that links to the edit page', function() {
      window.serverConfig.currentUser = { rights: [ 'edit_others_datasets' ] };
      var element = renderComponent(HrefDownload, getProps());
      expect(element.querySelector('.edit-prompt a.btn').getAttribute('href')).to.equal('/editThatMetadata');
    });
  });

  describe('main content', function() {
    it('contains nothing if the accessPoints is not present', function() {
      var element = renderComponent(HrefDownload, getProps({
        view: {
          allAccessPoints: null
        }
      }));

      assert.ok(element);
      assert.isNull(element.querySelector('.section-content'));
    });

    it('contains information about each download', function() {
      var element = renderComponent(HrefDownload, getProps());
      var accessPoints = element.querySelectorAll('.section-content .download-object');
      expect(accessPoints).to.have.length(2);

      expect(accessPoints[0].querySelector('.download-title').textContent).to.equal('Reflect');
      expect(accessPoints[0].querySelector('.download-description').textContent).to.contain('physical attacks');
      expect(accessPoints[0].querySelectorAll('.btn.download')).to.have.length(3);

      expect(accessPoints[1].querySelector('.download-title').textContent).to.equal('Light Screen');
      expect(accessPoints[1].querySelector('.download-description').textContent).to.contain('special attacks');
      expect(accessPoints[1].querySelectorAll('.btn.download')).to.have.length(2);
    });

    it('renders the data dictionary button for access points that have a describedBy key', function() {
      var element = renderComponent(HrefDownload, getProps());
      var accessPoints = element.querySelectorAll('.section-content .download-object');
      assert.ok(accessPoints[0].querySelector('.btn[href="bulbapedia"]'));
      assert.isNull(accessPoints[1].querySelector('.btn[href="bulbapedia"]'));
    });
  });
});
