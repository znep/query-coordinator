require 'rails_helper'

RSpec.describe StoryPublisher do
  # using let! here because we have a test below that checks that no blocks are
  # created as part of the publish step. If the blocks are created as part of
  # lazy-loading the story, it throws off the Block counts.
  let!(:draft_story) { FactoryGirl.create(:draft_story_with_blocks) }
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

    it 'initializes with copied blocks' do
      expect(StoryJsonBlocks).to receive(:from_story).
        with(draft_story, user, copy: true)

      StoryPublisher.new(user, permissions_updater, params)
    end

    context 'when draft story does not exist' do
      let(:params) do
        {
          uid: 'fake-uid1',
          digest: 'fakedigest'
        }
      end

      it 'raises an appropriate message' do
        expect {
          subject
        }.to raise_error(/Could not find a draft story with matching uid and digest./)
      end
    end

    context 'when the specified draft is not the latest' do
      let!(:older_draft_story) do
        FactoryGirl.create(:draft_story_with_blocks,
          uid: 'orde-ring',
          created_at: Time.at(1),
          digest: 'old'
        )
      end
      let!(:newer_draft_story) do
        FactoryGirl.create(:draft_story_with_blocks,
          uid: 'orde-ring',
          created_at: Time.at(2),
          digest: 'new'
        )
      end
      let(:params) do
        {
          uid: older_draft_story.uid,
          digest: older_draft_story.digest
        }
      end

      it 'raises an appropriate message' do
        expect {
          subject
        }.to raise_error(/Rejected specified draft story for publication due to staleness./)
      end
    end

    context 'when the specified draft has already been published' do
      let!(:published_story) do
        FactoryGirl.create(:published_story_with_blocks,
          uid: 'dupl-cate',
          digest: 'digest',
          created_at: Time.at(2)
        )
      end
      let!(:corresponding_draft_story) do
        FactoryGirl.create(:draft_story_with_blocks,
          uid: 'dupl-cate',
          digest: 'digest',
          created_at: Time.at(1)
        )
      end
      let(:params) do
        {
          uid: corresponding_draft_story.uid,
          digest: corresponding_draft_story.digest
        }
      end

      it 'raises an appropriate message' do
        expect {
          subject
        }.to raise_error(/Rejected specified draft story for publication because it has already been published./)
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

      it 'saves blocks' do
        expect { subject.publish }.to change { Block.count }.by(draft_story.block_ids.count)
      end

      it 'saves new blocks to story' do
        subject.publish
        expect(subject.story.block_ids).to_not eq(draft_story.block_ids)
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

        it 'deletes previously created blocks' do
          expect { subject.publish }.to_not change { Block.count }
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

      context 'when saving blocks fails' do
        before do
          allow_any_instance_of(Block).to receive(:save).and_return(false)
        end

        it 'does not save the story' do
          expect(subject.story).to_not receive(:save)
          subject.publish
        end

        it 'returns false' do
          expect(subject.publish).to eq(false)
        end
      end

      context 'when saving story fails' do
        before do
          allow(subject.story).to receive(:save).and_return(false)
        end

        it 'deletes previously created blocks' do
          expect { subject.publish }.to_not change { Block.count }
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
