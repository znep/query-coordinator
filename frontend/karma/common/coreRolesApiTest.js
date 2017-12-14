import { assert, expect } from 'chai';
import fetchMock from 'fetch-mock';
import serverConfig from './mock_server_config';

import coreRolesApi from 'core-roles-api';

describe('coreRolesApi', () => {

  describe('updateRole', () => {
    it('sends the appropriate headers', (done) => {
      const role = {
        'id': 8,
        'name': 'My Custom Role',
        'isDefault': false,
        'rights': ['manage_users', 'view_all_dataset_status_logs', 'feature_items', 'short_session', 'manage_spatial_lens']
      };

      fetchMock.put('/api/roles/1', role, { name: 'updateRole' });
      coreRolesApi.updateRole(1, role).
        then((response) => {
          expect(response).to.eql(role);
          const [ ignored, { headers } ] = fetchMock.lastCall('updateRole');
          expect(headers['X-CSRF-Token']).to.eql(serverConfig.csrfToken);
          expect(headers['X-App-Token']).to.eql(serverConfig.appToken);
          done();
        }).
        catch(err => { console.error(err); done(err); });
    });
  });
});
