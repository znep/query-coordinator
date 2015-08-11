require 'spec_helper'

describe CoreServer do
  let(:csrf_token) { 'the_csrf_token' }
  let(:http_cookie) { "_core_session_id=bobloblaw; socrata-csrf-token=#{csrf_token}" }
  let(:request_host) { 'data.monkeybusiness.gov' }

  describe '#headers_from_request' do
    let(:request) do
      double('request',
        :env => {
          'HTTP_COOKIE' => http_cookie
        },
        :host => request_host
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

      it 'returns Cookie and X-Socrata-Host headers' do
        result = CoreServer.headers_from_request(request)
        expect(result).to include(
          'X-Socrata-Host' => request_host,
          'Cookie' => http_cookie
        )
      end
    end
  end

  describe '#current_user' do

    let(:app_token) { 'the_app_token' }
    let(:headers) do
      {
        'Cookie' => http_cookie,
        'X-CSRF-Token' => csrf_token,
        'X-Socrata-Host' => request_host
      }
    end

    before do
      expect(Rails.application.config).to receive(:core_service_uri).and_return('http://123.45.67.89:8081')
      allow(Rails.application.config).to receive(:core_service_app_token).and_return(app_token)
    end

    context 'when user is logged in' do
      before do
        stub_request(:get, "http://123.45.67.89:8081/users/current.json").
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
        stub_request(:get, "http://123.45.67.89:8081/users/current.json").
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
        stub_request(:get, "http://123.45.67.89:8081/users/current.json").
          with(headers: headers.merge(injected_headers)).
          to_return(status: 500, body: fixture('error.html'), headers: { 'Content-Type' => 'text/html; charset=utf-8' })
      end

      it 'returns nil' do
        result = CoreServer.current_user(headers)
        expect(result).to be_nil
      end
    end

  end

  def injected_headers
    {
      'X-App-Token' => app_token,
      'X-CSRF-Token' => csrf_token,
      'Content-type' => 'application/json'
    }
  end
end
