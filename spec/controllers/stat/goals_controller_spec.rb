require 'rails_helper'

RSpec.describe Stat::GoalsController, type: :controller do
  let(:dashboard) { 'dash-bord' }
  let(:category) { 'cate-gory' }
  let(:uid) { 'test-goal' }
  let(:accessible) { false }
  let(:unauthorized) { false }
  let(:narrative_migration_marker) { 'narrative migration marker' }
  let(:narrative) do
    {
      'narrative' => [ { 'foo' => narrative_migration_marker } ]
    }
  end
  let(:feature_flags) do
    {
      'open_performance_narrative_editor' => 'storyteller',
      'enable_getty_images_gallery' => true,
      'enable_deprecated_user_search_api' => false
    }
  end

  let(:goal) do
    double(
      OpenPerformance::Goal,
      :uid => uid,
      :title => 'title',
      :description => 'description',
      :public? => true,
      :accessible? => accessible,
      :unauthorized? => unauthorized,
      :narrative_migration_metadata => narrative
    )
  end

  before do
    stub_current_domain
    allow(CoreServer).to receive(:story_themes).and_return([])
    allow(OpenPerformance::Goal).to receive(:new).and_return(goal)
    set_feature_flags(feature_flags)
  end

  describe '#show' do
    shared_examples 'goal viewer' do
      describe 'goal not accessible' do
        it '404s' do
          get :show, dashboard: dashboard , category: category , uid: uid
          expect(response).to have_http_status(404)
        end
      end

      describe 'goal accessible' do
        let(:accessible) { true }
        it 'redirects to "classic view" for goal routes' do
          get :show, dashboard: dashboard , category: category , uid: uid
          expect(response).to redirect_to "/stat/goals/#{dashboard}/#{category}/#{uid}/view"
        end
      end
    end

    describe 'anonymous' do
      before do
        stub_invalid_session
      end
      it_behaves_like 'goal viewer'
    end

    describe 'logged in' do
      before do
        stub_logged_in_user
      end
      it_behaves_like 'goal viewer'
    end
  end



  shared_examples 'action available to goal editors' do |action|

    describe 'user not signed in' do
      let(:accessible) { false }
      let(:unauthorized) { false }

      before do
        stub_invalid_session
        allow(goal).to receive(:accessible?).and_return(accessible)
        allow(goal).to receive(:unauthorized?).and_return(unauthorized)
      end

      describe 'goal not present' do
        it '404s' do
          get action, uid: uid
          expect(response).to have_http_status(404)
        end
      end

      describe 'private goal' do
        let(:unauthorized) { true }
        it 'redirects to login' do
          get action, uid: uid
          expect(response).to have_http_status(302)
        end
      end

      describe 'public goal' do
        let(:accessible) { true }

        it 'redirects to login' do
          get action, uid: uid
          expect(response).to have_http_status(302)
        end
      end
    end

    describe 'user cannot edit goal' do
      it 'denies request' do
        stub_logged_in_user
        stub_current_user_story_authorization(mock_user_authorization_unprivileged)
        # Not typo, goal may be visible (public).
        allow(goal).to receive(:accessible?).and_return(true)
        allow(goal).to receive(:unauthorized?).and_return(false)
        get action, uid: uid
        expect(response).to have_http_status(404)
      end
    end
  end

  describe '#edit' do

    describe 'storyteller editor disabled via feature flag' do
      let(:feature_flags) do
        { 'open_performance_narrative_editor' => 'classic' }
      end

      describe 'user can edit goal' do
        before do
          stub_logged_in_user
          stub_sufficient_rights
        end

        describe 'single goal edit' do
          before do
            get :edit, uid: uid
          end

          it 'redirects to classic editor' do
            expect(response).to redirect_to "/stat/goals/single/#{uid}/edit-classic"
          end
        end

        describe 'fully-qualified goal edit' do
          before do
            get :edit, uid: uid, dashboard: dashboard, category: category
          end

          it 'redirects to classic editor' do
            expect(response).to redirect_to "/stat/goals/#{dashboard}/#{category}/#{uid}/edit-classic"
          end
        end

        describe 'with magic param' do
          it 'does not redirect' do
            get :edit, uid: uid, open_performance_narrative_editor: 'storyteller'
            expect(response).to have_http_status(:ok)

            get(:edit, {
              uid: uid,
              dashboard: dashboard,
              category: category,
              open_performance_narrative_editor: 'storyteller'
            })
            expect(response).to have_http_status(:ok)
          end
        end
      end
    end

    describe 'storyteller editor enabled via feature flag' do
      it_behaves_like 'action available to goal editors', :edit

      describe 'user can edit goal' do
        before do
          stub_logged_in_user
          stub_super_admin_session
          allow(StorytellerService).to receive(:downtimes).and_return([])
        end

        shared_examples 'goal narrative editor' do
          it 'should set @goal' do
            expect(assigns(:goal)).to eq(goal)
          end

          it 'should render the edit interface' do
            expect(response).to render_template('stories/edit')
          end

          it 'should set @story_metadata to an instance of ProcrustesStoryMetadata' do
            expect(assigns(:story_metadata)).to be_a(ProcrustesStoryMetadata).
              and have_attributes(uid: uid)
          end

          describe 'draft not present' do
            it 'should set @story to a new story with theme="classic"' do
              expect(assigns(:story)).to be_a_new(DraftStory)
            end
          end

          describe 'draft present' do
            let(:uid) { 'test-test' } # This story exists in the test seed.

            it 'should set @story' do
              expect(assigns(:story)).to_not be_a_new(DraftStory)
            end
          end

          describe 'rendering views' do
            render_views

            it 'renders true for IS_GOAL' do
              expect(response.body).to match(/window\.IS_GOAL = true;/)
            end

            it 'renders migration narrative' do
              expect(response.body).to match(/window\.OP_GOAL_NARRATIVE_MIGRATION_METADATA = /)
              expect(response.body).to match(narrative_migration_marker)
            end
          end
        end

        describe 'goal does not exist' do
          it 'should 404' do
            allow(goal).to receive(:accessible?).and_return(false)
            get :edit, uid: uid
            expect(response).to have_http_status(404)
          end
        end

        describe 'goal exists' do
          let(:accessible) { true }

          describe 'single goal edit' do
            before do
              get :edit, uid: uid
            end

            it_behaves_like 'goal narrative editor'

            it 'should set @category_uid and @dashboard_uid to nil' do
              get :edit, uid: uid
              expect(assigns(:dashboard_uid)).to be_nil
              expect(assigns(:category_uid)).to be_nil
            end
            it 'should set @story_url_for_view to the correct single view url' do
              get :edit, uid: uid
              expect(assigns(:story_url_for_view)).to eq("http://test.host/stat/goals/single/#{uid}")
            end
          end

          describe 'fully-qualified goal edit' do
            before do
              get :edit, uid: uid, dashboard: dashboard, category: category
            end

            it_behaves_like 'goal narrative editor'

            it 'should set @category_uid and @dashboard_uid' do
              expect(assigns(:dashboard_uid)).to eq(dashboard)
              expect(assigns(:category_uid)).to eq(category)
            end
            it 'should set @story_url_for_view to the correct fully-qualified view url' do
              expect(assigns(:story_url_for_view)).to eq("http://test.host/stat/goals/#{dashboard}/#{category}/#{uid}")
            end
          end
        end
      end
    end
  end

  describe '#preview' do

    it_behaves_like 'action available to goal editors', :preview

    describe 'user can edit goal' do
      before do
        stub_logged_in_user
        stub_super_admin_session
        allow(StorytellerService).to receive(:downtimes).and_return([])
      end

      describe 'goal does not exist' do
        it 'should 404' do
          allow(goal).to receive(:accessible?).and_return(false)
          get :preview, uid: uid
          expect(response).to have_http_status(404)
        end
      end

      describe 'draft not present' do
        it 'should 404' do
          allow(goal).to receive(:accessible?).and_return(true)
          get :preview, uid: uid
          expect(response).to have_http_status(404)
        end
      end

      describe 'draft present' do
        let(:uid) { 'test-test' } # This story exists in the test seed.

        it 'should 200' do
          allow(goal).to receive(:accessible?).and_return(true)
          get :preview, uid: uid
          expect(response).to have_http_status(200)
        end
      end
    end
  end
end
