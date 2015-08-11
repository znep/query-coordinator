require 'rails_helper'

describe CurrentDomainMiddleware do

  let(:app) { double(:app) }

  let(:request_host) { 'sub.domain.com' }
  let(:request_path) { '/login' }

  let(:env) do
    {
      'REQUEST_METHOD' => 'GET',
      'REQUEST_URI' => "https://#{request_host}#{request_path}",
      'SCRIPT_NAME' => request_path,
      'SERVER_NAME' => request_host,
      'SERVER_PORT' => '3000',
      'REQUEST_PATH' => request_path,
      'ORIGINAL_FULLPATH' => request_path
    }
  end

  subject { CurrentDomainMiddleware.new(app) }

  before do
    mock_current_domain = double('current_domain').as_null_object
    allow(CurrentDomain).to receive(:set).with(request_host).and_return(mock_current_domain)
  end

  context 'when request path is /version.json' do
    let(:request_path) { '/version.json' }

    it 'calls the app' do
      expect(app).to receive(:call).with(env)
      subject.call(env)
    end

  end

  context 'when request path is invalid' do
    let(:request_path) { '/some/url\\//with/bad/\?characters!@#$%^&\*(\/version.json' }

    it 'does not raise in middleware' do
      expect(app).to receive(:call).with(env)
      expect{ subject.call(env) }.to_not raise_error
    end

  end
end
