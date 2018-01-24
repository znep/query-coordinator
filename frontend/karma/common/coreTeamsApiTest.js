import { assert, expect } from 'chai';
import fetchMock from 'fetch-mock';
import serverConfig from './mock_server_config';

import coreTeamsApi from 'core-teams-api';

describe('coreTeamsApi', () => {
  describe('addTeamMember', () => {
    it('makes the appropriate call', done => {
      const name = 'addTeamMember';
      fetchMock.post('/api/teams/wizz-ards/members/wizz-ard1?role=member', {}, { name });
      coreTeamsApi
        .addTeamMember('wizz-ards', 'wizz-ard1', 'member')
        .then(() => {
          const [ignored, { headers }] = fetchMock.lastCall(name);
          expect(headers['X-CSRF-Token']).to.eql(serverConfig.csrfToken);
          expect(headers['X-App-Token']).to.eql(serverConfig.appToken);
          done();
        })
        .catch(err => {
          console.error(err);
          done(err);
        });
    });
  });

  describe('createTeam', () => {
    it('makes the appropriate call', done => {
      const name = 'createTeam';
      const payload = { screenName: 'Wizards', description: 'A group of magically inclined individuals' };
      fetchMock.post('/api/teams', {}, { name });
      coreTeamsApi
        .createTeam(payload)
        .then(() => {
          const [ignored, { body, headers }] = fetchMock.lastCall(name);
          expect(JSON.parse(body)).to.eql(payload);
          expect(headers['X-CSRF-Token']).to.eql(serverConfig.csrfToken);
          expect(headers['X-App-Token']).to.eql(serverConfig.appToken);
          done();
        })
        .catch(err => {
          console.error(err);
          done(err);
        });
    });
  });

  describe('deleteTeam', () => {
    it('makes the appropriate call', done => {
      const name = 'deleteTeam';
      fetchMock.delete('/api/teams/wizz-ards', {}, { name });
      coreTeamsApi
        .deleteTeam('wizz-ards')
        .then(() => {
          const [ignored, { headers }] = fetchMock.lastCall(name);
          expect(headers['X-CSRF-Token']).to.eql(serverConfig.csrfToken);
          expect(headers['X-App-Token']).to.eql(serverConfig.appToken);
          done();
        })
        .catch(err => {
          console.error(err);
          done(err);
        });
    });
  });

  describe('getAllTeams', () => {
    it('makes the appropriate call', done => {
      const name = 'getAllTeams';
      fetchMock.get('/api/teams?limit=10&page=1', {}, { name });
      coreTeamsApi
        .getAllTeams(10, 1)
        .then(() => {
          const [ignored, { headers }] = fetchMock.lastCall(name);
          expect(headers['X-CSRF-Token']).to.eql(serverConfig.csrfToken);
          expect(headers['X-App-Token']).to.eql(serverConfig.appToken);
          done();
        })
        .catch(err => {
          console.error(err);
          done(err);
        });
    });
  });

  describe('getRoles', () => {
    it('makes the appropriate call', done => {
      const name = 'getRoles';
      fetchMock.get('/api/teams?method=roles', {}, { name });
      coreTeamsApi
        .getRoles()
        .then(() => {
          const [ignored, { headers }] = fetchMock.lastCall(name);
          expect(headers['X-CSRF-Token']).to.eql(serverConfig.csrfToken);
          expect(headers['X-App-Token']).to.eql(serverConfig.appToken);
          done();
        })
        .catch(err => {
          console.error(err);
          done(err);
        });
    });
  });

  describe('getTeam', () => {
    it('makes the appropriate call', done => {
      const name = 'getTeam';
      fetchMock.get('/api/teams/wizz-ards', {}, { name });
      coreTeamsApi
        .getTeam('wizz-ards')
        .then(() => {
          const [ignored, { headers }] = fetchMock.lastCall(name);
          expect(headers['X-CSRF-Token']).to.eql(serverConfig.csrfToken);
          expect(headers['X-App-Token']).to.eql(serverConfig.appToken);
          done();
        })
        .catch(err => {
          console.error(err);
          done(err);
        });
    });
  });

  describe('getTeamMembers', () => {
    it('makes the appropriate call', done => {
      const name = 'getTeamMembers';
      fetchMock.get('/api/teams/wizz-ards/members', {}, { name });
      coreTeamsApi
        .getTeamMembers('wizz-ards')
        .then(() => {
          const [ignored, { headers }] = fetchMock.lastCall(name);
          expect(headers['X-CSRF-Token']).to.eql(serverConfig.csrfToken);
          expect(headers['X-App-Token']).to.eql(serverConfig.appToken);
          done();
        })
        .catch(err => {
          console.error(err);
          done(err);
        });
    });
  });

  describe('removeTeamMember', () => {
    it('makes the appropriate call', done => {
      const name = 'removeTeamMember';
      fetchMock.delete('/api/teams/wizz-ards/members/wizz-ard1', {}, { name });
      coreTeamsApi
        .removeTeamMember('wizz-ards', 'wizz-ard1')
        .then(() => {
          const [ignored, { headers }] = fetchMock.lastCall(name);
          expect(headers['X-CSRF-Token']).to.eql(serverConfig.csrfToken);
          expect(headers['X-App-Token']).to.eql(serverConfig.appToken);
          done();
        })
        .catch(err => {
          console.error(err);
          done(err);
        });
    });
  });

  describe('updateTeam', () => {
    it('makes the appropriate call', done => {
      const name = 'updateTeam';
      const payload = { screenName: 'Thieves', description: 'Sneaky individuals of dubious morals' };
      fetchMock.put('/api/teams/wizz-ards', {}, { name });
      coreTeamsApi
        .updateTeam('wizz-ards', payload)
        .then(() => {
          const [ignored, { body, headers }] = fetchMock.lastCall(name);
          expect(JSON.parse(body)).to.eql(payload);
          expect(headers['X-CSRF-Token']).to.eql(serverConfig.csrfToken);
          expect(headers['X-App-Token']).to.eql(serverConfig.appToken);
          done();
        })
        .catch(err => {
          console.error(err);
          done(err);
        });
    });
  });

  describe('updateTeamMember', () => {
    it('makes the appropriate call', done => {
      const name = 'updateTeamMember';
      fetchMock.put('/api/teams/wizz-ards/members/wizz-ard1?role=member', {}, { name });
      coreTeamsApi
        .updateTeamMember('wizz-ards', 'wizz-ard1', 'member')
        .then(() => {
          const [ignored, { headers }] = fetchMock.lastCall(name);
          expect(headers['X-CSRF-Token']).to.eql(serverConfig.csrfToken);
          expect(headers['X-App-Token']).to.eql(serverConfig.appToken);
          done();
        })
        .catch(err => {
          console.error(err);
          done(err);
        });
    });
  });
});
