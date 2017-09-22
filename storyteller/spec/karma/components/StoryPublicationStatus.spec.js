import _ from 'lodash';
import moment from 'moment-timezone';
import { Simulate } from 'react-dom/test-utils';

import renderComponent from '../renderComponent';
import I18nMocker from '../I18nMocker';
import StoryPublicationStatus, {__RewireAPI__ as StoryPublicationStatusAPI} from 'editor/components/StoryPublicationStatus';

describe('StoryPublicationStatus', () => {
  let component;
  let storyPermissionsManagerMocker;

  let makePublicStub;
  let makePublicStubPromise;
  let makePublicStubPromiseResolve;
  let makePublicStubPromiseReject;

  let makePrivateStub;
  let makePrivateStubPromise;
  let makePrivateStubPromiseResolve;
  let makePrivateStubPromiseReject;

  const storyUpdatedAt = '2010-03-10';

  function createStoryPermissionsManagerMocker() {
    beforeEach(() => {
      makePublicStubPromise = new Promise((resolve, reject) => {
        makePublicStubPromiseResolve = resolve;
        makePublicStubPromiseReject = reject;
      });
      makePublicStub = sinon.stub();
      makePublicStub.returns(makePublicStubPromise);

      makePrivateStubPromise = new Promise((resolve, reject) => {
        makePrivateStubPromiseResolve = resolve;
        makePrivateStubPromiseReject = reject;
      });
      makePrivateStub = sinon.stub();
      makePrivateStub.returns(makePrivateStubPromise);

      StoryPublicationStatusAPI.__Rewire__('storyPermissionsManager', {
        makePublic: makePublicStub,
        makePrivate: makePrivateStub
      });
    });

    afterEach(() => {
      StoryPublicationStatusAPI.__ResetDependency__('storyPermissionsManager', storyPermissionsManagerMocker);
    });
  }

  function createStoryStoreMocker(isPublic, isDraftUnpublished) {
    beforeEach(() => {
      StoryPublicationStatusAPI.__Rewire__('storyStore', {
        getStoryUpdatedAt: () => storyUpdatedAt,
        doesStoryExist: _.constant(true),
        isStoryPublic: () => isPublic,
        isDraftUnpublished: () => isDraftUnpublished
      });
    });

    afterEach(() => {
      StoryPublicationStatusAPI.__ResetDependency__('storyStore');
    });
  }

  function createStoryPublicationStatus() {
    beforeEach(() => {
      component = renderComponent(StoryPublicationStatus);
    });
  }

  beforeEach(() => {
    StoryPublicationStatusAPI.__Rewire__('I18n', I18nMocker);
  });

  afterEach(() => {
    StoryPublicationStatusAPI.__ResetDependency__('I18n');
  });

  describe('render', () => {
    function rendersMakePrivateButton() {
      it('renders a "Make Private" button', () => {
        const text = component.querySelector('.flannel-actions button').textContent;
        expect(text).to.contain('make_story_private');
      });
    }

    function rendersDraftAndUnpublished() {
      it('renders a draft status', () => {
        const text = component.querySelector('.panel-btn').textContent;
        expect(text).to.contain('draft');
      });

      it('renders an unpublished icon', () => {
        const iconElement = component.querySelector('.story-publication-status-icon.unpublished');
        expect(iconElement).to.exist;
      });
    }

    describe('regardless of story state', () => {
      createStoryStoreMocker(true, true);
      createStoryPublicationStatus();

      it('renders last saved header text', () => {
        const text = component.querySelector('h5 strong').textContent;
        expect(text).to.contain('saved');
      });

      it('renders last saved time', () => {
        const text = component.querySelector('h5 span').textContent;
        expect(text).to.equal(moment(storyUpdatedAt).calendar().toString());
      });
    });

    describe('when the story is private and unpublished', () => {
      createStoryStoreMocker(false, true);
      createStoryPublicationStatus();

      rendersDraftAndUnpublished();

      it('renders a "Make Story Public" button', () => {
        const text = component.querySelector('.btn-publish').textContent;
        expect(text).to.contain('make_story_public');
      });

      it('renders a "Can be shared publicly" message', () => {
        const text = component.querySelector('.alert').textContent;
        expect(text).to.contain('can_be_shared_publicly');
      });

      it('does not render a "Make Private" button', () => {
        expect(component.querySelector('.flannel-actions')).to.not.exist;
      });
    });

    describe('when the story is public and unpublished', () => {
      createStoryStoreMocker(true, true);
      createStoryPublicationStatus();

      rendersDraftAndUnpublished();
      rendersMakePrivateButton();

      it('renders an "Update Public Version" button', () => {
        const text = component.querySelector('.btn-publish').textContent;
        expect(text).to.contain('update_public_version');
      });

      it('renders a "Previously published..." message', () => {
        const text = component.querySelector('.alert').textContent;
        expect(text).to.contain('previously_published');
      });
    });

    describe('when the story is public and published', () => {
      createStoryStoreMocker(true, false);
      createStoryPublicationStatus();

      rendersMakePrivateButton();

      it('renders a "Published" status', () => {
        const text = component.querySelector('.panel-btn').textContent;
        expect(text).to.contain('published');
      });

      it('renders a published icon', () => {
        const iconElement = component.querySelector('.story-publication-status-icon.published');
        expect(iconElement).to.exist;
      });

      it('renders a disabled "Update Public Version" button', () => {
        const buttonElement = component.querySelector('.btn-publish');
        expect(buttonElement.textContent).to.contain('update_public_version');
        expect(buttonElement.disabled).to.be.true;
      });

      it('renders a "Story has been published..." message', () => {
        const text = component.querySelector('.alert').textContent;
        expect(text).to.contain('has_been_published');
      });
    });
  });

  describe('events', () => {
    describe('when clicking the status button', () => {
      createStoryStoreMocker(true, true);
      createStoryPublicationStatus();

      it('toggles the flannel visibility', () => {
        Simulate.click(component.querySelector('.panel-btn'));
        expect(component.querySelector('.flannel.flannel-hidden')).to.not.exist;

        Simulate.click(component.querySelector('.panel-btn'));
        expect(component.querySelector('.flannel.flannel-hidden')).to.exist;
      });
    });

    function behavesLikePublishingStory() {
      beforeEach(() => {
        Simulate.click(component.querySelector('.btn-publish'));
      });

      it('calls storyPermissionsManager.makePublic', () => {
        expect(makePublicStub.called).to.be.true;
        expect(makePublicStub.returned(makePublicStubPromise)).to.be.true;
      });

      it('enables loading spinner', () => {
        expect(component.querySelector('.btn-publish.btn-busy')).to.exist;
      });

      describe('when the request succeeds', () => {
        it('stops loading', (done) => {
          makePublicStubPromiseResolve();

          _.defer(() => {
            expect(component.querySelector('.btn-publish.btn-busy')).to.not.exist;
            done();
          });
        });
      });

      describe('when the request fails', () => {
        it('stops loading and shows an error', (done) => {
          makePublicStubPromiseReject();

          _.defer(() => {
            expect(component.querySelector('.btn-publish.btn-busy')).to.not.exist;
            expect(component.querySelector('.alert.error')).to.exist;
            done();
          });
        });
      });
    }

    describe('when the story is private and unpublished', () => {
      createStoryPermissionsManagerMocker();
      createStoryStoreMocker(false, true);
      createStoryPublicationStatus();

      describe('when clicking the "Make Story Public" button', () => {
        behavesLikePublishingStory();
      });
    });

    describe('when the story is public and unpublished', () => {
      createStoryPermissionsManagerMocker();
      createStoryStoreMocker(true, true);
      createStoryPublicationStatus();

      describe('when clicking the "Update Public Version" button', () => {
        behavesLikePublishingStory();
      });
    });

    describe('when the story is public', () => {
      createStoryPermissionsManagerMocker();
      createStoryStoreMocker(true, true);
      createStoryPublicationStatus();

      describe('when clicking the "Make Private" button', () => {
        beforeEach(() => {
          Simulate.click(component.querySelector('.flannel-actions button'));
        });

        it('calls storyPermissionsManager.makePrivate', () => {
          expect(makePrivateStub.called).to.be.true;
          expect(makePrivateStub.returned(makePrivateStubPromise)).to.be.true;
        });

        it('enables loading spinner', () => {
          expect(component.querySelector('.btn-publish.btn-busy')).to.exist;
        });

        describe('when the request succeeds', () => {
          it('stops loading', (done) => {
            makePrivateStubPromiseResolve();

            _.defer(() => {
              expect(component.querySelector('.btn-publish.btn-busy')).to.not.exist;
              done();
            });
          });
        });

        describe('when the request fails', () => {
          it('stops loading and shows and error', (done) => {
            makePrivateStubPromiseReject();

            _.defer(() => {
              expect(component.querySelector('.btn-publish.btn-busy')).to.not.exist;
              expect(component.querySelector('.alert.error')).to.exist;
              done();
            });
          });
        });
      });
    });
  });
});

