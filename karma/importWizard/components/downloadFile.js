import {
  fileDownloadStart,
  fileDownloadComplete,
  update,
  view
}
from 'components/downloadFile';
import TestUtils from 'react-addons-test-utils';
import * as ExampleData from './exampleData';

describe("downloadFile's reducer", () => {
  var state;

  beforeEach(() => {
    state = {};
  });

  describe('view', () => {
    it('renders a empty input box initially', () => {
      const element = renderComponent(view({
        onFileDownloadAction: _.noop,
        fileDownload: {},
        goToPrevious: _.noop
      }));
      expect(element.querySelector('div.crossloadFilePane > p.headline').innerHTML)
        .to.equal(I18n.screens.dataset_new.crossload.headline);
    });

    it('renders number of bytes downloaded', () => {
      const element = renderComponent(view({
        onFileDownloadAction: _.noop,
        fileDownload: {
          type: 'InProgress',
          message: '42 bytes uploaded'
        },
        goToPrevious: _.noop
      }));
      expect(element.querySelector('.uploadThrobber .text').innerHTML)
        .to.equal(I18n.screens.dataset_new.crossload.downloading);
      expect(element.querySelector('.uploadThrobber p').innerHTML)
        .to.equal('42 bytes uploaded');
    });

    it('renders the download spinner', () => {
      const element = renderComponent(view({
        onFileDownloadAction: _.noop,
        fileDownload: {
          type: 'Started'
        },
        goToPrevious: _.noop
      }));
      expect(element.querySelector('.uploadThrobber .text').innerHTML)
        .to.equal(I18n.screens.dataset_new.crossload.downloading);
    });

    it('cancels the download when clicked', () => {
      var events = [];
      var previous = false;
      const element = renderComponent(view({
        onFileDownloadAction: (ev) => events.push(ev),
        fileDownload: {
          type: 'Started'
        },
        goToPrevious: () => previous = true
      }));

      TestUtils.Simulate.click(element.querySelector('.prevButton'));

      expect(events).to.eql([{
        'type': 'FILE_DOWNLOAD_CANCEL'
      }]);
      expect(previous).to.eql(true);
    });
  });
});
