require 'rails_helper'

RSpec.describe Api::Stat::V1::Goals::DraftsController, type: :controller do
  before do
    request.env['HTTPS'] = 'on' # otherwise we get redirected to HTTPS for all requests.
  end

  let(:action) { :nothing }
  let(:goal_uid) { 'open-perf' } # This story exists in test seeds.
  let(:get_request) { get action, uid: goal_uid }
  let(:is_goal_accessible) { true }
  let(:is_goal_unauthorized) { false }

  before do
    stub_current_domain
    set_features(['govstat'])
    stub_goal_accessibility(
      goal_uid,
      :accessible => is_goal_accessible,
      :unauthorized => is_goal_unauthorized
    )
  end

  describe '#latest' do
    let(:action) { :latest }

    shared_examples 'defers permissions to odysseus' do
      describe 'goal does not exist' do
        let(:is_goal_accessible) { false }
        let(:is_goal_unauthorized) { false }

        it '404s' do
          get_request
          expect(response.status).to be(404)
        end
      end

      describe 'odysseus refuses access to goal' do
        let(:is_goal_accessible) { false }
        let(:is_goal_unauthorized) { true }

        it '403s' do
          get_request
          expect(response.status).to be(403)
        end
      end
    end

    shared_examples 'accessible endpoint' do
      it_behaves_like 'defers permissions to odysseus'

      describe 'goal accessible' do
        let(:is_goal_accessible) { true }

        describe 'no draft' do
          let(:goal_uid) { 'NOPE DOES NOT EXIST' }

          it '404s' do
            get_request
            expect(response.status).to be(404)
          end
        end

        describe 'has draft' do
          it '200s' do
            get_request
            expect(response.status).to be(200)
          end
        end
      end
    end

    shared_examples 'inaccessible endpoint' do
      it_behaves_like 'defers permissions to odysseus'

      describe 'goal accessible' do # AKA, public goal
        let(:is_goal_accessible) { true }

        describe 'no draft' do
          let(:goal_uid) { 'NOPE DOES NOT EXIST' }

          it '403s' do
            get_request
            expect(response.status).to be(403)
          end
        end

        describe 'has draft' do
          it '403s' do
            get_request
            expect(response.status).to be(403)
          end
        end
      end
    end

    describe 'anon' do
      before do
        stub_invalid_session
      end

      it_behaves_like 'inaccessible endpoint'
    end

    describe 'superadmin' do
      before do
        stub_super_admin_session
      end

      it_behaves_like 'accessible endpoint'
    end

    describe 'logged in as' do
      before do
        stub_valid_session
        stub_current_user_story_authorization(auth)
      end

      describe 'unpriviledged' do
        let(:auth) { mock_user_authorization_unprivileged }
        it_behaves_like 'inaccessible endpoint'
      end

      describe 'with edit_goals right' do
        let(:auth) { mock_user_authorization_with_domain_rights(%w(edit_goals)) }
        it_behaves_like 'accessible endpoint'
      end

      describe 'without edit_goals right' do
        let(:auth) { mock_user_authorization_with_domain_rights(%w(something_else)) }
        it_behaves_like 'inaccessible endpoint'
      end
    end
  end
end
