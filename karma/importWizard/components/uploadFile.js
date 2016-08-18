import TestUtils from 'react-addons-test-utils';

import {
  selectFile,
  fileUploadStart,
  fileUploadProgress,
  fileUploadAnalyzing,
  fileUploadComplete,
  fileUploadError,
  update,
  initialUploadProgress,
  view
} from 'components/uploadFile';

import * as ExampleData from './exampleData';

describe("uploadFile's reducer", () => {
  var state;

  beforeEach(() => {
    state = {};
  });

  describe('FILE_UPLOAD_START', () => {
    it('reacts to file upload', () => {
      const result = update(state, fileUploadStart({
        name: 'test_name.csv'
      }, 'i am an uploader ama'));
      expect(result).to.deep.equal({
        fileName: 'test_name.csv',
        progress: {
          type: 'InProgress',
          percent: 0,
          uploader: 'i am an uploader ama'
        }
      });
    });
  });

  describe('FILE_UPLOAD_CANCEL', () => {
    it('reacts to file upload progress event', () => {
      const result = update(state, {type: 'FILE_UPLOAD_CANCEL'});

      expect(result).to.deep.equal({
        fileName: null,
        progress: {
          type: 'Cancelled',
        }
      });
    });
  });

  describe('FILE_UPLOAD_PROGRESS', () => {
    it('reacts to file upload progress event', () => {
      const result = update(state, fileUploadProgress(15, 'i am an uploader ama'));
      expect(result).to.deep.equal({
        progress: {
          type: 'InProgress',
          percent: 15,
          uploader: 'i am an uploader ama'
        }
      });
    });
  });

  const stateBefore = {
    progress: {
      type: 'InProgress',
      percent: 15
    }
  };

  describe('FILE_UPLOAD_ANALYZING', () => {
    it('reacts to file analyzing event', () => {
      const stateAfter = update(stateBefore, fileUploadAnalyzing('i am an uploader ama'));
      expect(stateAfter).to.deep.equal({
        progress: {
          type: 'Analyzing',
          uploader: 'i am an uploader ama'
        }
      });
    });
  });

  describe('FILE_UPLOAD_COMPLETE',  () => {
    it('reacts to file upload complete', () => {
      const stateAfter = update(stateBefore, fileUploadComplete(
        ExampleData.imports2ScanResponse.fileId,
        ExampleData.imports2ScanResponse.summary
      ));
      expect(stateAfter).to.deep.equal({
        progress: {
          type: 'Complete',
          fileId: ExampleData.imports2ScanResponse.fileId,
          summary: ExampleData.imports2ScanResponse.summary
        }
      });
    });
  });

  describe('FILE_UPLOAD_ERROR', () => {
    it('reacts to file upload error', () => {
      const stateAfter = update(stateBefore, fileUploadError('oops'));
      expect(stateAfter).to.deep.equal({
        progress: {
          type: 'Failed',
          error: 'oops'
        }
      });
    });
  });

  describe('view', () => {

    it('renders an upload box with help text initially', () => {
      const element = renderComponent(view({onFileUploadAction: _.noop, fileUpload: {}, operation: 'UploadData'}));
      expect(element.querySelector('input.uploadFileName.valid').value)
        .to.equal(I18n.screens.dataset_new.upload_file.no_file_selected);
    });

    it('renders an upload box with filename once selected', () => {
      const element = renderComponent(
        view({
          onFileUploadAction: _.noop,
          fileUpload: {
            fileName: 'my_file.txt',
            progress: {
              type: 'InProgress',
              percent: 6
            }
          },
          operation: 'UploadData'
        })
      );
      expect(element.querySelector('input.uploadFileName.valid').value)
        .to.equal('my_file.txt');
      expect(element.querySelector('.uploadThrobber').children[1].innerText)
        .to.equal('6% uploaded');
    });

    it('renders an error message on error', () => {
      const element = renderComponent(
        view({
          onFileUploadAction: _.noop,
          fileUpload: {
            fileName: 'my_file.txt',
            progress: {
              type: 'Failed',
              error: 'There was a problem importing that file. Please make sure it is valid.'
            }
          },
          operation: 'UploadData'
        })
      );
      expect(element.querySelector('.flash-alert.error').innerText)
        .to.equal('There was a problem importing that file. Please make sure it is valid.');
    });

    it('renders an error message on localizable error', () => {
      const element = renderComponent(
        view({
          onFileUploadAction: _.noop,
          fileUpload: {
            fileName: 'my_file.txt',
            progress: {
              type: 'Failed',
              error: '{"error":{"reason":"incomplete_shapefile_error","english":"Your shapefile archive is incomplete. It must contain a .dbf, .shp, and .prj file for every layer. Expected it to contain the following files, which were actually missing: SIGNIFICANT_ECOLOGICAL_AREA_(SEA).shp.","params":{"missing":"SIGNIFICANT_ECOLOGICAL_AREA_(SEA).shp"}}}'
            }
          },
          operation: 'UploadData'
        })
      );
      expect(element.querySelector('.flash-alert.error').innerText)
        .to.equal('Your shapefile archive is incomplete. It must contain a .dbf, .shp, and .prj file for every layer. Expected it to contain the following files, which were actually missing: SIGNIFICANT_ECOLOGICAL_AREA_(SEA).shp.');
    });

    it('dispatches the function for loading a file when the input of the fileUpload changes', () => {
      const spy = sinon.spy();
      const element = renderComponent(view({onFileUploadAction: spy, fileUpload: {}, operation: 'UploadData'}));
      const fileInput = element.querySelector('input[type="file"]');
      TestUtils.Simulate.change(fileInput, {target: {files: ['afile'] }});
      expect(spy.callCount).to.equal(1);
    })

    it('does not dispatch the function for loading a file when the input of the fileUpload changes to no file', () => {
      const spy = sinon.spy();
      const element = renderComponent(view({onFileUploadAction: spy, fileUpload: {}, operation: 'UploadData'}));
      const fileInput = element.querySelector('input[type="file"]');
      TestUtils.Simulate.change(fileInput, {target: {files: [] }});
      expect(spy.callCount).to.equal(0);
    })
  });
});
