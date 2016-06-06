import {
  updateCurrentPage,
  updateOperation,
  chooseOperation
} from 'wizard';

describe('updateCurrentPage', () => {

  it('sets currentPage to UploadFile when you choose UploadData', () => {
    const stateBefore = 'SelectType';
    const stateAfter = updateCurrentPage(stateBefore, chooseOperation('UploadData'));
    expect(stateAfter).to.equal('UploadFile');
  });

  it('sets currentPage to UploadFile when you choose UploadBlob', () => {
    const stateBefore = 'SelectType';
    const stateAfter = updateCurrentPage(stateBefore, chooseOperation('UploadBlob'));
    expect(stateAfter).to.equal('UploadFile');
  });

  it('sets currentPage to UploadFile when you choose UploadBlob', () => {
    const stateBefore = 'SelectType';
    const stateAfter = updateCurrentPage(stateBefore, chooseOperation('UploadBlob'));
    expect(stateAfter).to.equal('UploadFile');
  });

  it('sets currentPage to UploadFile when you choose UploadGeospatial', () => {
    const stateBefore = 'SelectType';
    const stateAfter = updateCurrentPage(stateBefore, chooseOperation('UploadGeospatial'));
    expect(stateAfter).to.equal('UploadFile');
  });

  it('sets currentPage to Metadata when you choose ConnectToEsri', () => {
    const stateBefore = 'SelectType';
    const stateAfter = updateCurrentPage(stateBefore, chooseOperation('ConnectToEsri'));
    expect(stateAfter).to.equal('Metadata');
  });

  it('sets currentPage to Metadata when you choose LinkToExternal', () => {
    const stateBefore = 'SelectType';
    const stateAfter = updateCurrentPage(stateBefore, chooseOperation('LinkToExternal'));
    expect(stateAfter).to.equal('Metadata');
  });

  it('sets currentPage to Metadata when you choose CreateFromScratch', () => {
    const stateBefore = 'SelectType';
    const stateAfter = updateCurrentPage(stateBefore, chooseOperation('CreateFromScratch'));
    expect(stateAfter).to.equal('Metadata');
  });

});

describe('updateOperation', () => {

  it('returns the operation given in the action', () => {
    const stateBefore = null;
    const stateAfter = updateOperation(stateBefore, chooseOperation('UploadData'));
    expect(stateAfter).to.equal('UploadData');
  });

});
