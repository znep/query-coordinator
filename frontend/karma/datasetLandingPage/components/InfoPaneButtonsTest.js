import { expect, assert } from 'chai';
import InfoPaneButtons from 'components/InfoPaneButtons';
import mockView from 'data/mockView';

describe('components/InfoPaneButtons', () => {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      view: mockView,
      onDownloadData: _.noop,
      onClickGrid: _.noop
    });
  }

  describe('view data button', () => {
    it('exists if the dataset is tabular', () => {
      const element = renderComponent(InfoPaneButtons, getProps());
      assert.ok(element.querySelector('.btn.grid'));
    });

    it('does not exist if the dataset is blobby or an href', () => {
      const element = renderComponent(InfoPaneButtons, getProps({
        view: {
          isBlobby: true
        }
      }));

      assert.isNull(element.querySelector('.btn.grid'));
    });
  });

  describe('manage button', () => {
    it('does not exist if the dataset is tabular', () => {
      const element = renderComponent(InfoPaneButtons, getProps());
      assert.isNull(element.querySelector('.btn.manage'));
    });

    it('exists if the dataset is blobby or an href', () => {
      const element = renderComponent(InfoPaneButtons, getProps({
        view: {
          isBlobby: true
        }
      }));

      assert.ok(element.querySelector('.btn.manage'));
    });
  });

  describe('download button', () => {
    it('exists if the dataset is tabular', () => {
      const element = renderComponent(InfoPaneButtons, getProps());

      assert.ok(element.querySelector('.btn.download'));
    });

    it('exists if the dataset is blobby', () => {
      const element = renderComponent(InfoPaneButtons, getProps({
        view: {
          isBlobby: true
        }
      }));

      assert.ok(element.querySelector('.btn.download'));
    });

    it('does not exist if the dataset is an href', () => {
      const element = renderComponent(InfoPaneButtons, getProps({
        view: {
          isHref: true
        }
      }));

      assert.isNull(element.querySelector('.btn.download'));
    });

    it('renders all the options', function(){
      const element = renderComponent(InfoPaneButtons, getProps());

      expect(element.querySelectorAll('.download a').length).to.equal(mockView.exportFormats.length);
    });

    it('renders CSV for Excel Option', function(){
      const element = renderComponent(InfoPaneButtons, getProps());
      const downloadOption = element.querySelector('[data-type="CSV for Excel"]');

      assert.ok(downloadOption);
      expect(downloadOption.getAttribute('href')).to.contain('.csv');
      expect(downloadOption.getAttribute('href')).to.contain('bom');
    });

    it('renders TSV for Excel Option', function(){
      const element = renderComponent(InfoPaneButtons, getProps());
      const downloadOption = element.querySelector('[data-type="TSV for Excel"]');

      assert.ok(downloadOption);
      expect(downloadOption.getAttribute('href')).to.contain('.tsv');
      expect(downloadOption.getAttribute('href')).to.contain('bom');
    });

    it('uses an overrideLink value if it is set', function() {
      const link = 'http://somelink';
      const element = renderComponent(InfoPaneButtons, getProps({
        view: _.extend({}, mockView, { metadata: { overrideLink: link } })
      }));
      const downloadButton = element.querySelector('.download');

      expect(downloadButton.href).to.contain(link);
    });

    it('uses a blob download if the view is blobby', function() {
      const element = renderComponent(InfoPaneButtons, getProps({
        view: _.extend({}, mockView, { isBlobby: true })
      }));
      const downloadButton = element.querySelector('.download');

      expect(downloadButton.href).to.match(/file_data/);
    });
  });

  describe('api button', () => {
    it('exists if the dataset is tabular', () => {
      const element = renderComponent(InfoPaneButtons, getProps());
      assert.ok(element.querySelector('.btn.api'));
    });

    it('does not exist if the dataset is blobby or an href', () => {
      const element = renderComponent(InfoPaneButtons, getProps({
        view: {
          isBlobby: true
        }
      }));

      assert.isNull(element.querySelector('.btn.api'));
    });
  });

  describe('share button', () => {
    it('exists if the dataset is tabular', () => {
      const element = renderComponent(InfoPaneButtons, getProps());
      assert.ok(element.querySelector('.btn.share'));
    });

    it('exists if the dataset is blobby or an href', () => {
      const element = renderComponent(InfoPaneButtons, getProps({
        view: {
          isBlobby: true
        }
      }));

      assert.ok(element.querySelector('.btn.share'));
    });
  });

  describe('more actions dropdown', () => {
    describe('visualize link', () => {
      beforeEach(() =>  {
        window.serverConfig.currentUser = { roleName: 'anything' };
        window.serverConfig.featureFlags.enableVisualizationCanvas = true;
      });

      afterEach(() => {
        window.serverConfig.currentUser = null;
        window.serverConfig.featureFlags.enableVisualizationCanvas = false;
      });

      it('exists if the bootstrapUrl is defined', () => {
        const element = renderComponent(InfoPaneButtons, getProps());
        assert.ok(element.querySelector('a[href="bootstrapUrl"]'));
      });

      it('does not exist if the bootstrapUrl is blank', () => {
        const element = renderComponent(InfoPaneButtons, getProps({
          view: {
            bootstrapUrl: null
          }
        }));

        assert.isNull(element.querySelector('a[href="bootstrapUrl"]'));
      });

      it('does not exist if the feature flag is disabled', () => {
        window.serverConfig.featureFlags.enableVisualizationCanvas = false;
        const element = renderComponent(InfoPaneButtons, getProps());
        assert.isNull(element.querySelector('a[href="bootstrapUrl"]'));
      });

      it('does not exist if the user lacks a role', () => {
        window.serverConfig.currentUser = {};
        const element = renderComponent(InfoPaneButtons, getProps());
        assert.isNull(element.querySelector('a[href="bootstrapUrl"]'));
      });
    });

    describe('comment link', () => {
      it('exists if commentUrl is defined', () => {
        const element = renderComponent(InfoPaneButtons, getProps());
        assert.ok(element.querySelector('a[href="commentUrl"]'));
      });

      it('does not exist if commentUrl is not defined', () => {
        const element = renderComponent(InfoPaneButtons, getProps({
          view: {
            commentUrl: null
          }
        }));
        assert.isNull(element.querySelector('a[href="commentUrl"]'));
      });
    });

    describe('contact dataset owner link', () => {
      it('exists by default (disableContactDatasetOwner is false or undefined)', () => {
        const element = renderComponent(InfoPaneButtons, getProps());
         assert.ok(element.querySelector('a[data-modal="contact-form"]'));
      });

      it('exists if disableContactDatasetOwner is defined and set to false', () => {
        const element = renderComponent(InfoPaneButtons, getProps({
          view: {
            disableContactDatasetOwner: false
          }
        }));
        assert.ok(element.querySelector('a[data-modal="contact-form"]'));
      });

      it('does not exist if disableContactDatasetOwner is defined and set to true', () => {
        const element = renderComponent(InfoPaneButtons, getProps({
          view: {
            disableContactDatasetOwner: true
          }
        }));
        assert.isNull(element.querySelector('a[data-modal="contact-form"]'));
      });
    });
  });
});
