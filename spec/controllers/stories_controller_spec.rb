require 'rails_helper'

RSpec.describe StoriesController, type: :controller do

  before do
    stub_valid_session
    stub_core_view('test-test')
  end

  describe '#show' do

    context 'when there is a story with the given four by four' do

      let!(:story_revision) { FactoryGirl.create(:published_story) }

      it 'renders show template' do
        get :show, uid: story_revision.uid
        expect(response).to render_template(:show)
      end

      it 'ignores vanity_text' do
        get :show, uid: story_revision.uid, vanity_text: 'haha'
        expect(assigns(:story)).to eq(story_revision)
      end

      it 'renders 404' do
        get :show, uid: 'notf-ound'
        expect(response).to be_not_found
      end

      it 'assigns the :story' do
        get :show, uid: story_revision.uid
        expect(assigns(:story)).to eq(story_revision)
      end

      it 'renders json when requested' do
        get :show, uid: story_revision.uid, format: :json
        expect(response.body).to eq(story_revision.to_json)
      end

      it 'renders when unauthenticated' do
        stub_invalid_session
        get :show, uid: story_revision.uid
        expect(response).to render_template(:show)
      end
    end

    context 'when there is no story with the given four by four' do

      it 'renders 404' do
        get :show, uid: 'notf-ound'
        expect(response).to have_http_status(404)
      end
    end
  end

  describe '#preview' do

    context 'when authenticated' do
      context 'when there is a story with the given four by four' do

        let!(:story_revision) { FactoryGirl.create(:draft_story) }

        it 'renders show template' do
          get :preview, uid: story_revision.uid
          expect(response).to render_template(:show)
        end

        it 'ignores vanity_text' do
          get :preview, uid: story_revision.uid, vanity_text: 'haha'
          expect(assigns(:story)).to eq(story_revision)
        end

        it 'renders 404' do
          get :preview, uid: 'notf-ound'
          expect(response).to be_not_found
        end

        it 'assigns the :story' do
          get :preview, uid: story_revision.uid
          expect(assigns(:story)).to eq(story_revision)
        end

        it 'renders json when requested' do
          get :preview, uid: story_revision.uid, format: :json
          expect(response.body).to eq(story_revision.to_json)
        end

      end

      context 'when there is no story with the given four by four' do

        it 'renders 404' do
          get :preview, uid: 'notf-ound'
          expect(response).to have_http_status(404)
        end
      end
    end

    context 'when unauthenticated' do
      before do
        stub_invalid_session
      end

      context 'when there is a story with the given four by four' do

        let!(:story_revision) { FactoryGirl.create(:draft_story) }

        it 'redirects' do
          get :preview, uid: story_revision.uid
          expect(response).to have_http_status(302)
        end
      end

      context 'when there is no story with the given four by four' do

        it 'redirects' do
          get :preview, uid: 'notf-ound'
          expect(response).to have_http_status(302)
        end
      end
    end
  end

  describe '#new' do

    context 'when authenticated' do
      context 'when there is an uninitialized lenses view with the given four by four' do

        before do
          stub_valid_uninitialized_lenses_view
        end

        let!(:story_uid) { 'test-test' }

        it 'assigns the story title' do
          get :new, uid: story_uid

          expect(assigns(:story_title)).to eq(mock_valid_lenses_view_title)
          expect(response).to render_template(:new)
        end

        it 'ignores vanity_text' do
          get :new, uid: story_uid, vanity_text: 'haha'

          expect(assigns(:story_title)).to eq(mock_valid_lenses_view_title)
          expect(response).to render_template(:new)
        end
      end

      context 'when there is an initialized lenses view with the given four by four' do

        before do
          stub_valid_initialized_lenses_view
        end

        let!(:story_uid) { 'test-test' }

        it 'redirects to the edit experience' do
          get :new, uid: story_uid

          expect(response).to redirect_to "/stories/s/#{story_uid}/edit"
        end
      end

      context 'when there is no lenses view with the given four by four' do

        before do
          stub_invalid_lenses_view
        end

        it 'renders 404' do
          get :new, uid: 'notf-ound'

          expect(response).to have_http_status(404)
        end
      end
    end

    context 'when unauthenticated' do
      before do
        stub_invalid_session
      end

      context 'when there is an initialized lenses view with the given four by four' do

        before do
          stub_valid_initialized_lenses_view
        end

        let!(:story_uid) { 'test-test' }

        it 'redirects' do
          get :new, uid: story_uid
          expect(response).to have_http_status(302)
        end
      end

      context 'when there is no lenses view with the given four by four' do

        before do
          stub_invalid_lenses_view
        end

        it 'redirects' do
          get :new, uid: 'notf-ound'
          expect(response).to have_http_status(302)
        end
      end
    end
  end

  describe '#create' do

    context 'when authenticated' do
      context 'when there is an uninitialized lenses view with the given four by four' do

        before do
          stub_valid_uninitialized_lenses_view

          allow(CoreServer).to receive(:update_view) do |story_uid, cookie, updated_view|
            expect(updated_view['name']).to eq(mock_valid_lenses_view_title)
            expect(updated_view['metadata']['initialized']).to eq(true)
          end
        end

        let!(:story_uid) { 'test-test' }

        it 'creates a new draft story with a single block' do
          post :create, uid: story_uid, title: mock_valid_lenses_view_title

          story = assigns(:story)

          expect(story).to be_a(DraftStory)
          expect(story.block_ids.length).to be(1)
          expect(story.uid).to eq(story_uid)
        end

        it 'ignores vanity_text' do
          post :create, uid: story_uid, vanity_text: 'haha', title: mock_valid_lenses_view_title

          story = assigns(:story)

          expect(story).to be_a(DraftStory)
          expect(story.uid).to eq(story_uid)
        end

        it 'updates the lenses view metadata to set "initialized" equal to "true"' do
          post :create, uid: story_uid, title: mock_valid_lenses_view_title
        end

        it 'redirects to the edit experience' do
          post :create, uid: story_uid, title: mock_valid_lenses_view_title

          expect(response).to redirect_to "/stories/s/#{story_uid}/edit"
        end

        it 'defaults to the classic theme' do
          post :create, uid: story_uid, title: mock_valid_lenses_view_title

          expect(assigns(:story).theme).to eq('classic')
        end
      end

      context 'when there is no lenses view with the given four by four' do

        before do
          stub_invalid_lenses_view
        end

        it 'redirects to root' do
          post :create, uid: 'notf-ound'

          expect(response).to redirect_to '/'
        end
      end
    end

    context 'when unauthenticated' do
      before do
        stub_invalid_session
      end

      context 'when there is an uninitialized lenses view with the given four by four' do
        before do
          stub_valid_uninitialized_lenses_view

          allow(CoreServer).to receive(:update_view) do |story_uid, cookie, updated_view|
            expect(updated_view['name']).to eq(mock_valid_lenses_view_title)
            expect(updated_view['metadata']['initialized']).to eq(true)
          end
        end

        let!(:story_uid) { 'test-test' }

        it 'redirects' do
          post :create, uid: story_uid, title: mock_valid_lenses_view_title
          expect(response).to have_http_status(302)
        end
      end

      context 'when there is no lenses view with the given four by four' do
        before do
          stub_invalid_lenses_view
        end

        it 'redirects' do
          post :create, uid: 'notf-ound'
          expect(response).to have_http_status(302)
        end
      end
    end
  end

  describe '#edit' do

    context 'when authenticated' do
      context 'when there is a matching story' do

        let!(:draft_story) { FactoryGirl.create(:draft_story) }

        it 'calls find_by_uid' do
          expect(DraftStory).to receive(:find_by_uid)
          get :edit, uid: draft_story.uid
        end

        it 'assigns :story' do
          get :edit, uid: draft_story.uid
          expect(assigns(:story)).to eq draft_story
        end

        it 'renders the edit layout' do
          get :edit, uid: draft_story.uid
          expect(response).to render_template('editor')
        end

        context 'when rendering a view' do

          render_views

          it 'renders a json object for userStoryData' do
            get :edit, uid: draft_story.uid
            expect(response.body).to match(/userStoryData = {/)
          end
        end
      end

      context 'when there is no matching story' do

        it 'returns a 404' do
          get :edit, uid: 'notf-ound'
          expect(response).to have_http_status(404)
        end
      end
    end
  end

  context 'when unauthenticated' do
    before do
      stub_invalid_session
    end

    context 'when there is a matching story' do

      let!(:draft_story) { FactoryGirl.create(:draft_story) }

      it 'redirects' do
        get :edit, uid: draft_story.uid
        expect(response).to have_http_status(302)
      end
    end

    context 'when there is no matching story' do
        it 'redirects' do
          get :edit, uid: 'notf-ound'
          expect(response).to have_http_status(302)
        end
    end
  end
end
