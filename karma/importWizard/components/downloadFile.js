import {
  fileDownloadStart,
  fileDownloadComplete,
  update,
  view,
  scanURL
}
from 'components/downloadFile';
import TestUtils from 'react-addons-test-utils';
import { withMockFetch, testThunk } from '../asyncUtils';
import * as ExampleData from './exampleData';

describe("downloadFile's", () => {

  describe('reducer', () => {

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

  describe('thunk `scanUrl`', () => {

    const sampleScan = {
      headers: 0,
      columns: [
        {
          name: 'Police Beat',
          processed: 4999,
          suggestion: 'text',
          types: {
            text: 4999,
            calendar_date: 0,
            number: 0,
            money: 0,
            percent: 0
          }
        },
        {
          name: 'CRIME_TYPE',
          processed: 4999,
          suggestion: 'text',
          types: {
            text: 4999,
            calendar_date: 0,
            number: 0,
            money: 0,
            percent: 0
          }
        }
      ],
      sample: [
        ['Police Beat', 'CRIME_TYPE'],
        ['B1', 'Homicide'],
        ['B1', 'Rape']
      ]
    };

    it('posts to the correct url, polls, and dispatches the correct action on success', (done) => {
      const url = 'http://example.com/data.csv';
      const ticket = 'da1a1d2c-594d-4678-8cac-cded42b68991';
      withMockFetch(
        [
          (url, options, resolve, reject) => {
            expect(url).to.equal('/api/imports2.json?method=scanUrl&saveUnderViewUid=abcd-efgh');
            resolve({
              status: 202,
              json: () => (
                Promise.resolve({
                  code: 'accepted',
                  error: false,
                  ticket: ticket,
                  details: {
                    message: 'Scanning file...'
                  }
                })
              )
            });
          },
          (url, options, resolve, reject) => {
            expect(url).to.equal(`/api/imports2.json?method=scanUrl&ticket=${ticket}`);
            resolve({
              status: 200,
              json: () => (
                Promise.resolve({
                  fileId: ticket,
                  newImportSourceVersion: 123,
                  summary: sampleScan
                })
              )
            });
          }
        ],
        () => {
          testThunk(
            done,
            scanURL(url),
            { datasetId: 'abcd-efgh', download: { type: 'NotStart', url: url, fileName: 'data.csv' } },
            [
              (state, action) => {
                expect(action).to.deep.equal({
                  type: 'FILE_DOWNLOAD_START'
                });
                const newState = update(state.download, action);
                expect(newState).to.deep.equal({
                  type: 'Started',
                  fileName: 'data.csv',
                  url: url,
                  error: null
                });
                return { download: newState };
              },
              (state, action) => {
                expect(action).to.deep.equal({
                  type: 'FILE_DOWNLOAD_PROGRESS',
                  message: 'Scanning file...'
                });
                const newState = update(state.download, action);
                expect(newState).to.deep.equal({
                  type: 'InProgress',
                  fileName: 'data.csv',
                  message: 'Scanning file...',
                  url: url,
                  error: null
                });
                return { download: newState };
              },
              (state, action) => {
                const scanWithIndices = {
                  ...sampleScan,
                  columns: [
                    {
                      ...sampleScan.columns[0],
                      index: 0
                    },
                    {
                      ...sampleScan.columns[1],
                      index: 1
                    }
                  ]
                };
                const expectedAction = {
                  type: 'FILE_DOWNLOAD_COMPLETE',
                  fileId: ticket,
                  summary: scanWithIndices
                };
                expect(action).to.deep.equal(expectedAction);
                const newState = update(state.download, action);
                const expected = {
                  type: 'Complete',
                  fileName: 'data.csv',
                  url: url,
                  fileId: ticket,
                  summary: scanWithIndices
                };
                expect(newState).to.deep.equal(expected);
              }
            ]
          );
        }
      );
    });

  });

});
