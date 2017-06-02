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
  let(:revision_number) { 'abcdefg' }
  let(:revision_date) { 'the timestamp' }

  before do
    stub_const('REVISION_NUMBER', revision_number)
    stub_const('REVISION_DATE', revision_date)
  end

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

    describe 'for non /version.json requests' do

      it 'calls the app' do
        expect(app).to receive(:call).with(environment_hash_without_version_json)
        subject.call(environment_hash_without_version_json)
      end

    end

    describe 'for /version.json request' do

      it 'does not call app' do
        expect(app).to receive(:call).never
        subject.call(environment_hash_with_version_json)
      end

      describe 'when there is an error getting version' do

        before do
          expect(Frontend).to receive(:version).and_raise(StandardError)
        end

        it 'returns a JSON payload without the version' do
          expect(subject.call(environment_hash_with_version_json)).to eql([
            '200',
            {'Content-Type' => 'application/json'},
            ["{\"facility\":\"frontend\",\"revision\":\"abcdefg\",\"timestamp\":\"the timestamp\"}"]
          ])
        end

      end

      describe 'when there is not an error' do

        before do
          expect(Frontend).to receive(:version).and_return('1.2.3')
        end

        it 'returns a full JSON payload when all data is available' do
          expect(subject.call(environment_hash_with_version_json)).to eql([
            '200',
            {'Content-Type' => 'application/json'},
            ["{\"facility\":\"frontend\",\"revision\":\"#{revision_number}\",\"timestamp\":\"#{revision_date}\",\"version\":\"1.2.3\"}"]
          ])
        end

        context 'when revision does not exist' do
          let(:revision_number) { nil }
          let(:revision_date) { nil }

          it 'returns a JSON payload without revision information' do
            expect(subject.call(environment_hash_with_version_json)).to eql([
              '200',
              {'Content-Type' => 'application/json'},
              ["{\"facility\":\"frontend\",\"revision\":null,\"timestamp\":null,\"version\":\"1.2.3\"}"]
            ])
          end
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
