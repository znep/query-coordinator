import {
  initial,
  selectFile,
  fileUploadStart,
  fileUploadProgress,
  fileUploadAnalyzing,
  fileUploadComplete,
  fileUploadError,
  update,
  initialUploadProgress
} from 'components/uploadFile';

describe("uploadFile's reducer", () => {
  var state;

  beforeEach(() => {
    state = initial();
  });

  describe('FILE_UPLOAD_START', () => {
    it('reacts to file upload', () => {
      const result = update(state, fileUploadStart({
        name: 'test_name.csv'
      }));
      expect(result).to.deep.equal({
        type: 'UploadInProgress',
        fileName: 'test_name.csv',
        progress: {
          type: 'InProgress',
          percent: 0
        }
      });
    });
  });

  describe('FILE_UPLOAD_PROGRESS', () => {
    it('reacts to file upload progress event', () => {
      const result = update(state, fileUploadProgress(15));
      expect(result).to.deep.equal({
        type: 'UploadInProgress',
        progress: {
          type: 'InProgress',
          percent: 15
        }
      });
    });
  });

  const stateBefore = {
    type: 'UploadInProgress',
    progress: {
      type: 'InProgress',
      percent: 15
    }
  };

  describe('FILE_UPLOAD_ANALYZING', () => {
    it('reacts to file analyzing event', () => {
      const stateAfter = update(stateBefore, fileUploadAnalyzing());
      expect(stateAfter).to.deep.equal({
        type: 'UploadInProgress',
        progress: {
          type: 'Analyzing'
        }
      });
    });
  });

  describe('FILE_UPLOAD_COMPLETE',  () => {
    it('reacts to file upload complete', () => {
      const stateAfter = update(stateBefore, fileUploadComplete(
        "abceasyas123",
        "thisisfine"
      ));
      expect(stateAfter).to.deep.equal({
        type: 'UploadInProgress',
        progress: {
          type: 'Complete',
          fileId: 'abceasyas123',
          summary: 'thisisfine'
        }
      });
    });
  });

  describe('FILE_UPLOAD_ERROR', () => {
    it('reacts to file upload error', () => {
      const stateAfter = update(stateBefore, fileUploadError('oops'));
      expect(stateAfter).to.deep.equal({
        type: 'UploadInProgress',
        progress: {
          type: 'Failed',
          error: 'oops'
        }
      });
    });
  });

});
