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
      expect(element.querySelector('.btn.grid')).to.exist;
    });

    it('does not exist if the dataset is blobby or an href', () => {
      const element = renderComponent(InfoPaneButtons, getProps({
        view: {
          isBlobby: true
        }
      }));

      expect(element.querySelector('.btn.grid')).to.not.exist;
    });
  });

  describe('manage button', () => {
    it('does not exist if the dataset is tabular', () => {
      const element = renderComponent(InfoPaneButtons, getProps());
      expect(element.querySelector('.btn.manage')).to.not.exist;
    });

    it('exists if the dataset is blobby or an href', () => {
      const element = renderComponent(InfoPaneButtons, getProps({
        view: {
          isBlobby: true
        }
      }));

      expect(element.querySelector('.btn.manage')).to.exist;
    });
  });

  describe('download button', () => {
    it('exists if the dataset is tabular', () => {
      const element = renderComponent(InfoPaneButtons, getProps());

      expect(element.querySelector('.btn.download')).to.exist;
    });

    it('exists if the dataset is blobby', () => {
      const element = renderComponent(InfoPaneButtons, getProps({
        view: {
          isBlobby: true
        }
      }));

      expect(element.querySelector('.btn.download')).to.exist;
    });

    it('does not exist if the dataset is an href', () => {
      const element = renderComponent(InfoPaneButtons, getProps({
        view: {
          isHref: true
        }
      }));

      expect(element.querySelector('.btn.download')).to.not.exist;
    });

    it('renders all the options', function(){
      const element = renderComponent(InfoPaneButtons, getProps());

      expect(element.querySelectorAll('.download a').length).to.equal(mockView.exportFormats.length);
    });

    it('renders CSV for Excel Option', function(){
      const element = renderComponent(InfoPaneButtons, getProps());
      const downloadOption = element.querySelector('[data-type="CSV for Excel"]');

      expect(downloadOption).to.exist;
      expect(downloadOption.getAttribute('href')).to.contain('.csv');
      expect(downloadOption.getAttribute('href')).to.contain('bom');
    });

    it('renders TSV for Excel Option', function(){
      const element = renderComponent(InfoPaneButtons, getProps());
      const downloadOption = element.querySelector('[data-type="TSV for Excel"]');

      expect(downloadOption).to.exist;
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
      expect(element.querySelector('.btn.api')).to.exist;
    });

    it('does not exist if the dataset is blobby or an href', () => {
      const element = renderComponent(InfoPaneButtons, getProps({
        view: {
          isBlobby: true
        }
      }));

      expect(element.querySelector('.btn.api')).to.not.exist;
    });
  });

  describe('share button', () => {
    it('exists if the dataset is tabular', () => {
      const element = renderComponent(InfoPaneButtons, getProps());
      expect(element.querySelector('.btn.share')).to.exist;
    });

    it('exists if the dataset is blobby or an href', () => {
      const element = renderComponent(InfoPaneButtons, getProps({
        view: {
          isBlobby: true
        }
      }));

      expect(element.querySelector('.btn.share')).to.exist;
    });
  });

  describe('more actions dropdown', () => {
    describe('comment link', () => {
      it('exists if commentUrl is defined', () => {
        const element = renderComponent(InfoPaneButtons, getProps());
        expect(element.querySelector('a[href="commentUrl"]')).to.exist;
      });

      it('does not exist if commentUrl is not defined', () => {
        const element = renderComponent(InfoPaneButtons, getProps({
          view: {
            commentUrl: null
          }
        }));
        expect(element.querySelector('a[href="commentUrl"]')).to.not.exist;
      });
    });

    describe('contact dataset owner link', () => {
      it('exists by default (disableContactDatasetOwner is false or undefined)', () => {
        const element = renderComponent(InfoPaneButtons, getProps());
         expect(element.querySelector('a[data-modal="contact-form"]')).to.exist;
      });

      it('exists if disableContactDatasetOwner is defined and set to false', () => {
        const element = renderComponent(InfoPaneButtons, getProps({
          view: {
            disableContactDatasetOwner: false
          }
        }));
        expect(element.querySelector('a[data-modal="contact-form"]')).to.exist;
      });

      it('does not exist if disableContactDatasetOwner is defined and set to true', () => {
        const element = renderComponent(InfoPaneButtons, getProps({
          view: {
            disableContactDatasetOwner: true
          }
        }));
        expect(element.querySelector('a[data-modal="contact-form"]')).to.not.exist;
      });
    });
  });
});
