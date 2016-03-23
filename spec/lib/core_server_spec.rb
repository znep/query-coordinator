require 'spec_helper'

describe CoreServer do
  let(:core_service_uri) { 'http://123.45.67.89:8081' }
  let(:app_token) { 'the_app_token' }
  let(:csrf_token) { 'the_csrf_token' }
  let(:http_cookie) { "_core_session_id=bobloblaw; socrata-csrf-token=#{csrf_token}" }
  let(:request_host) { 'data.monkeybusiness.gov' }
  let(:request_uuid) { '54d11372-ce94-4468-8aa5-bb9614a9e82c' }
  let(:headers) do
    {
      'Cookie' => http_cookie,
      'X-CSRF-Token' => csrf_token,
      'X-Socrata-Host' => request_host
    }
  end
  let(:injected_headers) do
    {
      'Content-type' => 'application/json'
    }
  end

  before do
    allow(Rails.application.config).to receive(:core_service_uri).and_return(core_service_uri)
    allow(Rails.application.config).to receive(:core_service_app_token).and_return(app_token)
  end

  describe '#current_user_story_authorization' do
    let(:grants) { [] }
    let(:view_rights) { [] }
    let(:user_id) { 'here-iams' }
    let(:user_role) { 'user_role' }
    let(:user_rights) { ['user_rights'] }
    let(:user) { {'id' => user_id, 'roleName' => user_role, 'rights' => user_rights } }
    let(:view) { {'owner' => {'id' => 'here-iams'}, 'grants' => grants, 'rights' => view_rights} }
    let(:subject) { CoreServer.current_user_story_authorization }

    before do
      allow(::RequestStore).to receive(:store) { {:story_uid => 'what-what'} }
      allow(CoreServer).to receive(:current_user) { user }
      allow(CoreServer).to receive(:get_view) { view }
    end

    describe 'when a user without a role or rights' do
      let(:user_id) { 'note-this' }
      let(:user_role) { nil }
      let(:user_rights) { nil }

      it 'returns role "unknown" and an empty list of rights' do
        expect(subject).to eql({
          'viewRole' => 'unknown',
          'viewRights' => [],
          'domainRole' => 'unknown',
          'domainRights' => []
        })
      end
    end

    describe 'when primary owner' do
      it 'returns role, rights, and a key indicating primary owner' do
        expect(subject).to eql({
          'viewRole' => 'owner',
          'viewRights' => view_rights,
          'domainRole' => user_role,
          'domainRights' => user_rights,
          'primary' => true
        })
      end
    end

    describe 'when a shared contributor' do
      let(:user_id) { 'share-user' }
      let(:grants) { [{'userId' => 'share-user', 'type' => 'contributor'}] }

      it 'returns role, rights' do
        expect(subject).to eql({
          'viewRole' => 'contributor',
          'viewRights' => view_rights,
          'domainRole' => user_role,
          'domainRights' => user_rights
        })
      end
    end

    describe 'when unknown (usually super admin)' do
      let(:user_role) { nil }
      let(:user_id) { 'supe-radm' }

      it 'returns role, rights' do
        expect(subject).to eql({
          'viewRole' => 'unknown',
          'viewRights' => view_rights,
          'domainRole' => 'unknown',
          'domainRights' => user_rights
        })
      end
    end
  end

  describe '#headers_from_request' do
    let(:env) do
      {
        'HTTP_COOKIE' => http_cookie,
        'action_dispatch.request_id' => request_uuid
      }
    end

    let(:request) do
      double('request',
        :env => env,
        :host => request_host,
        :uuid => request_uuid
      )
    end

    it 'returns Cookie, X-CSRF-Token, and X-Socrata-Host headers' do
      result = CoreServer.headers_from_request(request)
      expect(result).to include(
        'X-Socrata-Host' => request_host,
        'X-CSRF-Token' => csrf_token,
        'Cookie' => http_cookie
      )
    end

    context 'when cookie does not contain csrf token' do
      let(:http_cookie) { "_core_session_id=bobloblaw" }

      it 'returns Cookie and X-Socrata-Host headers only' do
        result = CoreServer.headers_from_request(request)
        expect(result).to include(
          'X-Socrata-Host' => request_host,
          'Cookie' => http_cookie
        )
        expect(result).to_not include('X-CSRF-Token')
      end
    end

    context 'with no incoming X-Socrata-RequestId' do
      it 'returns the request uuid as X-Socrata-RequestId' do
        result = CoreServer.headers_from_request(request)
        expected_uuid = '54d11372ce9444688aa5bb9614a9e82c' # dashes removed from request_uuid
        expect(result).to include(
          'X-Socrata-RequestId' => expected_uuid
        )
      end
    end


    context 'with an incoming X-Socrata-RequestId' do
      let(:incoming_id) { 'id from header' }
      let(:env) do
        {
          'HTTP_X_SOCRATA_REQUESTID' => incoming_id
        }
      end

      it 'passes through' do
        result = CoreServer.headers_from_request(request)
        expect(result).to include(
          'X-Socrata-RequestId' => incoming_id
        )
      end
    end
  end

  describe '#create_view' do
    let(:title) { "A Title" }
    let(:working_copy_4x4) { "test-test" }
    let(:published_4x4) { "publ-ishd" }

    before do
      allow(CoreServer).to receive(:view_request).and_return("id" => working_copy_4x4)
      allow(CoreServer).to receive(:core_server_request_with_retries).and_return("id" => published_4x4)
    end

    it 'creates a new view' do
      expect(CoreServer).
        to receive(:view_request).
        with(verb: :post, data: CoreServer.view_with_title(title), query_params: nil)

      CoreServer.create_view(title)
    end

    it 'publishes a working copy' do
      expect(CoreServer).
        to receive(:core_server_request_with_retries).
        with(verb: :post, path: "/views/#{working_copy_4x4}/publication.json")

      CoreServer.create_view(title)
    end

    describe 'when view publication succeeds' do
      it 'returns a published view' do
        view = CoreServer.create_view(title)
        expect(view['id']).to eq(published_4x4)
      end
    end

    describe 'when view publication fails' do
      before do
        allow(CoreServer).to receive(:core_server_request_with_retries).and_return(nil)
      end

      it 'deletes the working copy' do
        expect(CoreServer).
          to receive(:core_server_request_with_retries).
          with(verb: :delete, path: "/views/#{working_copy_4x4}")

        CoreServer.create_view(title)
      end

      it 'returns nil' do
        expect(CoreServer.create_view(title)).to be(nil)
      end
    end
  end

  describe '#core_server_http_request' do
    let(:mock_headers) do
      {
        'Cookie' => 'Yummy',
        'Lucky' => 'You'
      }
    end
    let(:options) do
      {
        verb: :get,
        path: '/blah.json'
      }
    end
    let(:mock_http) { double('net_http').as_null_object }
    let(:mock_get) { spy('net_http_get') }

    before do
      allow(RequestStore.store).to receive(:[]).with(:socrata_session_headers).and_return(mock_headers)
      allow(Net::HTTP).to receive(:new).and_return(mock_http)
      allow(Net::HTTP::Get).to receive(:new).with("#{options[:path]}").and_return(mock_get)
      expect(mock_http).to receive(:request).with(mock_get)

      allow(mock_get).to receive(:[]=)
    end

    let(:make_request) { CoreServer.core_server_http_request(options) }

    it 'sets headers from request store' do
      make_request
      expect(mock_get).to have_received(:[]=).with('Cookie', 'Yummy')
      expect(mock_get).to have_received(:[]=).with('Lucky', 'You')
    end

    it 'merges Content-type into request headers' do
      make_request
      expect(mock_get).to have_received(:[]=).with('Content-type', 'application/json')
    end

    it 'merges X-App-Token into request headers' do
      make_request
      expect(mock_get).to have_received(:[]=).with('X-App-Token', 'the_app_token')
    end
  end

  describe '#generate_query_params' do
    it 'should return a string containing a URL-safe parameterized string when given a Hash' do
      result = CoreServer.generate_query_params({param1: 'rawr', param2: 'something'})
      expect(result).to eq('param1=rawr&param2=something')
    end

    it 'should return a string container a URL-safe parameterized string when given a string' do
      result = CoreServer.generate_query_params('param1=rawr&param2=something')
      expect(result).to eq('param1=rawr&param2=something')
    end

    it 'should return nil when given something that is not a string or Hash' do
      result = CoreServer.generate_query_params([])
      expect(result).to be_nil
    end
  end

  describe '#view_request' do

    before do
      allow(CoreServer).to receive(:core_server_request_with_retries) { false }
    end

    it 'raises without options' do
      expect { CoreServer.view_request() }.to raise_error(ArgumentError, /0 for \d/)
    end

    it 'raises without uid' do
      expect { CoreServer.view_request(verb: :get) }.to raise_error(ArgumentError, /':uid' is required/)
    end

    it 'does not raise for post without uid' do
      expect { CoreServer.view_request(verb: :post) }.to_not raise_error
    end

    it 'raises when no verb is supplied' do
      expect { CoreServer.view_request(uid: 'four-four') }.to raise_error(ArgumentError, /':verb' is required/)
    end

    it 'should make a request with GET query parameters' do
      CoreServer.view_request(
        uid: 'four-four',
        verb: :get,
        query_params: {hello: 'world'}
      )

      expect(CoreServer).to have_received(:core_server_request_with_retries).with(
        hash_including(:path => '/views/four-four.json?hello=world')
      )
    end

    it 'should make a request without query parameters' do
      CoreServer.view_request(
        uid: 'four-four',
        verb: :put
      )

      expect(CoreServer).to have_received(:core_server_request_with_retries).with(
        hash_including(:path => '/views/four-four.json')
      )
    end
  end

  describe '#current_user' do
    context 'when user is logged in' do
      before do
        stub_request(:get, "#{core_service_uri}/users/current.json").
          to_return(status: 200, body: fixture('current_user.json'))
      end

      it 'returns user json' do
        result = CoreServer.current_user
        expect(result['id']).to eq('vkji-3zrf')
      end
    end

    context 'when user is not logged in' do
      before do
        stub_request(:get, "#{core_service_uri}/users/current.json").
          to_return(status: 404)
      end

      it 'returns nil' do
        result = CoreServer.current_user
        expect(result).to be_nil
      end
    end

    context 'when core server error' do
      before do
        stub_request(:get, "#{core_service_uri}/users/current.json").
          to_return(status: 500, body: fixture('error.html'), headers: { 'Content-Type' => 'text/html; charset=utf-8' })
      end

      it 'returns nil' do
        result = CoreServer.current_user
        expect(result).to be_nil
      end
    end
  end

  describe '#configurations_request' do
    before do
      stub_request(:get, /#{core_service_uri}\/configurations.json.*/).
        to_return(status: 200, body: fixture('configurations.json'))
    end

    it 'raises when no options do' do
      expect { CoreServer.configurations_request() }.to raise_error(ArgumentError, /0 for \d/)
    end

    it 'raises when no type in options' do
      expect { CoreServer.configurations_request({}) }.to raise_error(ArgumentError, /':type' is required/)
    end

    it 'makes a request with default options' do
      expect(CoreServer).to receive(:core_server_request_with_retries).with(
        hash_including(:path => '/configurations.json?defaultOnly=true&merge=true&type=test_config')
      )
      CoreServer.configurations_request(verb: :get, type: 'test_config')
    end

    it 'does not set body' do
      expect(CoreServer).to receive(:core_server_request_with_retries).with(
        hash_including(:path => '/configurations.json?defaultOnly=true&merge=true&type=test_config')
      )
      CoreServer.configurations_request(verb: :get, type: 'test_config')
    end

    it 'should make a request with default_only set to false' do
      expect(CoreServer).to receive(:core_server_request_with_retries).with(
        hash_including(:path => '/configurations.json?defaultOnly=false&merge=true&type=test_config')
      )
      CoreServer.configurations_request(verb: :get, type: 'test_config', default_only: false)
    end

    it 'should make a request with merge set to false' do
      expect(CoreServer).to receive(:core_server_request_with_retries).with(
        hash_including(:path => '/configurations.json?defaultOnly=true&merge=false&type=test_config')
      )
      CoreServer.configurations_request(verb: :get, type: 'test_config', merge: false)
    end

    it 'should make a request with both merge and default_only set to false' do
      expect(CoreServer).to receive(:core_server_request_with_retries).with(
        hash_including(:path => '/configurations.json?defaultOnly=false&merge=false&type=test_config')
      )
      CoreServer.configurations_request(verb: :get, type: 'test_config', merge: false, default_only: false)
    end
  end

  describe '#permissions_request' do
    it 'raises when no options' do
      expect { CoreServer.permissions_request() }.to raise_error(ArgumentError, /0 for \d/)
    end

    it 'raises when no uid in options' do
      expect { CoreServer.permissions_request(verb: :get, query_params: {}) }.to raise_error(ArgumentError, /':uid' is required/)
    end

    it 'raises when no verb in options' do
      expect {
        CoreServer.permissions_request(uid: 'four-four', query_params: {})
      }.to raise_error(ArgumentError, /':verb' is required/)
    end

    it 'raises when no query_params in options' do
      expect {
        CoreServer.permissions_request(verb: :get, uid: 'four-four')
      }.to raise_error(ArgumentError, /':query_params' is required/)
    end
  end

  describe '#story_themes' do
    context 'when no configurations exist' do
      before do
        stub_request(:get, "#{core_service_uri}/configurations.json?defaultOnly=false&merge=false&type=story_theme").
          to_return(status: 200, body: '[]')
      end

      it 'is empty' do
        expect(CoreServer.story_themes).to be_an(Array)
        expect(CoreServer.story_themes).to be_empty
      end
    end

    context 'when one story config' do
      before do
        stub_request(:get, "#{core_service_uri}/configurations.json?defaultOnly=false&merge=false&type=story_theme").
          to_return(status: 200, body: fixture('story_theme.json'))
      end

      it 'returns story config' do
        expect(CoreServer.story_themes.length).to eq(1)
        expect(CoreServer.story_themes.first['name']).to eq('Story Theme 1')
      end
    end

    context 'when two story configs' do
      before do
        theme_json = JSON.parse(fixture('story_theme.json').read) # this is an array of one theme
        two_themes = theme_json + theme_json
        stub_request(:get, "#{core_service_uri}/configurations.json?defaultOnly=false&merge=false&type=story_theme").
          to_return(status: 200, body: two_themes.to_json)
      end

      it 'returns all story configs' do
        expect(CoreServer.story_themes.length).to eq(2)
      end
    end
  end

  describe '#current_domain' do
    let(:domain_json) { fixture('domain.json').read }

    before do
      stub_request(:get, "#{core_service_uri}/domains").
        to_return(status: 200, body: domain_json)
    end

    it 'returns domain json' do
      result = CoreServer.current_domain
      expect(result).to eq(JSON.parse(domain_json))
    end
  end

  describe '#site_chrome' do
    context 'when no configurations exist' do
      before do
        stub_request(:get, "#{core_service_uri}/configurations.json?defaultOnly=false&merge=false&type=site_chrome").
          to_return(status: 200, body: '[]')
      end

      it 'is empty' do
        expect(CoreServer.site_chrome).to be_an(Array)
        expect(CoreServer.site_chrome).to be_empty
      end
    end

    context 'when one config exists' do
      before do
        stub_request(:get, "#{core_service_uri}/configurations.json?defaultOnly=false&merge=false&type=site_chrome").
          to_return(status: 200, body: fixture('site_chrome_config.json'))
      end

      it 'returns site_chrome config' do
        expect(CoreServer.site_chrome.length).to eq(1)
        expect(CoreServer.site_chrome.first['name']).to eq('Site Chrome')
      end
    end

  end
end
