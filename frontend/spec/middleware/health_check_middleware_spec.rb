require 'rails_helper'

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

  before do
    core_server_connection = double('connection')
    allow(CoreServer::Base).to receive(:connection).and_return(core_server_connection)
    allow(core_server_connection).to receive(:create_request).
      with('/health_check').
      and_return('{"erroneousRequest":0,"error":false,"status":"Fine, thanks for asking.","totalRequests":0}')
  end

  describe '#call' do
    let(:result) { subject.call(env) }

    it 'does not call app' do
      expect(app).to_not receive(:call).with(env)
      expect(result).to be_an(Array)
    end

    it 'responds with success' do
      expect(result).to eq([
        200,
        {'Content-Type' => 'text/plain'},
        ["WARNING\nNo requests in window."]
      ])
    end

    context 'when request path is not /health-check' do
      let(:request_path) { '/' }

      it 'passes through' do
        expect(app).to receive(:call).with(env)
        expect(result).to be_an(Array)
      end
    end

    context 'when core server check raises' do
      before do
        allow(CoreServer::Base.connection).to receive(:create_request).
          with('/health_check').
          and_raise('the error message')
      end

      it 'responds with 200 and an error message' do
        expect(result).to eq([
          200,
          {'Content-Type' => 'text/plain'},
          ["ERROR\n", "Error fetching core server health status\n", 'the error message']
        ])
      end
    end

    context 'when core server check returns invalid health status' do
      before do
        allow(CoreServer::Base.connection).to receive(:create_request).
          with('/health_check').
          and_return('[]')
      end

      it 'responds with 500 and an error message' do
        expect(result).to eq([
          500,
          {'Content-Type' => 'text/plain'},
          ["ERROR\n", "Core server returned malformed health check:\n", '[]']
        ])
      end
    end

    context 'when successful requests in window' do
      before do
        subject.instance_exec(200, 1.minute.ago) { |status, time| @request_log.push [status, time] }
      end

      it 'responds with success' do
        expect(result).to eq([
          200,
          {'Content-Type' => 'text/plain'},
          ["OK\n", "0% failure.\n", "Core server says: 'Fine, thanks for asking.'"]
        ])
      end
    end

    context 'when errorful requests in window' do
      before do
        subject.instance_exec(500, 1.minute.ago) { |status, time| @request_log.push [status, time] }
      end

      it 'reports errors' do
        expect(result).to eq([
          500,
          {'Content-Type' => 'text/plain'},
          ["ERROR\n", "100% failure.\n", "Core server says: 'Fine, thanks for asking.'"]
        ])
      end
    end
  end

end
