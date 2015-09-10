require 'rails_helper'

RSpec.describe StoryPublisher do

  let(:draft_story) { FactoryGirl.create(:draft_story) }
  let(:user) { mock_valid_user }
  let(:params) do
    {
      uid: draft_story.uid,
      digest: draft_story.digest
    }
  end
  let(:core_request_headers) do
    {
      'X-Socrata-Host' => 'test-domain.com',
      'X-CSRF-Token' => 'a-token-of-our-appreciation',
      'Cookie' => 'cookies are sometimes food'
    }
  end

  subject { StoryPublisher.new(user, params, core_request_headers) }

  describe '#initialize' do

    it 'initializes with user, story params, and headers for core' do
      expect {
        StoryPublisher.new(mock_valid_user, params, core_request_headers)
      }.to_not raise_error
    end

    it 'raises without core_request_headers' do
      expect {
        StoryPublisher.new(mock_valid_user, params)
      }.to raise_error(ArgumentError, /2 for 3/)
    end

    it 'raises with empty core_request_headers' do
      expect {
        StoryPublisher.new(mock_valid_user, params, {})
      }.to raise_error(ArgumentError, /Missing core request headers/)
    end

    it 'raises without params' do
      expect {
        StoryPublisher.new(mock_valid_user)
      }.to raise_error(ArgumentError, /1 for 3/)
    end

    it 'raises without user' do
      expect {
        StoryPublisher.new
      }.to raise_error(ArgumentError, /0 for 3/)
    end

    it 'raises without user id' do
      expect {
        StoryPublisher.new(mock_valid_user.except('id'), params, core_request_headers)
      }.to raise_error(ArgumentError, /User is not valid/)
    end

    it 'creates initializes new published story from draft story' do
      expect(subject.story).to be_a(PublishedStory)
      expect(subject.story).to_not be_persisted
      expect(subject.story.uid).to eq(params[:uid])
      expect(subject.story.created_by).to eq(user['id'])
    end

    context 'when draft story does not exist' do
      let(:params) do
        {
          uid: 'fake-uid1',
          digest: 'fakedigest'
        }
      end

      it 'raises without existing draft story' do
        expect {
          StoryPublisher.new(mock_valid_user, params, core_request_headers)
        }.to raise_error(/Could not find a draft story with matching uid and digest./)
      end
    end

  end

  describe '#publish' do

    let(:mock_permissions_updater) { spy('permissions_updater') }

    before do
      allow(PermissionsUpdater).to receive(:new).and_return(mock_permissions_updater)
    end

    context 'when published story is valid' do
      it 'returns true' do
        expect(subject.publish).to eq(true)
      end

      it 'creates a published story' do
        expect { subject.publish }.to change { PublishedStory.count }.by(1)
      end

      it 'calls PermissionsUpdater service object' do
        expect(PermissionsUpdater).to receive(:new).with(user, draft_story.uid, core_request_headers)
        expect(mock_permissions_updater).to receive(:update_permissions).with(is_public: true)
        subject.publish
      end

      context 'when updating permissions raises' do
        before do
          allow(mock_permissions_updater).to receive(:update_permissions).and_raise
        end

        it 'notifies airbrake' do
          expect(AirbrakeNotifier).to receive(:report_error)
          subject.publish
        end

        it 'does not create published story' do
          expect { subject.publish }.to_not change { PublishedStory.count }
        end

        it 'returns false' do
          expect(subject.publish).to eq(false)
        end
      end
    end

    context 'when published story is invalid' do
      before do
        draft_story.update_column(:uid, '')
      end

      it 'returns false' do
        expect(subject.publish).to eq(false)
      end

      it 'does not create a published story' do
        expect { subject.publish }.to_not change { PublishedStory.count }
      end

      it 'does not call PermissionsUpdater' do
        expect(PermissionsUpdater).to_not receive(:new)
        subject.publish
      end
    end

  end
end
