require 'rails_helper'

RSpec.describe PublishedStoriesController, type: :controller do
  describe '#show' do
    context 'when story lives in current domain' do
      before do
        @story_revision = FactoryGirl.create(:published_story)
      end

      it 'renders show template' do
        get :show, four_by_four: @story_revision.four_by_four
        expect(response).to render_template(:show)
      end

      it 'ignores vanity_text' do
        get :show, four_by_four: @story_revision.four_by_four, vanity_text: 'haha'
        expect(assigns(:published_story)).to eq(@story_revision)
      end

      it 'renders 404' do
        get :show, four_by_four: 'notf-ound'
        expect(response).to be_not_found
      end

      it 'assigns the :published_story' do
        get :show, four_by_four: @story_revision.four_by_four
        expect(assigns(:published_story)).to eq(@story_revision)
      end

      it 'return the story with the latest created_at' do
        four_by_four = 'abcd-efgh'
        @newer_story_revision = FactoryGirl.create(
          :published_story,
          four_by_four: four_by_four,
          created_at: Time.now
        )
        @older_story_revision = FactoryGirl.create(
          :published_story,
          four_by_four: four_by_four,
          created_at: Time.now - 1.day
        )

        get :show, four_by_four: four_by_four
        expect(assigns(:published_story)).to eq(@newer_story_revision)
      end

      it 'does not include stories marked deleted' do
        four_by_four = 'abcd-9876'
        @deleted_story_revision = FactoryGirl.create(
          :published_story,
          four_by_four: four_by_four,
          created_at: Time.now,
          deleted_at: Time.now
        )
        @older_story_revision = FactoryGirl.create(
          :published_story,
          four_by_four: four_by_four,
          created_at: Time.now - 1.day
        )

        get :show, four_by_four: four_by_four
        expect(assigns(:published_story)).to eq(@older_story_revision)
      end

      it 'renders 404 when all revisions of story have been marked deleted' do
        four_by_four = '1234-efgh'
        @deleted_story_revision = FactoryGirl.create(
          :published_story,
          four_by_four: four_by_four,
          created_at: Time.now,
          deleted_at: Time.now
        )
        @deleted_older_story_revision = FactoryGirl.create(
          :published_story,
          four_by_four: four_by_four,
          created_at: Time.now - 1.day,
          deleted_at: Time.now
        )

        get :show, four_by_four: four_by_four
        expect(response).to be_not_found
      end

      it 'renders json' do
        get :show, four_by_four: @story_revision.four_by_four, format: :json
        expect(response.body).to eq(@story_revision.to_json)
      end
    end

    context 'when story lives in different domain' do
      it 'renders 404'
    end
  end
end
