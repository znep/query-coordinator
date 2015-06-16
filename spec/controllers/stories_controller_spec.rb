require 'rails_helper'

RSpec.describe StoriesController, type: :controller do

  before do
    stub_logged_in
  end

  describe '#show' do

    context 'when there is a story with the given four_by_four' do

      let!(:story_revision) { FactoryGirl.create(:published_story) }

      it 'renders show template' do
        get :show, four_by_four: story_revision.four_by_four
        expect(response).to render_template(:show)
      end

      it 'ignores vanity_text' do
        get :show, four_by_four: story_revision.four_by_four, vanity_text: 'haha'
        expect(assigns(:story)).to eq(story_revision)
      end

      it 'renders 404' do
        get :show, four_by_four: 'notf-ound'
        expect(response).to be_not_found
      end

      it 'assigns the :story' do
        get :show, four_by_four: story_revision.four_by_four
        expect(assigns(:story)).to eq(story_revision)
      end

      it 'renders json when requested' do
        get :show, four_by_four: story_revision.four_by_four, format: :json
        expect(response.body).to eq(story_revision.to_json)
      end
    end

    context 'when there is no story with the given four_by_four' do

      it 'renders 404' do
        get :show, four_by_four: 'notf-ound'
        expect(response).to have_http_status(404)
      end
    end
  end

  describe '#edit' do

    context 'when there is a matching story' do

      let!(:draft_story) { FactoryGirl.create(:draft_story) }

      it 'calls find_by_four_by_four' do
        expect(DraftStory).to receive(:find_by_four_by_four)
        get :edit, four_by_four: draft_story.four_by_four
      end

      it 'assigns :story' do
        get :edit, four_by_four: draft_story.four_by_four
        expect(assigns(:story)).to eq draft_story
      end

      it 'renders the edit layout' do
        get :edit, four_by_four: draft_story.four_by_four
        expect(response).to render_template('editor')
      end

      context 'when rendering a view' do

        render_views

        it 'renders a json object for inspirationStoryData' do
          get :edit, four_by_four: draft_story.four_by_four
          expect(response.body).to match(/inspirationStoryData = {/)
        end

        it 'renders a json object for userStoryData' do
          get :edit, four_by_four: draft_story.four_by_four
          expect(response.body).to match(/userStoryData = {/)
        end

        it 'renders an array of json objects for sampleBlocks' do
          get :edit, four_by_four: draft_story.four_by_four
          expect(response.body).to match(/sampleBlocks = \[/)
        end
      end
    end

    context 'when there is no matching story' do

      it 'returns a 404' do
        get :edit, four_by_four: 'notf-ound'
        expect(response).to have_http_status(404)
      end
    end
  end
end
