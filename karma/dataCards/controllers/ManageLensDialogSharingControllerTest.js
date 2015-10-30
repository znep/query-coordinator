describe('ManageLensDialogSharingController', function() {
  'use strict';

  var $rootScope;
  var $controller;
  var $httpBackend;
  var Mockumentary;

  var $dialogScope;
  var $scope;

  var removeGrantUrl = /\/api\/views\/page-page\/grants\/i.*/;
  var addGrantUrl = /\/api\/views\/page-page\/grants.*/;
  var defaultShares = [
    { type: 'Contributor', inherited: true, member_name: 'email1@example.com', member_id: 'four-ruof' },
    { type: 'Contributor', inherited: true, member_name: 'email2@example.com', member_id: 'email2@example.com' },
    { type: 'Contributor', inherited: false, member_name: 'email3@example.com', member_id: 'email3@example.com' },
    { type: 'Owner', inherited: false, member_name: 'email4@example.com', member_id: 'user-whyy' }
  ];

  var newShareTemplate = {
    newShare: true,
    link: null,
    name: 'bob@example.com',
    type: 'viewer',
    pendingRemoval: false
  };

  beforeEach(module('dataCards'));

  beforeEach(inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    $controller = $injector.get('$controller');
    $httpBackend = $injector.get('$httpBackend');
    Mockumentary = $injector.get('Mockumentary');
  }));

  beforeEach(function() {
    $httpBackend.when('PUT', removeGrantUrl).respond({});
    $httpBackend.when('POST', addGrantUrl).respond({});
  });

  beforeEach(function() {
    window.currentUser = {
      id: 'pliz-whyy'
    };
  });

  function createController(pageData) {
    $dialogScope = $rootScope.$new();
    $dialogScope.page = Mockumentary.createPage(pageData);
    $dialogScope.shouldShowSharingSection = true;
    $controller('ManageLensDialogController', { $scope: $dialogScope });
    $scope = $dialogScope.$new();
    $controller('ManageLensDialogSharingController', { $scope: $scope });
  }

  describe('inherited shares', function() {
    it('adds all inherited shares to scope.inheritedShares', function() {
      createController({ shares: defaultShares });

      expect($scope.inheritedShares).to.be.an.array;
      expect($scope.inheritedShares).to.have.length(2);
      expect(_.pluck($scope.inheritedShares, 'name')).to.deep.equal(['email1@example.com', 'email2@example.com']);
    });

    it('sets showInheritedSharingSection to false if there are no inherited shares', function() {
      createController({ shares: [] });
      expect($scope.showInheritedSharingSection).to.equal(false);
    });
  });

  describe('shares', function() {
    it('excludes inherited shares', function() {
      createController({ shares: defaultShares });

      expect($scope.shares).to.be.an.array;
      expect($scope.shares).to.have.length(2);
      expect(_.pluck($scope.shares, 'name')).to.deep.equal(['email4@example.com', 'email3@example.com']);
    });
  });

  describe('togglePendingRemovalStatus', function() {
    it('toggles the pendingRemoval property on a share', function() {
      createController({ shares: defaultShares });

      expect($scope.shares[0].pendingRemoval).to.equal(false);
      $scope.toggleSharePendingRemovalStatus($scope.shares[0]);
      expect($scope.shares[0].pendingRemoval).to.equal(true);
    });
  });

  describe('hasChanges', function() {
    it('is true if there is at least one newShare', function() {
      createController({ shares: [] });

      expect($dialogScope.components.sharing.hasChanges).to.equal(false);

      $scope.newShares.shares[0] = {};
      $scope.$digest();

      expect($dialogScope.components.sharing.hasChanges).to.equal(true);
    });

    it('is true if a share is pendingRemoval', function() {
      createController({ shares: defaultShares });

      expect($dialogScope.components.sharing.hasChanges).to.equal(false);

      $scope.toggleSharePendingRemovalStatus($scope.shares[0]);
      $scope.$digest();

      expect($dialogScope.components.sharing.hasChanges).to.equal(true);
    });

    it('is true if a share has a type different from its initialType', function() {
      createController({ shares: defaultShares });

      expect($dialogScope.components.sharing.hasChanges).to.equal(false);

      $scope.shares[0].type = 'B-';
      $scope.$digest();

      expect($dialogScope.components.sharing.hasChanges).to.equal(true);
    });
  });

  describe('save', function() {
    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('requests that pendingRemoval shares be removed', function() {
      var getCookieStub = sinon.stub();

      getCookieStub.returns('CSRF-TOKEN');
      socrata.utils.getCookie = getCookieStub;
      createController({ shares: defaultShares });
      $scope.toggleSharePendingRemovalStatus($scope.shares[0]);

      $httpBackend.expectPUT(removeGrantUrl, {
        type: $scope.shares[0].type,
        userId: $scope.shares[0].userId
      });

      $dialogScope.components.sharing.save();
      $httpBackend.flush();
    });

    it('passes a 4x4 if the user has an account and an email otherwise', function() {
      createController({ shares: defaultShares });
      $scope.toggleSharePendingRemovalStatus($scope.shares[0]);
      $scope.toggleSharePendingRemovalStatus($scope.shares[1]);

      $httpBackend.expectPUT(removeGrantUrl, {
        type: $scope.shares[0].type,
        userId: $scope.shares[0].userId
      });

      $httpBackend.expectPUT(removeGrantUrl, {
        type: $scope.shares[1].type,
        userEmail: $scope.shares[1].name
      });

      $dialogScope.components.sharing.save();
      $httpBackend.flush();
    });

    it('removes and adds a user if their type has changed', function() {
      createController({ shares: defaultShares });
      $scope.shares[0].type = 'viewer';

      $httpBackend.expectPUT(removeGrantUrl, {
        type: $scope.shares[0].initialType,
        userId: $scope.shares[0].userId
      });

      $httpBackend.expectPOST(addGrantUrl, {
        type: $scope.shares[0].type,
        userId: $scope.shares[0].userId
      });

      $dialogScope.components.sharing.save();
      $httpBackend.flush();
    });

    it('requests that new shares be added with the specified optional message', function() {
      createController({ shares: defaultShares });
      var newShare = _.clone(newShareTemplate);
      $dialogScope.newShares.shares = [newShare];
      $dialogScope.newShares.message = 'Welcome, bro';

      $httpBackend.expectPOST(addGrantUrl, {
        type: newShare.type,
        userEmail: newShare.name,
        message: $dialogScope.newShares.message
      });

      $dialogScope.components.sharing.save();
      $httpBackend.flush();
    });
  });

  describe('postSave', function() {
    it('removes shares pending removal from the page model', function() {
      createController({ shares: defaultShares });
      $scope.toggleSharePendingRemovalStatus($scope.shares[0]);

      expect($scope.page.getCurrentValue('shares')).to.have.length(4); // also includes inherited shares

      $dialogScope.components.sharing.save();
      $dialogScope.components.sharing.postSave();

      expect($scope.page.getCurrentValue('shares')).to.have.length(3);
    });

    it('changes the type of shares in the page model', function() {
      createController({ shares: defaultShares });
      $scope.shares[0].type = 'viewer';
      $scope.shares[1].type = 'viewer';

      expect($scope.page.getCurrentValue('shares')[2].type).to.equal('Contributor');
      expect($scope.page.getCurrentValue('shares')[3].type).to.equal('Owner');

      $dialogScope.components.sharing.save();
      $dialogScope.components.sharing.postSave();

      expect($scope.page.getCurrentValue('shares')[2].type).to.equal('Viewer');
      expect($scope.page.getCurrentValue('shares')[3].type).to.equal('Viewer');
    });

    it('adds new shares to the page model if there are new shares', function() {
      createController({ shares: defaultShares });
      var newShare = _.clone(newShareTemplate);
      $dialogScope.newShares.shares = [newShare];

      expect($scope.page.getCurrentValue('shares')).to.have.length(4);

      $dialogScope.components.sharing.save();
      $dialogScope.components.sharing.postSave();

      expect($scope.page.getCurrentValue('shares')).to.have.length(5);
    });
  });
});
