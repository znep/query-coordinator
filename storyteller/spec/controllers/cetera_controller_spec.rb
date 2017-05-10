require 'rails_helper'

RSpec.describe CeteraController, type: :controller do

  let(:user_search_client) { instance_double('Cetera::UserSearch') }
  let(:user_results) { [{name: 'Test User', email: 'test.user@example.com'}] }

  before do
    allow_any_instance_of(CeteraController).to receive(:user_search_client).and_return(user_search_client)
  end

  describe '#users' do
    context 'when unauthenticated' do
      before do
        stub_invalid_session
      end

      it 'disallows access' do
        get :users, email: 'test.user@example.com'

        expect(response).to be_redirect
      end
    end

    context 'when authenticated' do
      before do
        stub_valid_session
      end

      context 'with email param' do
        it 'forwards response from Cetera' do
          allow(user_search_client).to receive(:find_by_email).and_return(user_results)

          get :users, email: 'test.user@example.com'

          expect(response).to be_success
          expect(response.body).to eq(JSON.generate(user_results))
        end
      end

      context 'with unrecognized param' do
        it 'responds 400' do
          get :users, color: 'indigo'

          expect(response.status).to be(400)
          expect(response.body).to be_empty
        end
      end

      context 'and something goes wrong' do
        it 'responds 500' do
          allow(user_search_client).to receive(:find_by_email).and_raise(StandardError)

          get :users, email: 'test.user@example.com'

          expect(response.status).to be(500)
          expect(response.body).to be_empty
        end
      end
    end
  end
end
