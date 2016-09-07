import { withMockFetch } from '../asyncUtils';

import * as SaveState from 'saveState';

import { fileUploadComplete  } from 'components/uploadFile';


describe('saveOperation', () => {

  it('saves the operation, returning an ImportSource object with the new version timestamp', (done) => {
    withMockFetch(
      (url, options, resolve, reject) => {
        expect(url).to.equal('/views/asdf-jklo/import_sources');
        expect(JSON.parse(options.body)).to.deep.equal({
          version: 123,
          importMode: 'UPLOAD_DATA'
        });
        resolve({
          status: 200,
          json: () => Promise.resolve({
            importMode: 'UPLOAD_DATA',
            version: 124
          })
        })
      },
      () => {
        SaveState.saveOperation('asdf-jklo', 123, 'UPLOAD_DATA').then((result) => {
          expect(result).to.deep.equal({
            importMode: 'UPLOAD_DATA',
            version: 124
          });
          done();
        });
      }
    );
  });

});

describe ("saveState's reducer", () => {
  it('it handles fileUploadComplete', () => {
    const result = SaveState.update(33, fileUploadComplete(
      'fake fileID',
      {},
      444
    ));
    expect(result).to.deep.equal(444)
  })
})
