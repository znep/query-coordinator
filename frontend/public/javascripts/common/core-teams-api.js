import { DefaultApiFp as apiFactory } from './generated-core-teams-api';
import { csrfToken, appToken } from 'common/http';

const wrappedFetch = (url, options) => fetch(url, Object.assign({ credentials: 'same-origin' }, options));
const api = apiFactory();

/**
 * Add a team member
 * @param {string} teamId The &#x60;Team&#x60; identifier (4x4)
 * @param {string} userId The &#x60;User&#x60; identifier (4x4)
 * @param {string} role The &#x60;Role&#x60; identifier
 * @param {*} [options] Override http request option.
 * @throws {RequiredError}
 */
export const addTeamMember = (teamId, userId, role, options) =>
  api.addTeamMember(teamId, userId, appToken(), role, csrfToken(), options)(wrappedFetch, '/api');

/**
 * Post a new `Team` for this domain.
 * @param {object} body
 * @param {string} body.screenName
 * @param {string} body.description
 * @param {*} [options] Override http request option.
 * @throws {RequiredError}
 */
export const createTeam = (body, options) =>
  api.createTeam(appToken(), body, csrfToken(), options)(wrappedFetch, '/api');

/**
 * Delete a specific `Team` object for the domain.
 * @param {string} teamId The &#x60;Team&#x60; identifier (4x4)
 * @param {*} [options] Override http request option.
 * @throws {RequiredError}
 */
export const deleteTeam = (teamId, options) =>
  api.deleteTeam(teamId, appToken(), csrfToken(), options)(wrappedFetch, '/api');

/**
 * Get all teams
 * @param {number} limit The number of users on a page
 * @param {number} page The page of users you are requesting
 * @param {*} [options] Override http request option.
 * @throws {RequiredError}
 */
export const getAllTeams = (limit, page, options) =>
  api.getAllTeams(appToken(), limit, page, csrfToken(), options)(wrappedFetch, '/api');

/**
 * Get the available team roles
 * @param {*} [options] Override http request option.
 * @throws {RequiredError}
 */
export const getRoles = options => api.getRoles(appToken(), csrfToken(), options)(wrappedFetch, '/api');

/**
 * Get a specific `Team` object for the domain.
 * @param {string} teamId The &#x60;Team&#x60; identifier (4x4)
 * @param {*} [options] Override http request option.
 * @throws {RequiredError}
 */
export const getTeam = (teamId, options) =>
  api.getTeam(teamId, appToken(), csrfToken(), options)(wrappedFetch, '/api');

/**
 * Get members of the given team
 * @param {string} teamId The &#x60;Team&#x60; identifier (4x4)
 * @param {*} [options] Override http request option.
 * @throws {RequiredError}
 */
export const getTeamMembers = (teamId, options) =>
  api.getTeamMembers(teamId, appToken(), csrfToken(), options)(wrappedFetch, '/api');

/**
 * Remove team member
 * @param {string} teamId The &#x60;Team&#x60; identifier (4x4)
 * @param {string} userId The &#x60;User&#x60; identifier (4x4)
 * @param {*} [options] Override http request option.
 * @throws {RequiredError}
 */
export const removeTeamMember = (teamId, userId, options) => {
  try {
    return api.removeTeamMember(teamId, userId, appToken(), csrfToken(), options)(wrappedFetch, '/api');
  } catch (error) {
    if (error instanceof SyntaxError) { return; } // No JSON response is returned, which causes an error
    throw error;
  }
};

/**
 * Update a specific `Team` object for the domain.
 * @param {string} teamId The &#x60;Team&#x60; identifier (4x4)
 * @param {object} body
 * @param {string} body.screenName
 * @param {string} body.description
 * @param {*} [options] Override http request option.
 * @throws {RequiredError}
 */
export const updateTeam = (teamId, body, options) =>
  api.updateTeam(teamId, appToken(), body, csrfToken(), options)(wrappedFetch, '/api');

/**
 * Update the team role of a member
 * @param {string} teamId The &#x60;Team&#x60; identifier (4x4)
 * @param {string} userId The &#x60;User&#x60; identifier (4x4)
 * @param {string} role The &#x60;Role&#x60; identifier
 * @param {*} [options] Override http request option.
 * @throws {RequiredError}
 */
export const updateTeamMember = (teamId, userId, role, options) =>
  api.updateTeamMember(teamId, userId, appToken(), role, csrfToken(), options)(wrappedFetch, '/api');

export default {
  addTeamMember,
  createTeam,
  deleteTeam,
  getAllTeams,
  getRoles,
  getTeam,
  getTeamMembers,
  removeTeamMember,
  updateTeam,
  updateTeamMember
};
