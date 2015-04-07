// TODO. These tests are not currently being used, the dependencies were breaking other tests.

// $(function(){
//   'use strict';

//   describe('datasetShowHelpers', function() {

//     beforeEach(function() {
//       $.cookies = {
//         get: function(arg) {
//           return arg;
//         }
//       };
//       $.t = function(arg) {
//         return arg;
//       }
//     });

//     it('should not throw exception on page load', function() {
//       expect(blist !== null &&
//         typeof blist === 'object' &&
//         blist.currentUser !== null &&
//         blist.dataset !== null &&
//         blist.feature_flags !== null
//       ).to.be.true;

//       expect(datasetShowHelpers !== null &&
//         typeof datasetShowHelpers === 'object' &&
//         datasetShowHelpers.canUpdateMetadata !== null &&
//         datasetShowHelpers.getNewUXLinkParams !== null &&
//         datasetShowHelpers.getNewUXLinkHref !== null &&
//         datasetShowHelpers.createNewUXLink !== null
//       ).to.be.true;
//     });

//     it('should be able to load the parameters from getNewUXLinkParams', function() {
//       $.extend(blist, {
//         currentUserId: 'Bob admin',
//         currentUser: {
//           flags: ['admin'],
//           roleName: 'administrator'
//         },
//         dataset: {
//           newBackend: true,
//           id: '1234-5678',
//           owner: {
//             id: 'Bob admin'
//           }
//         },
//         feature_flags: {
//           enable_newux_bootstrap_link: true,
//           metadata_transition_phase: 3,
//           exit_tech_preview: true
//         }
//       });
//       var params = datasetShowHelpers.getNewUXLinkParams();
//       expect(typeof params).to.equal('object');
//       expect(params.canUpdateMetadata !== null).to.be.true;
//       expect(params.newBackendPage !== null).to.be.true;
//       expect(params.exitTechPreview !== null).to.be.true;
//       expect(params.blistDatasetId !== null).to.be.true;
//       expect(params.metadataTransitionPhase !== null).to.be.true;
//     });

//     it('should create a newUX link for an administrator on new backend', function() {
//       $.extend(blist, {
//         currentUserId: 'Bob admin',
//         currentUser: {
//           flags: ['admin'],
//           roleName: 'administrator'
//         },
//         dataset: {
//           newBackend: true,
//           id: '1234-5678',
//           owner: {
//             id: 'Bob admin'
//           }
//         },
//         feature_flags: {
//           enable_newux_bootstrap_link: true,
//           metadata_transition_phase: 3,
//           exit_tech_preview: true
//         }
//       });
//       var params = datasetShowHelpers.getNewUXLinkParams();
//       var href = datasetShowHelpers.getNewUXLinkHref(params);
//       expect(href).to.equal('/view/bootstrap/1234-5678')
//       expect(datasetShowHelpers.createNewUXLink(params, href)).to.be.true;
//     });

//     it('should create a newUX link for an administrator on old backend', function() {
//       $.extend(blist, {
//         currentUserId: 'Bob admin',
//         currentUser: {
//           flags: ['admin'],
//           roleName: 'administrator'
//         },
//         dataset: {
//           newBackend: false,
//           id: '1234-5678',
//           owner: {
//             id: 'Bob admin'
//           }
//         },
//         feature_flags: {
//           enable_newux_bootstrap_link: true,
//           metadata_transition_phase: 3,
//           exit_tech_preview: true
//         }
//       });
//       var params = $.extend(datasetShowHelpers.getNewUXLinkParams(), {
//         testingUrl: 'fake-newBackend-link'
//       });
//       var href = datasetShowHelpers.getNewUXLinkHref(params);
//       expect(href).to.equal('fake-newBackend-link')
//       expect(datasetShowHelpers.createNewUXLink(params, href)).to.be.true;
//     });

//     it('should create newUX link for a public user on a public dataset on old backend', function() {
//       $.extend(blist, {
//         dataset: {
//           newBackend: false,
//           id: '1234-5678',
//           owner: {
//             id: 'Tom public'
//           }
//         },
//         feature_flags: {
//           enable_newux_bootstrap_link: true,
//           metadata_transition_phase: 3,
//           exit_tech_preview: true
//         },
//         currentUser: {},
//         currentUserId: null
//       });
//       expect(datasetShowHelpers.canUpdateMetadata()).to.be.false;
//       var params = $.extend(datasetShowHelpers.getNewUXLinkParams(), {
//         testingUrl: 'fake-newBackend-link'
//       });
//       var href = datasetShowHelpers.getNewUXLinkHref(params);
//       expect(datasetShowHelpers.createNewUXLink(params, href)).to.be.true;
//     });

//     it('should create newUX link for a public user on a public dataset on new backend', function() {
//       $.extend(blist, {
//         dataset: {
//           newBackend: true,
//           id: '1234-5678',
//           owner: {
//             id: 'Tom public'
//           }
//         },
//         feature_flags: {
//           enable_newux_bootstrap_link: true,
//           metadata_transition_phase: 3,
//           exit_tech_preview: true
//         },
//         currentUser: {},
//         currentUserId: null
//       });
//       expect(datasetShowHelpers.canUpdateMetadata()).to.be.false;
//       var params = datasetShowHelpers.getNewUXLinkParams();
//       var href = datasetShowHelpers.getNewUXLinkHref(params);
//       expect(datasetShowHelpers.createNewUXLink(params, href)).to.be.true;
//     });

//     it('should not create a newUX link if exit_tech_preview and enable_newux_bootstrap_link are false', function() {
//       $.extend(blist, {
//         dataset: {
//           newBackend: true,
//           id: '1234-5678',
//           owner: {
//             id: 'Tom public'
//           }
//         },
//         feature_flags: {
//           enable_newux_bootstrap_link: false,
//           metadata_transition_phase: 3,
//           exit_tech_preview: false
//         },
//         currentUser: {},
//         currentUserId: null
//       });
//       var params = datasetShowHelpers.getNewUXLinkParams();
//       var href = datasetShowHelpers.getNewUXLinkHref(params);
//       expect(datasetShowHelpers.createNewUXLink(params, href)).to.be.false;
//     });

//   });
// }());