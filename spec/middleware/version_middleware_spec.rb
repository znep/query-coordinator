require 'version_middleware'

describe VersionMiddleware do
  let(:app) { double(:app) }

  subject { VersionMiddleware.new(app) }

  describe 'the environment hash' do
    let(:environment_hash_with_version_json) do
      {
        'REQUEST_METHOD' => 'GET',
        'REQUEST_URI' => 'http://sub.domain.com/version.json',
        'SCRIPT_NAME' => '/version.json',
        'SERVER_NAME' => 'sub.domain.com',
        'SERVER_PORT' => '3000',
        'REQUEST_PATH' => '/version.json',
        'ORIGINAL_FULLPATH' => '/version.json'
      }
    end

    let(:environment_hash_without_version_json) do
      {
        'REQUEST_METHOD' => 'GET',
        'REQUEST_URI' => 'http://sub.domain.com/version',
        'SCRIPT_NAME' => '/version',
        'SERVER_NAME' => 'sub.domain.com',
        'SERVER_PORT' => '3000',
        'REQUEST_PATH' => '/version',
        'ORIGINAL_FULLPATH' => '/version'
      }
    end

    it 'calls app when the REQUEST_URI is not "version.json"' do
      expect(app).to receive(:call).with(environment_hash_without_version_json)
      subject.call(environment_hash_without_version_json)
    end

    it 'returns the version JSON payload when the REQUEST_URI is "version.json"' do
      expect(app).to receive(:call).never

      expect(subject.call(environment_hash_with_version_json)).to eql([
        '200', {'Content-Type' => 'application/json'}, ['{}']
      ])
    end

  end
end
