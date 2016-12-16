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

    before do
      stub_goal_accessibility(goal_uid, is_goal_accessible)
    end

    describe '#latest' do
      let(:action) { :latest }
      describe 'goal not visible' do
        let(:is_goal_accessible) { false }
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

          it '404s' do
            get_request
            expect(response.status).to be(404)
          end
        end
        describe 'has published narrative' do
          let(:narrative) { double('PublishedStory') }

          it '200s' do
            get_request
            expect(response.status).to be(200)
          end
        end
      end
    end

  end
end
