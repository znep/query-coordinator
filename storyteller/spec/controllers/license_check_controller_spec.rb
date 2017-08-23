require 'rails_helper'

RSpec.describe LicenseCheckController, type: :controller do
  core_headers = {
    'Accept' => '*/*',
    'Accept-Encoding' => 'gzip;q=1.0,deflate;q=0.6,identity;q=0.3',
    'Content-Type' => 'application/json',
    'User-Agent' => 'Ruby',
    'X-Socrata-Federation'=>'Honey Badger'
  }

  describe '#user_has_stories_rights?' do
    context 'when unauthenticated' do
      before do
        stub_invalid_session
      end

      it 'disallows access' do
        get :user_has_stories_rights?, email: 'test.user@example.com'

        expect(response).to be_redirect
      end
    end

    context 'when authenticated' do
      before do
        stub_valid_session
        stub_current_domain
        request.env['HTTPS'] = 'on'
      end

      context 'existing user' do
        it 'is true when the user has stories rights' do
          stub_request(:get, 'http://localhost:8080/users?email=test.user@example.com&method=getByEmail').
          with(:headers => core_headers).
          to_return(
            :status => 200,
            :body => '{ "rights": [ "create_story" ] }',
            :headers => {'Content-Type' => 'application/json'}
          )

          get :user_has_stories_rights?, email: 'test.user@example.com'

          expect(response).to be_success
          expect(response.body).to eq(
            JSON.generate(userExists: true, hasStoriesRights: true)
          )
        end

        it 'is false when the user does not have stories rights' do
          stub_request(:get, 'http://localhost:8080/users?email=test.user@example.com&method=getByEmail').
          with(:headers => core_headers).
          to_return(
            :status => 200,
            :body => '{ "rights": [ "some_random_right" ] }',
            :headers => {'Content-Type' => 'application/json'}
          )

          get :user_has_stories_rights?, email: 'test.user@example.com'

          expect(response).to be_success
          expect(response.body).to eq(
            JSON.generate(userExists: true, hasStoriesRights: false )
          )
        end
      end

      context 'non-existant user' do
        it 'returns that user does not exist' do
          stub_request(:get, 'http://localhost:8080/users?email=test.user@example.com&method=getByEmail').
          with(:headers => core_headers).
          to_return(
            :status => 404,
            :body => '',
            :headers => {}
          )

          get :user_has_stories_rights?, email: 'test.user@example.com'

          expect(response).to be_success
          expect(response.body).to eq(
            JSON.generate(userExists: false, hasStoriesRights: false)
          )
        end
      end

      context 'with unrecognized param' do
        it 'responds 400' do
          get :user_has_stories_rights?, color: 'indigo'

          expect(response.status).to be(400)
          expect(response.body).to be_empty
        end
      end

      context 'and something goes wrong' do
        it 'responds 500' do
          allow(CoreServer).to receive(:core_server_http_request).and_raise(StandardError)

          get :user_has_stories_rights?, email: 'test.user@example.com'

          expect(response.status).to be(500)
          expect(response.body).to be_empty
        end
      end
    end
  end
end
