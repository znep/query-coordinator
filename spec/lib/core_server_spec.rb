require 'spec_helper'

describe CoreServer do
  describe '#headers_from_request' do
    let(:request) do
      double('request',
        :env => {
          'HTTP_COOKIE' => 'a cookie'
        },
        :host => 'a host'
      )
    end
    it 'returns Cookie and X-Socrata-Host headers' do
      result = CoreServer.headers_from_request(request)
      expect(result).to include(
        'X-Socrata-Host' => 'a host',
        'Cookie' => 'a cookie'
      )
    end
  end

  describe '#current_user' do

    let(:app_token) { 'the_app_token' }
    let(:headers) do
      {
        'Cookie' => '_core_session_id=bobloblaw',
        'X-Socrata-Host' => 'data.monkeybusiness.gov'
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
      'Content-type' => 'application/json'
    }
  end
end
