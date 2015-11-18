require 'spec_helper'

describe CoreServer do
  let(:core_service_uri) { 'http://123.45.67.89:8081' }
  let(:app_token) { 'the_app_token' }
  let(:csrf_token) { 'the_csrf_token' }
  let(:http_cookie) { "_core_session_id=bobloblaw; socrata-csrf-token=#{csrf_token}" }
  let(:request_host) { 'data.monkeybusiness.gov' }
  let(:request_uuid) { 'mock request uuid' }
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
        expect(result).to include(
          'X-Socrata-RequestId' => request_uuid
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
      expect { CoreServer.view_request() }.to raise_error(ArgumentError, /0 for 1/)
    end

    it 'raises without uid' do
      expect { CoreServer.view_request(verb: :get) }.to raise_error(ArgumentError, /':uid' is required/)
    end

    it 'does not raise for post without uid' do
      expect { CoreServer.view_request(verb: :post, headers: {}) }.to_not raise_error
    end

    it 'raises when no verb is supplied' do
      expect { CoreServer.view_request(uid: 'four-four') }.to raise_error(ArgumentError, /':verb' is required/)
    end

    it 'raises when no headers are supplied' do
      expect { CoreServer.view_request(uid: 'four-four', verb: :put) }.to raise_error(ArgumentError, /':headers' is required/)
    end

    it 'should make a request with GET query parameters' do
      CoreServer.view_request(
        uid: 'four-four',
        verb: :get,
        headers: {},
        query_params: {hello: 'world'}
      )

      expect(CoreServer).to have_received(:core_server_request_with_retries).with(
        hash_including(:path => '/views/four-four.json?hello=world')
      )
    end

    it 'should make a request without query parameters' do
      CoreServer.view_request(
        uid: 'four-four',
        verb: :put,
        headers: {}
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
          with(headers: headers.merge(injected_headers)).
          to_return(status: 200, body: fixture('current_user.json'))
      end

      it 'returns user json' do
        result = CoreServer.current_user(headers)
        expect(result['id']).to eq('vkji-3zrf')
      end
    end

    context 'when user is not logged in' do
      before do
        stub_request(:get, "#{core_service_uri}/users/current.json").
          with(headers: headers.merge(injected_headers)).
          to_return(status: 404)
      end

      it 'returns nil' do
        result = CoreServer.current_user(headers)
        expect(result).to be_nil
      end
    end

    context 'when core server error' do
      before do
        stub_request(:get, "#{core_service_uri}/users/current.json").
          with(headers: headers.merge(injected_headers)).
          to_return(status: 500, body: fixture('error.html'), headers: { 'Content-Type' => 'text/html; charset=utf-8' })
      end

      it 'returns nil' do
        result = CoreServer.current_user(headers)
        expect(result).to be_nil
      end
    end
  end

  describe '#configurations_request' do
    before do
      stub_request(:get, /#{core_service_uri}\/configurations.json.*/).
        with(headers: headers.merge(injected_headers)).
        to_return(status: 200, body: fixture('configurations.json'))
    end

    it 'raises when no options do' do
      expect { CoreServer.configurations_request() }.to raise_error(ArgumentError, /0 for 1/)
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
      expect { CoreServer.permissions_request() }.to raise_error(ArgumentError, /0 for 1/)
    end

    it 'raises when no uid in options' do
      expect { CoreServer.permissions_request(verb: :get, headers: headers, query_params: {}) }.to raise_error(ArgumentError, /':uid' is required/)
    end

    it 'raises when no verb in options' do
      expect {
        CoreServer.permissions_request(uid: 'four-four', headers: headers, query_params: {})
      }.to raise_error(ArgumentError, /':verb' is required/)
    end

    it 'raises when no headers in options' do
      expect {
        CoreServer.permissions_request(verb: :get, uid: 'four-four', query_params: {})
      }.to raise_error(ArgumentError, /':headers' is required/)
    end

    it 'raises when no query_params in options' do
      expect {
        CoreServer.permissions_request(verb: :get, uid: 'four-four', headers: {})
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

    # context 'when two story configs' do
    #   before do
    #     stub_request(:get, "#{core_service_uri}/configurations.json?defaultOnly=false&merge=false&type=story_theme").
    #       to_return(status: 200, body: fixture('story_theme.json'))
    #   end

    #   it 'returns story config' do
    #     expect(CoreServer.story_themes.length).to eq(1)
    #     expect(CoreServer.story_themes.first['name']).to eq('Story Theme 1')
    #   end
    # end
  end
end
