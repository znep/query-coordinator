require 'rails_helper'

RSpec.describe Stat::GoalsController, type: :controller do
  let(:dashboard) { 'dash-bord' }
  let(:category) { 'cate-gory' }
  let(:uid) { 'test-goal' }
  let(:accessible) { false }
  let(:unauthorized) { false }
  let(:narrative_migration_marker) { 'narrative migration marker' }

  let(:asset_id_one) { 'good-doog' }
  let(:document_id_one) { 1 }
  let(:created_one) { true }
  let(:document_from_core_asset_one) do
    double(
      CreateDocumentFromCoreAsset,
      :create => created_one,
      :document => double(Document, :id => document_id_one),
      :error_messages => []
    )
  end

  let(:asset_id_two) { 'baad-daab' }
  let(:document_id_two) { 2 }
  let(:document_from_core_asset_two) do
    double(
      CreateDocumentFromCoreAsset,
      :create => true,
      :document => double(Document, :id => document_id_two),
      :error_messages => []
    )
  end

  let(:goal_document_ids) do
    mapping = {}
    mapping[asset_id_one] = document_id_one
    mapping[asset_id_two] = document_id_two
    mapping
  end

  let(:narrative) do
    {
      'narrative' => [
        { 'foo' => narrative_migration_marker },
        { 'type' => 'image', 'src' => "/api/assets/#{asset_id_one}" },
        { 'type' => 'image' }, # unconfigured
        { 'type' => 'twoColLayout', 'columns' => [ { 'type' => 'image', 'src' => "/api/assets/#{asset_id_two}" } ] }
      ]
    }
  end

  let(:feature_flags) do
    {
      'open_performance_narrative_editor' => 'storyteller'
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
    stub_configurations_request
    stub_domains_request
    stub_site_chrome
    stub_current_domain
    allow(CoreServer).to receive(:story_themes).and_return([])

    allow(CreateDocumentFromCoreAsset).
      to receive(:new).with(asset_id_one, any_args).and_return(document_from_core_asset_one)
    allow(CreateDocumentFromCoreAsset).
      to receive(:new).with(asset_id_two, any_args).and_return(document_from_core_asset_two)

    allow(OpenPerformance::Goal).to receive(:new).and_return(goal)
    set_feature_flags(feature_flags)
  end

  describe '#show' do
    shared_examples 'goal viewer' do
      before do
        allow(PublishedStory).to receive(:find_by_uid).and_return(story)
      end

      describe 'no published story present' do
        let(:story) { nil }

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

      describe 'published story present' do
        let(:story) { instance_double(PublishedStory) }

        describe 'goal not accessible' do

          it '404s' do
            get :show, dashboard: dashboard , category: category , uid: uid
            expect(response).to have_http_status(404)
          end
        end

        describe 'goal accessible' do
          let(:accessible) { true }

          it '200s' do
            get :show, dashboard: dashboard , category: category , uid: uid
            expect(response).to have_http_status(:ok)
          end
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



  shared_examples 'action available to goal editors' do
    # The action_lambda parameter (via `let`) allows this shared example to work
    # regardless of HTTP verb or params.

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
          action_lambda.call
          expect(response).to have_http_status(404)
        end
      end

      describe 'private goal' do
        let(:unauthorized) { true }
        it 'redirects to login' do
          action_lambda.call
          expect(response).to have_http_status(302)
        end
      end

      describe 'public goal' do
        let(:accessible) { true }

        it 'redirects to login' do
          action_lambda.call
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
        action_lambda.call
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
            allow(OpenPerformance::Odysseus).to receive(:list_dashboards).
              and_return(
                object_double(HttpResponse.new, {ok?: true, json: %w(dash dash dash)})
              )

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
      let(:action_lambda) { -> { get :edit, uid: uid } }

      before do
        allow(goal).to receive(:configured?).and_return(true)
      end

      it_behaves_like 'action available to goal editors'

      describe 'user can edit goal' do
        before do
          stub_logged_in_user
          stub_super_admin_session
          allow(StorytellerService).to receive(:downtimes).and_return([])

          allow(OpenPerformance::Odysseus).to receive(:list_dashboards).
            and_return(
              object_double(HttpResponse.new, {ok?: true, json: %w(dash dash dash)})
            )
        end

        shared_examples 'goal narrative editor' do
          it 'should set @goal' do
            expect(assigns(:goal)).to eq(goal)
          end

          it 'should set @dashboard_list' do
            expect(assigns(:dashboard_list)).to eq(%w(dash dash dash))
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

            it 'should set @goal_document_ids to a hash of core => document mappings' do
              expect(assigns(:goal_document_ids)).to eq(goal_document_ids)
            end
          end

          describe 'draft present' do
            let(:uid) { 'test-test' } # This story exists in the test seed.

            it 'should set @story' do
              expect(assigns(:story)).to_not be_a_new(DraftStory)
            end

            it 'should set @goal_document_ids to an empty hash' do
              expect(assigns(:goal_document_ids)).to eq({})
            end
          end

          describe 'backfilling images fails' do
            let(:created_one) { false }

            it 'should render a 500' do
              expect(response).to have_http_status(500)
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
            action_lambda.call
            expect(response).to have_http_status(404)
          end
        end

        describe 'goal exists' do
          let(:accessible) { true }

          describe 'single goal edit' do
            before do
              action_lambda.call
            end

            it_behaves_like 'goal narrative editor'

            it 'should set @category_uid and @dashboard_uid to nil' do
              action_lambda.call
              expect(assigns(:dashboard_uid)).to be_nil
              expect(assigns(:category_uid)).to be_nil
            end
            it 'should set @story_url_for_view to the correct single view url' do
              action_lambda.call
              expect(assigns(:story_url_for_view)).to eq("/stat/goals/single/#{uid}")
            end
            it 'should set @story_url_for_preview to the correct single view url' do
              action_lambda.call
              expect(assigns(:story_url_for_preview)).to eq("/stat/goals/single/#{uid}/preview")
            end
          end

          describe 'fully-qualified goal edit' do
            before do
              get :edit, uid: uid, dashboard: dashboard, category: category, locale: 'en'
            end

            it_behaves_like 'goal narrative editor'

            it 'should set @category_uid and @dashboard_uid' do
              expect(assigns(:dashboard_uid)).to eq(dashboard)
              expect(assigns(:category_uid)).to eq(category)
            end
            it 'should set @story_url_for_view to the correct fully-qualified view url' do
              expect(assigns(:story_url_for_view)).to eq("/en/stat/goals/#{dashboard}/#{category}/#{uid}")
            end
            it 'should set @story_url_for_preview to the correct fully-qualified preview url' do
              expect(assigns(:story_url_for_preview)).to eq("/en/stat/goals/#{dashboard}/#{category}/#{uid}/preview")
            end
          end
        end
      end
    end
  end

  describe '#preview' do
    let(:action_lambda) { -> { get :preview, uid: uid } }

    it_behaves_like 'action available to goal editors'

    describe 'user can edit goal' do
      before do
        stub_logged_in_user
        stub_super_admin_session
        allow(StorytellerService).to receive(:downtimes).and_return([])
      end

      describe 'goal does not exist' do
        it 'should 404' do
          allow(goal).to receive(:accessible?).and_return(false)
          action_lambda.call
          expect(response).to have_http_status(404)
        end
      end

      describe 'draft not present' do
        it 'should 404' do
          allow(goal).to receive(:accessible?).and_return(true)
          action_lambda.call
          expect(response).to have_http_status(404)
        end
      end

      describe 'draft present' do
        let(:uid) { 'test-test' } # This story exists in the test seed.

        it 'should 200' do
          allow(goal).to receive(:accessible?).and_return(true)
          action_lambda.call
          expect(response).to have_http_status(200)
        end
      end
    end
  end

  describe '#copy' do
    let(:action_lambda) { -> { get :copy, uid: uid, dashboard_uid: dashboard } }

    it_behaves_like 'action available to goal editors'

    describe 'user can edit goal' do
      before do
        stub_logged_in_user
        stub_super_admin_session
        allow(StorytellerService).to receive(:downtimes).and_return([])
      end

      describe 'goal does not exist' do
        it 'should 404' do
          allow(goal).to receive(:accessible?).and_return(false)
          action_lambda.call
          expect(response).to have_http_status(404)
        end
      end

      describe 'draft not present' do
        it 'sets flash message' do
          allow(goal).to receive(:accessible?).and_return(true)
          action_lambda.call
          expect(flash[:error]).to_not be_blank
        end
      end

      describe 'draft present' do
        let(:uid) { 'open-perf' } # This story exists in the test seed.
        let(:copy_uid) { 'copy-copy' }
        let(:odysseus_response) { instance_double(HttpResponse) }

        before do
          allow(goal).to receive(:accessible?).and_return(true)
        end

        describe 'and Odysseus errors' do
          before do
            allow(OpenPerformance::Odysseus).to receive(:copy_goal).
              and_return(odysseus_response)

            allow(odysseus_response).to receive(:ok?).and_return(false)
          end

          it 'sets flash message' do
            action_lambda.call
            expect(flash[:error]).to_not be_blank
          end
        end

        describe 'under normal operation' do
          let(:cloned_goal_value) do
            clone = DraftStory.where(:uid => copy_uid)[0]
            clone.blocks[0].components[0]['value']
          end

          before do
            allow(OpenPerformance::Odysseus).to receive(:copy_goal).
              with(uid, dashboard, anything).
              and_return(odysseus_response)

            allow(odysseus_response).to receive(:ok?).and_return(true)
            allow(odysseus_response).to receive(:json).and_return({ 'new_goal_id' => copy_uid })
          end

          it 'should redirect to the edit mode for the new goal with dashboard' do
            action_lambda.call
            expect(response).to redirect_to "/stat/goals/#{dashboard}/uncategorized/#{copy_uid}/edit-story"
          end

          shared_examples 'component data updater' do
            it 'should update the goal IDs in the goal.embed component' do
              action_lambda.call
              expect(cloned_goal_value).to match(a_hash_including(
                'dashboard' => dashboard,
                'category' => 'uncategorized',
                'uid' => copy_uid
              ))
            end
          end

          describe 'with a fully-qualified goal' do
            it_should_behave_like('component data updater')
          end

          describe 'with a goal specified only by uid' do
            let(:uid) { 'goal-twoo' }
            it_should_behave_like('component data updater')
          end
        end
      end
    end
  end
end
