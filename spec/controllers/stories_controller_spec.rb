require 'rails_helper'

RSpec.describe StoriesController, type: :controller do

  before do
    stub_core_view('test-test')
    # stub custom themes
    allow(CoreServer).to receive(:story_themes).and_return([])
    allow(StoryAccessLogger).to receive(:log_story_view_access)
    allow(SiteChrome).to receive(:for_current_domain).and_return(double('site_chrome').as_null_object)
  end

  describe '#show' do

    before do
      stub_sufficient_rights
    end

    context 'when there is a story with the given four by four' do

      let(:story_revision) { FactoryGirl.create(:published_story) }

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

      describe 'google analytics' do
        render_views

        context 'when not configured' do
          it 'does not render google analytics partial' do
            get :show, uid: story_revision.uid
            expect(response.body).to_not have_content(@google_analytics_tracking_id)
          end
        end

        context 'when configured' do
          before do
            stub_google_analytics
          end

          it 'renders google analytics partial' do
            get :show, uid: story_revision.uid
            expect(response.body).to have_content(@google_analytics_tracking_id)
          end
        end
      end

      describe 'log view access' do
        it 'logs view access when story exists' do
          expect(StoryAccessLogger).to receive(:log_story_view_access).with(story_revision)
          get :show, uid: story_revision.uid
        end

        it 'logs view access for json requests' do
          expect(StoryAccessLogger).to receive(:log_story_view_access).with(story_revision)
          get :show, uid: story_revision.uid, format: :json
        end

        it 'does not log view access when story does not exist' do
          expect(StoryAccessLogger).to_not receive(:log_story_view_access)
          get :show, uid: 'notf-ound'
        end
      end
    end

    context 'when there is no story with the given four by four' do

      it 'renders 404' do
        get :show, uid: 'notf-ound'
        expect(response).to have_http_status(404)
      end
    end
  end

  describe '#widget' do
    let(:story_revision) { FactoryGirl.create(:published_story) }
    let(:widget_title) { 'Widget Test' }
    let(:widget_description) { 'Widget Test Description' }

    before do
      stub_core_view(story_revision.uid, {name: widget_title, description: widget_description})
    end

    context 'when html is requested' do
      context 'when there is a story with the given four by four' do
        it 'ignores vanity_text' do
          get :widget, uid: story_revision.uid, vanity_text: 'haha'
          expect(assigns(:story)).to eq(story_revision)
        end

        it 'renders when unauthenticated' do
          stub_invalid_session
          get :widget, uid: story_revision.uid

          expect(response).to render_template(:widget)
        end

        it 'renders when authenticated' do
          get :widget, uid: story_revision.uid

          expect(response).to render_template(:widget)
        end
      end

      context 'when there is no story with the given four by four' do
        it 'returns 404' do
          get :widget, uid: 'notf-ound'
          expect(response).to have_http_status(404)
        end
      end

      describe 'google analytics' do
        render_views

        context 'when not configured' do
          it 'does not render google analytics partial' do
            get :widget, uid: story_revision.uid
            expect(response.body).to_not have_content(@google_analytics_tracking_id)
          end
        end

        context 'when configured' do
          before do
            stub_google_analytics
          end

          it 'renders google analytics partial' do
            get :widget, uid: story_revision.uid
            expect(response.body).to have_content(@google_analytics_tracking_id)
          end
        end
      end
    end

    context 'when json is requested' do
      context 'when there is a story with the given four by four' do
        it 'ignores vanity_text' do
          get :widget, uid: story_revision.uid, vanity_text: 'haha', format: :json
          expect(assigns(:story)).to eq(story_revision)
        end

        it 'responds when unauthenticated' do
          stub_invalid_session
          get :widget, uid: story_revision.uid, format: :json

          response_json_as_hash = JSON.parse(response.body)
          expect(response_json_as_hash['title']).to eq(widget_title)
          expect(response_json_as_hash['image']).to eq(nil)
          expect(response_json_as_hash['description']).to eq(widget_description)
          expect(response_json_as_hash['theme']).to eq(story_revision['theme'])
        end

        it 'responds when authenticated' do
          stub_invalid_session
          get :widget, uid: story_revision.uid, format: :json

          response_json_as_hash = JSON.parse(response.body)
          expect(response_json_as_hash['title']).to eq(widget_title)
          expect(response_json_as_hash['image']).to eq(nil)
          expect(response_json_as_hash['description']).to eq(widget_description)
          expect(response_json_as_hash['theme']).to eq(story_revision['theme'])
        end
      end

      context 'when there is no story with the given four by four' do
        it 'returns 404' do
          get :widget, uid: 'notf-ound', format: :json
          expect(response).to have_http_status(404)
        end
      end
    end

    describe 'log view access' do
      it 'logs view access when story exists' do
        expect(StoryAccessLogger).to receive(:log_story_view_access).with(story_revision)
        get :widget, uid: story_revision.uid
      end

      it 'logs view access for json requests' do
        expect(StoryAccessLogger).to receive(:log_story_view_access).with(story_revision)
        get :widget, uid: story_revision.uid, format: :json
      end

      it 'does not log view access when story does not exist' do
        expect(StoryAccessLogger).to_not receive(:log_story_view_access)
        get :widget, uid: 'notf-ound'
      end
    end
  end

  describe '#about' do
    before do
      stub_sufficient_rights
    end

    context 'when authenticated' do
      before do
        stub_valid_session
      end

      context 'when there is no story with the given four by four' do
        it '404s' do
          get :about, uid: 'notf-ound'
          expect(response.status).to be(404)
        end
      end

      context 'when there is a story with the given four by four' do
        before do
          stub_core_view('test-test')
        end

        it 'redirects to frontend, /datasets/four-four/about' do
          get :about, uid: 'test-test'
          expect(response).to redirect_to '/datasets/test-test/about'
          expect(response.status).to be(302)
        end
      end
    end
  end

  describe '#copy' do
    let!(:story_revision) { FactoryGirl.create(:draft_story_with_blocks) }
    let(:story_copy_title) { "Copy of #{mock_valid_lenses_view_title}" }

    before do
      stub_sufficient_rights
    end

    context 'when authenticated' do
      before do
        stub_valid_session
      end

      context 'when there is no story with the given four by four' do
        before do
          stub_core_view('notf-ound')
        end

        # not sure this is what we want. maybe should 404?
        it 'redirects to root' do
          get :copy, uid: 'notf-ound'
          expect(response).to redirect_to '/'
        end
      end

      context 'when there is no view with the given four by four' do
        let!(:story_revision) { FactoryGirl.create(:draft_story) }

        before do
          stub_invalid_lenses_view
        end

        # not sure this is what we want. maybe should 404?
        it 'redirects to root' do
          get :copy, uid: story_revision.uid
          expect(response).to redirect_to '/'
        end
      end

      context 'when view creation fails' do
        let!(:story_revision) { FactoryGirl.create(:draft_story) }

        before do
          stub_core_view(story_revision.uid)
          stub_unsuccessful_view_creation
        end

        # not sure this is what we want. maybe should 403?
        it 'redirects to root' do
          get :copy, uid: story_revision.uid
          expect(response).to redirect_to '/'
        end
      end

      context 'when copy creation succeeds' do
        before do
          stub_core_view(story_revision.uid)
          stub_successful_view_creation

          allow(CoreServer).to receive(:update_view) do |story_uid, updated_view|
            expect(updated_view['name']).to eq(story_copy_title)
            expect(updated_view['metadata']['initialized']).to eq(true)
          end
        end

        it 'creates a new draft story with two blocks' do
          get :copy, uid: story_revision.uid, title: story_copy_title

          story = assigns(:story)

          expect(story).to be_a(DraftStory)
          expect(story.block_ids.length).to be(2)
          expect(story.uid).to eq(mock_valid_lenses_view_uid)
        end

        it 'redirects to edit experience of the new story' do
          get :copy, uid: story_revision.uid, title: story_copy_title

          expect(response).to redirect_to "/stories/s/#{mock_valid_lenses_view_uid}/edit"
        end

        it 'uses the same theme as original' do
          get :copy, uid: story_revision.uid, title: story_copy_title

          expect(assigns(:story).theme).to eq(story_revision.theme)
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

          allow(CoreServer).to receive(:update_view) do |story_uid, updated_view|
            expect(updated_view['name']).to eq(mock_valid_lenses_view_title)
            expect(updated_view['metadata']['initialized']).to eq(true)
          end
        end

        it 'redirects' do
          get :copy, uid: story_revision.uid, title: story_copy_title
          expect(response).to have_http_status(302)
        end
      end

      context 'when there is no lenses view with the given four by four' do
        before do
          stub_invalid_lenses_view
        end

        it 'redirects' do
          get :copy, uid: 'notf-ound'
          expect(response).to have_http_status(302)
        end
      end
    end
  end

  describe '#preview' do

    before do
      stub_sufficient_rights
    end

    context 'when authenticated' do
      before do
        stub_valid_session
      end

      let(:story_revision) { FactoryGirl.create(:draft_story) }

      context 'when there is a story with the given four by four' do

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

      describe 'google analytics' do
        render_views

        context 'when not configured' do
          it 'does not render google analytics partial' do
            get :preview, uid: story_revision.uid
            expect(response.body).to_not have_content(@google_analytics_tracking_id)
          end
        end

        context 'when configured' do
          before do
            stub_google_analytics
          end

          it 'renders google analytics partial' do
            get :preview, uid: story_revision.uid
            expect(response.body).to have_content(@google_analytics_tracking_id)
          end
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

    before do
      stub_sufficient_rights
    end

    context 'when authenticated' do
      before do
        stub_valid_session
      end

      context 'when there is an uninitialized lenses view with the given four by four' do

        let(:story_uid) { 'test-test' }

        before do
          stub_valid_uninitialized_lenses_view
        end

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

        describe 'google analytics' do
          render_views

          context 'when not configured' do
            it 'does not render google analytics partial' do
              get :new, uid: story_uid
              expect(response.body).to_not have_content(@google_analytics_tracking_id)
            end
          end

          context 'when configured' do
            before do
              stub_google_analytics
            end

            it 'renders google analytics partial' do
              get :new, uid: story_uid
              expect(response.body).to have_content(@google_analytics_tracking_id)
            end
          end
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

    before do
      stub_sufficient_rights
    end

    context 'when authenticated' do
      before do
        stub_valid_session
      end

      context 'when there is an uninitialized lenses view with the given four by four' do

        before do
          stub_valid_uninitialized_lenses_view

          allow(CoreServer).to receive(:update_view) do |story_uid, updated_view|
            expect(updated_view['name']).to eq(mock_valid_lenses_view_title)
            expect(updated_view['metadata']['initialized']).to eq(true)
          end
        end

        let!(:story_uid) { 'news-tory' }

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

          allow(CoreServer).to receive(:update_view) do |story_uid, updated_view|
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

    before do
      stub_sufficient_rights
    end

    context 'when authenticated' do
      before do
        stub_valid_session
      end

      let(:draft_story) { FactoryGirl.create(:draft_story) }

      context 'when there is a matching story' do

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
            expect(response.body).to match(/userStoryData = {.*};$/)
          end

          it 'renders a string for primaryOwnerUid' do
            get :edit, uid: draft_story.uid
            expect(response.body).to match(/primaryOwnerUid = '.*';$/)
          end

          it 'renders a json object for currentUser' do
            get :edit, uid: draft_story.uid
            expect(response.body).to match(/currentUser = {.*};$/)
          end

          it 'renders a json object for currentUserStoryAuthorization' do
            get :edit, uid: draft_story.uid
            expect(response.body).to match(/currentUserStoryAuthorization = {.*};$/)
          end

          it 'renders a json array for customThemes' do
            get :edit, uid: draft_story.uid
            expect(response.body).to match(/customThemes = \[.*\];$/)
          end

          it 'renders a json object for publishedStory' do
            get :edit, uid: draft_story.uid
            expect(response.body).to match(/publishedStory = {.*};$/)
          end
        end
      end

      context 'when there is no matching story' do

        it 'returns a 404' do
          get :edit, uid: 'notf-ound'
          expect(response).to have_http_status(404)
        end
      end

      describe 'google analytics' do
        render_views

        context 'when not configured' do
          it 'does not render google analytics partial' do
            get :edit, uid: draft_story.uid
            expect(response.body).to_not have_content(@google_analytics_tracking_id)
          end
        end

        context 'when configured' do
          before do
            stub_google_analytics
          end

          it 'renders google analytics partial' do
            get :edit, uid: draft_story.uid
            expect(response.body).to have_content(@google_analytics_tracking_id)
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

  describe '#require_sufficient_rights' do
    let(:action) { :nothing }
    let(:get_request) { get action, uid: 'test-test' }

    before do
      stub_valid_session
    end

    describe 'editing' do
      let(:action) { :edit }

      before do
        allow(controller).to receive(:can_edit_story?).and_return(can_edit_story)
      end

      describe 'when user can edit story' do
        let(:can_edit_story) { true }

        it 'does not 404' do
          get_request
          expect(response.status).to_not be(404)
        end
      end

      describe 'when user cannot edit story' do
        let(:can_edit_story) { false }

        it '404s' do
          get_request
          expect(response.status).to be(404)
        end
      end
    end

    describe 'copying' do
      let(:action) { :copy }

      before do
        allow(controller).to receive(:can_make_copy?).and_return(can_make_copy)
        allow(DraftStory).to receive(:find_by_uid).and_return(nil)
      end

      describe 'when user can make copy' do
        let(:can_make_copy) { true }

        it 'does not 403' do
          get_request
          expect(response.status).to_not be(403)
        end
      end

      describe 'when user cannot make copy' do
        let(:can_make_copy) { false }

        it '403s' do
          get_request
          expect(response.status).to be(403)
        end
      end
    end

    describe 'previewing' do
      let(:action) { :preview }

      before do
        allow(controller).to receive(:can_view_unpublished_story?).and_return(can_view_unpublished_story)
      end

      describe 'when user can view an unpublished story' do
        let(:can_view_unpublished_story) { true }

        it 'does not 404' do
          get_request
          expect(response.status).to_not be(404)
        end
      end

      describe 'when user cannot view an unpublished story' do
        let(:can_view_unpublished_story) { false }

        it '404s' do
          get_request
          expect(response.status).to be(404)
        end
      end
    end
  end

end
