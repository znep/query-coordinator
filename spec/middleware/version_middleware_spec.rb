require 'version_middleware'
require 'time'

unless defined?(Frontend)
  class Frontend
    def self.version
      'version'
    end
  end
end

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

    let(:environment_hash_with_bad_url) do
      {
        'REQUEST_METHOD' => 'GET',
        'REQUEST_URI' => 'http://sub.domain.com/some/url\\//with/bad/\?characters!@#$%^&\*(\/version.json',
        'SCRIPT_NAME' => '/version',
        'SERVER_NAME' => 'sub.domain.com',
        'SERVER_PORT' => '3000',
        'REQUEST_PATH' => '/version',
        'ORIGINAL_FULLPATH' => '/version'
      }
    end

    describe 'for non version.json requests' do

      it 'calls the app' do
        expect(app).to receive(:call).with(environment_hash_without_version_json)
        subject.call(environment_hash_without_version_json)
      end

    end


    describe 'for version.json request' do

      describe 'when there is an error' do

        it 'returns an empty JSON payload when there is an error' do
          expect(app).to receive(:call).never
          expect(Frontend).to receive(:version).and_raise(StandardError)
          expect(subject.call(environment_hash_with_version_json)).to eql([
            '200', {'Content-Type' => 'application/json'}, ['{}']
          ])
        end

      end

      describe 'when there is not an error' do

        before do
          expect(Frontend).to receive(:version).and_return('1.2.3')
        end

        it 'returns a minimal JSON payload when there is some data' do
          expect(app).to receive(:call).never

          expect(subject.call(environment_hash_with_version_json)).to eql([
            '200', {'Content-Type' => 'application/json'}, [{version: '1.2.3'}.to_json]
          ])
        end

        it 'returns a full JSON payload when all data is available' do
          REVISION_NUMBER = '123123123123'
          REVISION_DATE = DateTime.parse('2015-01-02 03:04:05')

          expect(app).to receive(:call).never

          expect(subject.call(environment_hash_with_version_json)).to eql([
            '200', {'Content-Type' => 'application/json'}, [
            "{\"version\":\"1.2.3\",\"revision\":\"123123123123\",\"timestamp\":\"2015-01-02T03:04:05+00:00\",\"facility\":[\"frontend\",\"1.2.3\",\"123123123123\",\"2015-01-02T03:04:05+00:00\"]}"
            ]
          ])
        end

      end

      describe 'when the URL is malformed' do

        it 'forwards the request to the app' do
          expect(app).to receive(:call).with(environment_hash_with_bad_url)
          subject.call(environment_hash_with_bad_url)
        end

      end
    end
  end
end
