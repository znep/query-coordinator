require 'rails_helper'

RSpec.describe StoriesController, type: :controller do

  before do
    stub_core_view('test-test')
    # stub custom themes
    allow(CoreServer).to receive(:story_themes).and_return([])
    allow(StoryAccessLogger).to receive(:log_story_view_access)
    allow(StorytellerService).to receive(:downtimes).and_return([])

    stub_site_chrome
    stub_current_domain
    stub_approvals_settings

    # There is an upcoming refactor for how the API between the gem and the hosting application operates in
    # that the hosting app will pass in the request for the gem to derive of it's state from as a dependency.
    # After this refactor, the hosting app can simply pass in the test request to adjust the behavior of the
    # gem without having to do any stubbing or mocking of internals or requiring the gem to be aware that it's
    # in test mode.
    stub_domains_request
    stub_configurations_request

    request.env['HTTPS'] = 'on'
  end

  describe '#show with param from_collaboration_email=true' do
    context 'with an unpublished story' do
      before do
        stub_core_view('unpu-blsh')
      end

      context 'for an unauthenticated user' do
        before do
          stub_invalid_session
        end

        it 'redirects to login' do
          get :show, uid: 'unpu-blsh', from_collaboration_email: true
          expect(response).to redirect_to '/login?return_to=%2Fs%2Funpu-blsh%3Ffrom_collaboration_email%3Dtrue'
        end
      end

      context 'for a co-owner' do
        before do
          stub_valid_session
          stub_current_user_story_authorization(mock_user_authorization_owner_publisher)
        end

        it 'redirects to #edit' do
          get :show, uid: 'unpu-blsh', from_collaboration_email: true
          expect(response).to redirect_to '/s/unpu-blsh/edit'
        end
      end

      context 'for a collaborator' do
        before do
          stub_valid_session
          stub_current_user_story_authorization(mock_user_authorization_collaborator)
        end

        it 'redirects to #edit' do
          get :show, uid: 'unpu-blsh', from_collaboration_email: true
          expect(response).to redirect_to '/s/unpu-blsh/edit'
        end
      end

      context 'for a viewer' do
        before do
          stub_valid_session
          stub_current_user_story_authorization(mock_user_authorization_viewer)
        end

        it 'redirects to #preview' do
          get :show, uid: 'unpu-blsh', from_collaboration_email: true
          expect(response).to redirect_to '/s/unpu-blsh/preview'
        end
      end

      context 'for a unprivileged user' do
        before do
          stub_valid_session
          stub_current_user_story_authorization(mock_user_authorization_unprivileged)
        end

        it 'redirects to #edit' do
          get :show, uid: 'unpu-blsh', from_collaboration_email: true
          expect(response).to redirect_to '/s/unpu-blsh'
        end
      end
    end
  end

  describe '#show' do
    context 'when there is an published story with the given four by four' do
      context 'with an inaccessible core view' do
        let(:story_revision) { FactoryGirl.create(:published_story) }

        it 'renders 404' do
          stub_valid_session
          stub_core_view_as_missing(story_revision.uid)
          get :show, uid: story_revision.uid
          expect(response).to be_not_found
        end
      end
    end

    context 'with sufficient rights' do

      before do
        stub_valid_session
        stub_sufficient_rights
        stub_core_view('unpu-blsh')
      end

      context 'when there is an unpublished story with the given four by four' do
        it 'renders 404' do
          get :show, uid: 'unpu-blsh'
          expect(response).to be_not_found
        end
      end

      context 'when there is a published story with the given four by four' do

        let(:story_revision) { FactoryGirl.create(:published_story) }

        it 'renders show template' do
          get :show, uid: story_revision.uid
          expect(response).to render_template(:show)
        end

        it 'ignores vanity_text' do
          get :show, uid: story_revision.uid, vanity_text: 'haha'
          expect(assigns(:story)).to eq(story_revision)
        end

        it 'assigns the :story' do
          get :show, uid: story_revision.uid
          expect(assigns(:story)).to eq(story_revision)
        end

        it 'assigns :story_metadata to an instance of CoreStoryMetadata' do
          get :show, uid: story_revision.uid
          expect(assigns(:story_metadata)).to be_a(CoreStoryMetadata).
            and have_attributes(uid: story_revision.uid)
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

        it 'assigns current_user and current_domain to RequestStore for SocrataSiteChrome gem' do
          get :show, uid: story_revision.uid

          expect(::RequestStore.store[:current_user]).to eq(mock_valid_user)
          expect(::RequestStore.store[:current_domain]).to eq(mock_domain['cname'])
        end

        it 'assigns @story_url_for_view to the correct show story URL' do
          get :show, uid: story_revision.uid

          expect(assigns(:story_url_for_view)).to eq('https://test.host/s/test-story/test-test/')
        end

        describe 'google analytics' do
          render_views

          before do
            stub_current_user_story_authorization(mock_user_authorization_unprivileged)
          end

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
            stub_invalid_lenses_view
            expect(StoryAccessLogger).to_not receive(:log_story_view_access)
            get :show, uid: 'notf-ound'
          end
        end
      end

      context 'when there is no story with the given four by four' do
        before do
          stub_invalid_lenses_view
        end

        it 'renders 404' do
          get :show, uid: 'notf-ound'
          expect(response).to be_not_found
        end
      end
    end
  end

  describe '#tile' do
    let(:story_revision) { FactoryGirl.create(:published_story) }
    let(:tile_title) { 'Tile Test' }
    let(:tile_description) { 'Tile Test Description' }

    before do
      stub_core_view(story_revision.uid, {name: tile_title, description: tile_description})
    end

    context 'when html is requested' do
      context 'when there is a story with the given four by four' do

        it 'ignores vanity_text' do
          stub_valid_session
          get :tile, uid: story_revision.uid, vanity_text: 'haha'
          expect(assigns(:story)).to eq(story_revision)
        end

        it 'renders when unauthenticated' do
          stub_invalid_session
          get :tile, uid: story_revision.uid
          expect(response).to render_template(:tile)
        end

        it 'renders when authenticated' do
          stub_valid_session
          get :tile, uid: story_revision.uid
          expect(response).to render_template(:tile)
        end
      end

      context 'when there is no story with the given four by four' do
        before do
          stub_core_view_as_missing('notf-ound')
        end

        it 'returns 404' do
          stub_valid_session
          get :tile, uid: 'notf-ound'
          expect(response).to have_http_status(404)
        end
      end

      describe 'when there is no published story with the given four by four' do
        let(:story_revision) { FactoryGirl.build(:draft_story, uid: 'hasb-lock') }

        before do
          stub_core_view(story_revision.uid, {name: tile_title, description: tile_description})
        end

        it 'renders a 404 when unauthenticated' do
          stub_invalid_session
          stub_current_user_story_authorization(mock_user_authorization_unprivileged)

          get :tile, uid: story_revision.uid
          expect(response).to have_http_status(404)
        end

        it 'renders a draft story when authenticated' do
          stub_valid_session
          get :tile, uid: story_revision.uid
          expect(response).to render_template(:tile)
        end
      end

      describe 'google analytics' do
        render_views

        before do
          stub_valid_session
        end

        context 'when not configured' do
          it 'does not render google analytics partial' do
            get :tile, uid: story_revision.uid
            expect(response.body).to_not have_content(@google_analytics_tracking_id)
          end
        end

        context 'when configured' do
          before do
            stub_google_analytics
          end

          it 'renders google analytics partial' do
            get :tile, uid: story_revision.uid
            expect(response.body).to have_content(@google_analytics_tracking_id)
          end
        end
      end
    end

    context 'when json is requested' do
      context 'when there is a story with the given four by four' do
        it 'ignores vanity_text' do
          stub_valid_session
          get :tile, uid: story_revision.uid, vanity_text: 'haha', format: :json
          expect(assigns(:story)).to eq(story_revision)
        end

        it 'responds when unauthenticated' do
          stub_invalid_session
          get :tile, uid: story_revision.uid, format: :json

          response_json_as_hash = JSON.parse(response.body)
          expect(response_json_as_hash['title']).to eq(tile_title)
          expect(response_json_as_hash['image']).to eq(nil)
          expect(response_json_as_hash['description']).to eq(tile_description)
          expect(response_json_as_hash['theme']).to eq(story_revision['theme'])
          expect(response_json_as_hash['url']).to eq('https://test.host/s/Tile-Test/test-test')
        end

        it 'responds when authenticated' do
          stub_valid_session
          get :tile, uid: story_revision.uid, format: :json

          response_json_as_hash = JSON.parse(response.body)
          expect(response_json_as_hash['title']).to eq(tile_title)
          expect(response_json_as_hash['image']).to eq(nil)
          expect(response_json_as_hash['description']).to eq(tile_description)
          expect(response_json_as_hash['theme']).to eq(story_revision['theme'])
          expect(response_json_as_hash['url']).to eq('https://test.host/s/Tile-Test/test-test')
        end

        it 'sets Access-Control-Allow-Origin' do
          stub_invalid_session
          get :tile, uid: story_revision.uid, format: :json

          expect(response.headers['Access-Control-Allow-Origin']).to eq('*')
        end
      end

      context 'when there is no story with the given four by four' do
        before do
          stub_valid_session
          stub_core_view_as_missing('notf-ound')
        end

        it 'returns 404' do
          get :tile, uid: 'notf-ound', format: :json
          expect(response).to have_http_status(404)
        end
      end
    end

    describe 'when embed override properties exist' do
      let(:override_title) { 'Override Title' }
      let(:override_description) { 'Override Description' }
      render_views

      before do
        stub_invalid_session
        stub_core_view(story_revision.uid, {
          name: tile_title,
          description: tile_description,
          metadata: {
            tileConfig: {
              title: override_title,
              description: override_description
            }
          }
        })
      end

      describe 'and html is requested' do
        it 'uses the overrides in place of the main name and description' do
          get :tile, uid: story_revision.uid
          expect(response).to render_template(:tile)
          expect(response.body).to have_content(override_title)
          expect(response.body).to have_content(override_description)
          expect(response.body).to_not have_content(tile_title)
          expect(response.body).to_not have_content(tile_description)
        end
      end

      describe 'and json is requested' do
        it 'uses the overrides in place of the main name and description' do
          get :tile, uid: story_revision.uid, format: :json

          response_json_as_hash = JSON.parse(response.body)
          expect(response_json_as_hash['title']).to eq(override_title)
          expect(response_json_as_hash['description']).to eq(override_description)
        end
      end
    end

    describe 'log view access' do
      before do
        stub_valid_session
      end

      it 'logs view access when story exists' do
        expect(StoryAccessLogger).to receive(:log_story_view_access).with(story_revision, embedded: true)
        get :tile, uid: story_revision.uid
      end

      it 'logs view access for json requests' do
        expect(StoryAccessLogger).to receive(:log_story_view_access).with(story_revision, embedded: true)
        get :tile, uid: story_revision.uid, format: :json
      end

      it 'does not log view access when story does not exist' do
        stub_core_view_as_missing('notf-ound')
        expect(StoryAccessLogger).to_not receive(:log_story_view_access)
        get :tile, uid: 'notf-ound'
      end
    end
  end

  describe '#about' do
    context 'when authenticated' do
      before do
        stub_valid_session
        stub_sufficient_rights
      end

      context 'when there is no story with the given four by four' do
        before do
          stub_invalid_lenses_view
        end

        it '404s' do
          get :about, uid: 'notf-ound'
          expect(response.status).to eq(404)
        end
      end

      context 'when there is a story with the given four by four' do
        before do
          stub_core_view('test-test')
        end

        it 'redirects to frontend, /datasets/four-four/about' do
          get :about, uid: 'test-test'
          expect(response).to redirect_to '/datasets/test-test/about'
          expect(response.status).to eq(302)
        end
      end
    end
  end

  describe '#copy' do
    let!(:story_revision) { FactoryGirl.create(:draft_story_with_blocks) }
    let(:story_copy_title) { "Copy of #{mock_valid_lenses_view_title}" }

    context 'when authenticated' do
      before do
        stub_valid_session
        stub_sufficient_rights
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
          expect(story.block_ids.length).to eq(2)
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

        context 'when the draft story contains image components' do
          let!(:story_revision) { FactoryGirl.create(:draft_story_with_image_components) }
          let(:document) { FactoryGirl.create(:document) }

          before do
            allow(Document).to receive(:find_by_id).and_return(document)
          end

          it 'makes a copy of all documents' do
            get :copy, uid: story_revision.uid, title: story_copy_title

            story = assigns(:story)

            old_block_one_document_id = Block.find(story_revision.block_ids[0]).components[0]['value']['documentId']
            block_one_document_id = Block.find(story.block_ids[0]).components[0]['value']['documentId']

            old_block_two_document_id = Block.find(story_revision.block_ids[1]).components[0]['value']['documentId']
            block_two_document_id = Block.find(story.block_ids[1]).components[0]['value']['documentId']

            old_block_three_document_id = Block.find(story_revision.block_ids[2]).components[0]['value']['image']['documentId']
            block_three_document_id = Block.find(story.block_ids[2]).components[0]['value']['image']['documentId']

            expect(story.block_ids.length).to eq(3)
            expect(block_one_document_id).to_not eq(old_block_one_document_id)
            expect(block_two_document_id).to_not eq(old_block_two_document_id)
            expect(block_three_document_id).to_not eq(old_block_three_document_id)
          end
        end

        context 'when the original story has a legacy getty image block' do
          let!(:story_revision) { FactoryGirl.create(:draft_story_with_legacy_getty_image) }

          it 'copies getty image block' do
            get :copy, uid: story_revision.uid, title: story_copy_title

            story = assigns(:story)
            new_getty_image_component = story.blocks.first.components.first
            original_getty_image_component = story_revision.blocks.first.components.first

            expect(new_getty_image_component['type']).to eq('image')
            expect(new_getty_image_component.dig('value', 'documentId')).to be_nil
            expect(new_getty_image_component).to eq(original_getty_image_component)
          end
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
    context 'when authenticated' do
      before do
        stub_valid_session
        stub_sufficient_rights
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

        it 'assigns the :story' do
          get :preview, uid: story_revision.uid
          expect(assigns(:story)).to eq(story_revision)
        end

        it 'renders json when requested' do
          get :preview, uid: story_revision.uid, format: :json
          expect(response.body).to eq(story_revision.to_json)
        end

        it 'assigns current_user and current_domain to RequestStore for SocrataSiteChrome gem' do
          get :preview, uid: story_revision.uid

          expect(::RequestStore.store[:current_user]).to eq(mock_valid_user)
          expect(::RequestStore.store[:current_domain]).to eq(mock_domain['cname'])
        end
      end

      context 'when there is no story with the given four by four' do
        before do
          stub_invalid_lenses_view
        end

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
    context 'when authenticated' do
      before do
        stub_valid_session
        stub_sufficient_rights
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

        it 'assigns current_user and current_domain to RequestStore for SocrataSiteChrome gem' do
          get :new, uid: story_uid

          expect(::RequestStore.store[:current_user]).to eq(mock_valid_user)
          expect(::RequestStore.store[:current_domain]).to eq(mock_domain['cname'])
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
    context 'when authenticated' do
      before do
        stub_valid_session
        stub_sufficient_rights
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
          expect(story.block_ids.length).to eq(1)
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
    context 'when authenticated' do
      before do
        stub_valid_session
        stub_sufficient_rights
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

        it 'assigns :story_metadata to an instance of CoreStoryMetadata' do
          get :edit, uid: draft_story.uid
          expect(assigns(:story_metadata)).to be_a(CoreStoryMetadata).
            and have_attributes(uid: draft_story.uid)
        end

        it 'renders the edit layout' do
          get :edit, uid: draft_story.uid
          expect(response).to render_template('editor')
        end

        it 'assigns current_user and current_domain to RequestStore for SocrataSiteChrome gem' do
          get :edit, uid: draft_story.uid

          expect(::RequestStore.store[:current_user]).to eq(mock_valid_user)
          expect(::RequestStore.store[:current_domain]).to eq(mock_domain['cname'])
        end

        it 'sets @story_url_for_view' do
          get :edit, uid: draft_story.uid
          expect(assigns(:story_url_for_view)).to eq(
            "https://test.host/s/test-story/#{draft_story.uid}/"
          )
        end

        it 'sets @story_url_for_preview' do
          get :edit, uid: draft_story.uid
          expect(assigns(:story_url_for_preview)).to eq(
            "https://test.host/s/test-story/#{draft_story.uid}/preview"
          )
        end

        context 'when rendering a view' do

          render_views

          before(:each) do
            get :edit, uid: draft_story.uid
          end

          it '200s' do
            expect(response).to have_http_status(200)
          end

          it 'renders themes CSS' do
            expect(response.body).to match(/\s*<style id="themes">/)
          end

          it 'renders custom CSS' do
            expect(response.body).to match(/\s*<style id="custom">/)
          end

          it 'renders a json object for STORY_DATA' do
            expect(response.body).to match(/window\.STORY_DATA = {.*};$/)
          end

          it 'renders a string for PRIMARY_OWNER_UID' do
            expect(response.body).to match(/window\.PRIMARY_OWNER_UID = '.*';/)
          end

          it 'renders a json object for CURRENT_USER' do
            expect(response.body).to match(/window\.CURRENT_USER = {.*};$/)
          end

          it 'renders a json object for CURRENT_USER_STORY_AUTHORIZATION' do
            expect(response.body).to match(/window\.CURRENT_USER_STORY_AUTHORIZATION = {.*};$/)
          end

          it 'renders a json array for CUSTOM_THEMES' do
            expect(response.body).to match(/window\.CUSTOM_THEMES = \[.*\];$/)
          end

          it 'renders a json object for PUBLISHED_STORY_DATA' do
            expect(response.body).to match(/window\.PUBLISHED_STORY_DATA = {.*};$/)
          end

          it 'renders false for IS_GOAL' do
            expect(response.body).to match(/window\.IS_GOAL = false;/)
          end
        end
      end

      context 'when there is no matching story' do
        before do
          stub_invalid_lenses_view
        end

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

  describe '#stats' do
    context 'when authenticated' do
      before do
        stub_valid_session
        stub_sufficient_rights
        stub_valid_initialized_lenses_view
      end

      it 'redirects to /d/<four-four>/stats' do
        get :stats, uid: 'stat-stat'
        expect(response).to redirect_to '/d/stat-stat/stats'
      end
    end

    context 'when unauthenticated' do
      before do
        stub_invalid_session
      end

      it 'redirects to login' do
        get :stats, uid: 'stat-stat'
        expect(response).to redirect_to '/login?return_to=%2Fs%2Fstat-stat%2Fstats'
      end
    end
  end

  describe '#handle_authorization' do
    let(:action) { :nothing }
    let(:get_request) { get action, uid: 'test-test' }

    before do
      stub_valid_session
    end

    describe '#show' do
      let(:action) { :show }
      let(:view) { nil }
      let(:get_request) { get action, uid: 'test-test' }

      before do
        allow(CoreServer).to receive(:get_view).and_return(view)
      end

      context 'when the metadb view doesn\'t exist' do
        it '404s' do
          get_request
          expect(response.status).to eq(404)
        end
      end
    end

    describe '#edit' do
      let(:action) { :edit }

      before do
        allow_any_instance_of(ApplicationController).to receive(:can_edit_story?).and_return(can_edit_story)
      end

      describe 'when user can edit story' do
        let(:can_edit_story) { true }

        it 'does not 404' do
          get_request
          expect(response.status).to_not eq(404)
        end
      end

      describe 'when user cannot edit story' do
        let(:can_edit_story) { false }

        it '404s' do
          get_request
          expect(response.status).to eq(404)
        end
      end
    end

    describe '#stats' do
      let(:action) { :stats }

      before do
        allow_any_instance_of(ApplicationController).to receive(:can_see_story_stats?).and_return(can_see_story_stats)
      end

      describe 'when user can edit story' do
        let(:can_see_story_stats) { true }

        it 'does not 404' do
          get_request
          expect(response.status).to_not eq(404)
        end
      end

      describe 'when user cannot edit story' do
        let(:can_see_story_stats) { false }

        it '404s' do
          get_request
          expect(response.status).to eq(404)
        end
      end
    end

    describe '#copy' do
      let(:action) { :copy }

      before do
        allow_any_instance_of(ApplicationController).to receive(:can_make_copy?).and_return(can_make_copy)
        allow(DraftStory).to receive(:find_by_uid).and_return(nil)
      end

      describe 'when user can make copy' do
        let(:can_make_copy) { true }

        it 'does not 403' do
          get_request
          expect(response.status).to_not eq(403)
        end
      end

      describe 'when user cannot make copy' do
        let(:can_make_copy) { false }

        it '403s' do
          get_request
          expect(response.status).to eq(403)
        end
      end
    end

    describe '#preview' do
      let(:action) { :preview }

      before do
        allow(controller).to receive(:can_view_unpublished_story?).and_return(can_view_unpublished_story)
      end

      describe 'when user can view an unpublished story' do
        let(:can_view_unpublished_story) { true }

        it 'does not 404' do
          get_request
          expect(response.status).to_not eq(404)
        end
      end

      describe 'when user cannot view an unpublished story' do
        let(:can_view_unpublished_story) { false }

        it '404s' do
          get_request
          expect(response.status).to eq(404)
        end
      end
    end
  end
end
