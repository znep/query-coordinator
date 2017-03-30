require 'rails_helper'

RSpec.describe Api::Stat::V1::Goals::PublishedController, type: :controller do
  before do
    request.env['HTTPS'] = 'on' # otherwise we get redirected to HTTPS for all requests.
  end

  describe '#handle_authorization' do
    let(:action) { :nothing }
    let(:goal_uid) { 'goal-goal' }
    let(:get_request) { get action, uid: goal_uid }
    let(:is_goal_accessible) { false }
    let(:is_goal_unauthorized) { false }
    let(:govstat_module_enabled) { true }


    before do
      stub_current_domain
      set_features(govstat_module_enabled ? ['govstat'] : [])
      stub_goal_accessibility(
        goal_uid,
        :accessible => is_goal_accessible,
        :unauthorized => is_goal_unauthorized
      )
    end

    shared_examples 'respects govstat module' do
      describe 'open performance disabled' do
        let(:govstat_module_enabled) { false }

        it '404s' do
          get_request
          expect(response).to have_http_status(404)
        end
      end
    end

    describe '#latest' do
      let(:action) { :latest }

      describe 'goal does not exist' do
        let(:is_goal_accessible) { false }
        let(:is_goal_unauthorized) { false }

        it '404s' do
          get_request
          expect(response.status).to be(404)
        end
      end

      describe 'odysseus denies access' do
        let(:is_goal_accessible) { false }
        let(:is_goal_unauthorized) { true }

        it '403s' do
          get_request
          expect(response.status).to be(403)
        end
      end

      describe 'goal visible' do
        let(:is_goal_accessible) { true }

        before do
          allow(PublishedStory).to receive(:find_by_uid).and_return(narrative)
        end
        describe 'no published narrative' do
          let(:narrative) { nil }

          it_behaves_like 'respects govstat module'

          it '404s' do
            get_request
            expect(response.status).to be(404)
          end
        end
        describe 'has published narrative' do
          let(:narrative) { double('PublishedStory') }

          it_behaves_like 'respects govstat module'

          it '200s' do
            get_request
            expect(response.status).to be(200)
          end
        end
      end
    end

  end
end
