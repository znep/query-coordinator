require 'rails_helper'
require 'rack/etag'
require 'time'

describe ConditionalRequestHandler do

  # include Rack::Test::Methods

  let(:start) { Time.at(98765) }
  let(:manifest_data) do
    {
      "search-views-some-stuff-that-does-not-matter" => 666,
      "ab12-cd34" => 4321,
      "cd12-ab34" => 1234
    }
  end
  let(:manifest) do
    Manifest.new.tap { |mani| mani.set_manifest(manifest_data) }
  end

  before do
    Timecop.freeze(start)
  end

  after do
    Timecop.return
  end

  describe 'ETag and Last-Modified headers' do
    it 'will be set' do
      response = ActionDispatch::Response.new
      ConditionalRequestHandler.set_conditional_request_headers(response, manifest)

      expect(response.headers['ETag']).to eq(%Q("#{manifest.hash}"))
      expect(response.headers['Last-Modified']).to eq(start.httpdate)
    end

    it 'is not overwritten when integrated with Rack' do
      class MockApp
        def initialize(headers)
          @headers = headers
        end
        def call(env)
          [200, @headers, ['Hello, World!']]
        end
      end

      response = ActionDispatch::Response.new
      ConditionalRequestHandler.set_conditional_request_headers(response, manifest)

      app = MockApp.new(response.headers)
      rack_middleware = Rack::ETag.new(app)

      rack_response = rack_middleware.call({})

      expect(response.headers['ETag']).to eq(rack_response[1]['ETag'])
      expect(response.headers['Last-Modified']).to eq(rack_response[1]['Last-Modified'])
    end
  end

  describe '#check_conditional_request?' do
    let(:request) { ActionDispatch::Request.new({}) }
    let(:subject) { ConditionalRequestHandler.check_conditional_request?(request, manifest) }

    describe 'with no manifest' do
      it 'returns false' do
        manifest.set_manifest({})
        expect(subject).to be(false)
      end
    end

    describe 'with a manifest' do
      it 'returns true if the ETag includes the manifest hash' do
        request.env['HTTP_IF_NONE_MATCH'] = %Q{"test", "#{manifest.hash}"}
        expect(subject).to be(true)
      end

      it 'returns true if the Last-Modified-Since is after the latest manifest mtime' do
        request.env['HTTP_IF_MODIFIED_SINCE'] = Time.now().httpdate
        expect(subject).to be(true)
      end

      it 'returns false otherwise' do
        request.env['HTTP_IF_MODIFIED_SINCE'] = Time.at(0).httpdate
        request.env['HTTP_IF_NONE_MATCH'] = %Q{"test", "other"}
        expect(subject).to be(false)
      end
    end
  end
end
