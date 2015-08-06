require 'spec_helper'
require 'health_check_middleware'
require 'rack'

describe HealthCheckMiddleware do
  let(:app) { double('app') }
  let(:request_path) { '/health-check' }
  let(:env) do
    {
      'REQUEST_HOST' => 'sub.domain.com',
      'REQUEST_METHOD' => 'GET',
      'REQUEST_URI' => "http://sub.domain.com#{request_path}",
      'SCRIPT_NAME' => request_path,
      'SERVER_NAME' => 'sub.domain.com',
      'SERVER_PORT' => '3000',
      'REQUEST_PATH' => request_path,
      'ORIGINAL_FULLPATH' => request_path
    }
  end

  subject { HealthCheckMiddleware.new(app) }

  describe '#call' do
    let(:result) { subject.call(env) }

    it 'does not call app' do
      expect(app).to_not receive(:call).with(env)
      expect(result).to be_an(Array)
    end

    it 'includes Content-Type in headers' do
      expect(result[1]['Content-Type']).to eq('text/plain')
    end

    context 'when request path is not /health-check' do
      let(:request_path) { '/' }

      it 'passes through' do
        expect(app).to receive(:call).with(env)
        expect(result).to be_an(Array)
      end
    end
  end

end
