import { expect, assert } from 'chai';
const angular = require('angular');

describe('UserSearchService', function() {
  'use strict';

  var $httpBackend;
  var UserSearch;
  var USER_SEARCH_URL_MATCHER = new RegExp('/cetera/users\\??');

  var USERS = [
    generateUser('user-0000', 'Who'),
    generateUser('user-0001', 'Match 1'),
    generateUser('user-0002', 'What'),
    generateUser('user-0003', 'Match 2'),
    generateUser('user-0004', 'Match 3'),
    generateUser('user-0005', 'I Don\'t Know')
  ];

  function generateUser(id, name) {
    // A subset of properties.
    return {
      email: name,
      id: id,
      screen_name: name
    };
  }

  beforeEach(angular.mock.module('dataCards'));
  beforeEach(inject(function($injector) {
    $httpBackend = $injector.get('$httpBackend');
    UserSearch = $injector.get('UserSearchService');
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('when a search string is not provided', function() {
    it('returns an empty array', function(done) {
      var matchedUsers = [];
      $httpBackend.expectGET(USER_SEARCH_URL_MATCHER).respond(200, matchedUsers);
      UserSearch.find().then((users) => {
        assert.deepEqual(users, matchedUsers);
        done();
      });
      $httpBackend.flush();
    });
  });

  describe('when a search string is provided', function() {
    describe('and any matches are found', function() {
      it('returns an array of results', function(done) {
        var matchedUsers = [USERS[1], USERS[3], USERS[4]].map(function(user) {
          return _.merge(user, { displayName: user.screen_name });
        });
        $httpBackend.expectGET(USER_SEARCH_URL_MATCHER).respond(200, matchedUsers);
        UserSearch.find('Match').then((users) => {
          assert.deepEqual(users, matchedUsers);
          done();
        });
        $httpBackend.flush();
      });
    });

    describe('and no matches are found', function() {
      it('returns an empty array', function(done) {
        var matchedUsers = [];
        $httpBackend.expectGET(USER_SEARCH_URL_MATCHER).respond(200, matchedUsers);
        UserSearch.find('Miss').then((users) => {
          assert.deepEqual(users, matchedUsers);
          done();
        });
        $httpBackend.flush();
      });
    });
  });

  describe('when the backend throws an error', function() {
    it('provides an error response', function(done) {
      $httpBackend.expectGET(USER_SEARCH_URL_MATCHER).respond(500, {error: true});
      UserSearch.find('crashy crashy').catch((error) => {
        assert.isNull(error);
        done();
      });
      $httpBackend.flush();
    });
  });

});
