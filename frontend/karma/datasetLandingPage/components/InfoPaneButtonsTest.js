import { expect, assert } from 'chai';
import InfoPaneButtons from 'components/InfoPaneButtons';
import mockView from 'data/mockView';
import { FeatureFlags } from 'common/feature_flags';

describe('components/InfoPaneButtons', () => {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      view: mockView,
      onDownloadData: _.noop,
      onClickGrid: _.noop,
      onClickShareOption: _.noop
    });
  }

  beforeEach(() => {
    FeatureFlags.useTestFixture({
      enable_visualization_canvas: true,
      enable_external_data_integrations: true,
      enable_user_notifications: true,
    });
  });

  afterEach(() => {
    FeatureFlags.useTestFixture({});
  });

  describe('explore data button', () => {
    describe('exists', () => {
      it('for datasets', () => {
        const element = renderComponent(InfoPaneButtons, getProps());
        assert.ok(element.querySelector('.btn.explore-dropdown'));
      });
      it('not for blob and href', () => {
        const element = renderComponent(InfoPaneButtons, getProps({
          view: _.extend({}, mockView, { isBlobby: true })
        }));
        assert.isNotOk(element.querySelector('.btn.explore-dropdown'));
      });
    });

    describe('visualize link', () => {
      beforeEach(() =>  {
        window.serverConfig.currentUser = { roleName: 'anything' };
        FeatureFlags.updateTestFixture({ enable_visualization_canvas: true });
      });

      afterEach(() => {
        window.serverConfig.currentUser = null;
        FeatureFlags.updateTestFixture({ enable_visualization_canvas: false });
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
        FeatureFlags.updateTestFixture({ enable_visualization_canvas: false });
        const element = renderComponent(InfoPaneButtons, getProps());
        assert.isNull(element.querySelector('a[href="bootstrapUrl"]'));
      });

      it('is rendered when the user is logged in', () => {
        window.serverConfig.currentUser = { roleName: 'anything' };
        const element = renderComponent(InfoPaneButtons, getProps());
        assert.ok(element.querySelector('a[href="bootstrapUrl"]'));
      });

      it('is rendered when the user is not logged in', () => {
        window.serverConfig.currentUser = null;
        const element = renderComponent(InfoPaneButtons, getProps());
        assert.ok(element.querySelector('a[href="bootstrapUrl"]'));
      });
    });

    describe('view data button', () => {
      it('exists if the dataset is tabular', () => {
        const element = renderComponent(InfoPaneButtons, getProps());
        assert.ok(element.querySelector('.view-data'));
      });

      it('should not exist if the dataset is blobby or an href', () => {
        let element = renderComponent(InfoPaneButtons, getProps({
          view: {
            isBlobby: true
          }
        }));

        assert.isNull(element.querySelector('.view-data'));

        element = renderComponent(InfoPaneButtons, getProps({
          view: {
            isHref: true
          }
        }));

        assert.isNull(element.querySelector('.view-data'));
      });
    });

    describe('external integrations section', () => {
      describe('carto modal button', () => {
        it('not exists if no carto url present', () => {
          FeatureFlags.updateTestFixture({ enable_external_data_integrations: true });

          const element = renderComponent(InfoPaneButtons, getProps());
          assert.isNull(element.querySelector('a[data-modal=carto-modal]'));
        });

        it('not exists if disabled by feature flag', () => {
          FeatureFlags.updateTestFixture({ enable_external_data_integrations: false });

          const element = renderComponent(InfoPaneButtons, getProps());
          assert.isNull(element.querySelector('a[data-modal=carto-modal]'));
        });

        it('exists if a carto url present', () => {
          FeatureFlags.updateTestFixture({ enable_external_data_integrations: true });

          const element = renderComponent(InfoPaneButtons, getProps({
            view: {
              cartoUrl: 'something'
            }
          }));
          assert.ok(element.querySelector('a[data-modal=carto-modal]'));
        });
      });

      describe('plot.ly modal button', () => {
        it('not exists if disabled by feature flag', () => {
          FeatureFlags.updateTestFixture({ enable_external_data_integrations: false });

          const element = renderComponent(InfoPaneButtons, getProps());
          assert.isNull(element.querySelector('a[data-modal=plotly-modal]'));
        });

        it('includes a plot.ly modal button', () => {
          FeatureFlags.updateTestFixture({ enable_external_data_integrations: true });

          const element = renderComponent(InfoPaneButtons, getProps());
          assert.ok(element.querySelector('a[data-modal=plotly-modal]'));
        });
      });

      describe('more button', () => {
        it('not exists if disabled by feature flag', () => {
          FeatureFlags.updateTestFixture({ enable_external_data_integrations: false });

          const element = renderComponent(InfoPaneButtons, getProps());
          assert.isNull(element.querySelector('.explore-dropdown .more-options-button'));
        });

        it('should include a more button', () => {
          FeatureFlags.updateTestFixture({ enable_external_data_integrations: true });

          const element = renderComponent(InfoPaneButtons, getProps());
          assert.ok(element.querySelector('.explore-dropdown .more-options-button'));
        });
      });
    });
  });

  describe('manage button', () => {
    it('does not exist if the dataset is tabular', () => {
      const element = renderComponent(InfoPaneButtons, getProps());
      assert.isNull(element.querySelector('.btn.manage'));
    });

    it('exists if the dataset is blobby or an href', () => {
      let element = renderComponent(InfoPaneButtons, getProps({
        view: {
          isBlobby: true
        }
      }));

      assert.ok(element.querySelector('.btn.manage'));

      element = renderComponent(InfoPaneButtons, getProps({
        view: {
          isHref: true
        }
      }));

      assert.ok(element.querySelector('.btn.manage'));
    });
  });

  describe('more actions dropdown', () => {
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

    describe('watch dataset link', () => {
      beforeEach(() =>  {
        window.sessionData.email = 'test@mail.com';
        FeatureFlags.updateTestFixture({ enable_user_notifications: true });
      });

      afterEach(() => {
        window.sessionData.email = '';
        FeatureFlags.updateTestFixture({ enable_user_notifications: false });
      });

      it('show if user logged in and enabled user notifications feature flag', () => {
        const element = renderComponent(InfoPaneButtons, getProps({}));
        assert.ok(element.querySelector('.watch-dataset-link'));
      });

      it('hide if user notification feature flag not enabled', () => {
        FeatureFlags.updateTestFixture({ enable_user_notifications: false });
        const element = renderComponent(InfoPaneButtons, getProps({}));

        assert.isNull(element.querySelector('.watch-dataset-link'));
      });

      it('hide if user not logged in', () => {
        window.sessionData.email = '';
        const element = renderComponent(InfoPaneButtons, getProps({}));
        assert.isNull(element.querySelector('.watch-dataset-link'));
      });

    });
  });
});
