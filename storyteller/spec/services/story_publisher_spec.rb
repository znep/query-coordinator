require 'rails_helper'

RSpec.describe StoryPublisher do

  let(:draft_story) { FactoryGirl.create(:draft_story) }
  let(:user) { mock_valid_user }
  let(:permissions_updater) { instance_double(CorePermissionsUpdater) }
  let(:params) do
    {
      uid: draft_story.uid,
      digest: draft_story.digest
    }
  end

  subject { StoryPublisher.new(user, permissions_updater, params) }

  describe '#initialize' do

    it 'initializes with user, story params, and a permissions updater' do
      expect {
        subject
      }.to_not raise_error
    end

    it 'raises without params' do
      expect {
        StoryPublisher.new(user, permissions_updater)
      }.to raise_error(ArgumentError, /given 2, expected \d/)
    end

    it 'raises without permissions_updater' do
      expect {
        StoryPublisher.new(user)
      }.to raise_error(ArgumentError, /given 1, expected \d/)
    end

    it 'raises without user' do
      expect {
        StoryPublisher.new
      }.to raise_error(ArgumentError, /given 0, expected \d/)
    end

    it 'raises without user id' do
      expect {
        StoryPublisher.new(user.except('id'), permissions_updater, params)
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
          subject
        }.to raise_error(/Could not find a draft story with matching uid and digest./)
      end
    end

  end

  describe '#publish' do

    before do
      allow(permissions_updater).to receive(:update_permissions).and_return(true)
    end

    context 'when published story is valid' do
      it 'returns true' do
        expect(subject.publish).to eq(true)
      end

      it 'creates a published story' do
        expect { subject.publish }.to change { PublishedStory.count }.by(1)
      end

      it 'calls PermissionsUpdater service object' do
        expect(permissions_updater).to receive(:update_permissions).with(is_public: true)
        subject.publish
      end

      context 'when updating permissions raises' do
        before do
          allow(permissions_updater).to receive(:update_permissions).and_raise
          allow(AirbrakeNotifier).to receive(:report_error)
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

      context 'when downloading Getty Images' do
        context 'when successful' do
          before do
            getty_images_downloader = double('getty_images_downloader', :download => nil)
            allow(GettyImagesDownloader).to receive(:new).and_return(getty_images_downloader)
          end

          it 'does not raise' do
            expect { subject.publish }.to_not raise_exception
            expect(AirbrakeNotifier).to_not receive(:report_error)
          end
        end

        context 'when unsuccessful' do
          before do
            allow(GettyImagesDownloader).to receive(:new).and_raise
          end

          it 'calls AirbrakeNotifier#report_error' do
            expect(AirbrakeNotifier).to receive(:report_error)
            subject.publish
          end
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
        expect(permissions_updater).to_not receive(:update_permissions)
        subject.publish
      end
    end
  end
end
