require 'spec_helper'

describe GettyImagesDownloader do
  let(:user) do
    mock_valid_user
  end

  let(:attributes) { nil }
  let(:story) { FactoryGirl.create(:draft_story_with_getty_image, attributes) }
  let(:subject) { GettyImagesDownloader.new(story, user) }
  let(:getty_image) { FactoryGirl.create(:getty_image) }

  describe '#initialize' do
    describe 'with valid parameters' do
      it 'sets story' do
        expect(subject.story).to eq(story)
      end

      it 'sets user' do
        expect(subject.user).to eq(user)
      end
    end

    describe 'with invalid parameters' do
      describe 'when story is not a DraftStory or PublishedStory' do
        let(:story) { nil }

        it 'raises' do
          expect { GettyImagesDownloader.new(story, user) }.to raise_error(/A valid draft or published story is required/)
        end
      end

      describe 'when user is missing' do
        let(:user) { nil }

        it 'raises' do
          expect { GettyImagesDownloader.new(story, user) }.to raise_error(/A valid user object is required/)
        end
      end
    end
  end

  describe '#download' do
    describe 'when there are Getty Images in the story' do
      before do
        allow(getty_image).to receive(:download!)
        allow(GettyImage).to receive(:find_or_initialize_by).and_return(getty_image)
      end

      it 'downloads each image' do
        subject.download
        expect(getty_image).to have_received(:download!).with(user, story.uid).at_least(:once)
      end
    end

    describe 'when there are not Getty Images in the story' do
      let(:story) { FactoryGirl.create(:draft_story_with_blocks) }

      before do
        allow(GettyImage).to receive(:find_or_initialize_by)
      end

      it 'returns nil' do
        expect(subject.download).to eq([])
      end

      it 'never invokes GettyImage.find_or_initialize_by' do
        subject.download
        expect(GettyImage).to_not have_received(:find_or_initialize_by)
      end
    end
  end
end
