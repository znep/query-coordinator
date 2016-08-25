import { withMockFetch } from '../asyncUtils';
import Promise from 'bluebird';

import * as SaveState from 'saveState';


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
