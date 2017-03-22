require 'rails_helper'

describe VersionRequestHelper do

  describe '#is_version_json_request?' do
    let(:request_uri) { "http://some.domain.com#{path}" }
    let(:path) { '/some/path' }

    let(:result) { VersionRequestHelper.is_version_json_request?(request_uri) }

    context 'when path is not version.json' do
      let(:path) { '/some-path' }

      it 'is false' do
        expect(result).to eq(false)
      end
    end

    context 'when path is /version.json' do
      let(:path) { '/version.json' }

      it 'is true' do
        expect(result).to eq(true)
      end
    end

    context 'when path is invalid' do
      let(:path) { '/some/url\\//with/bad/\?characters!@#$%^&\*(\/version.json' }

      it 'does not raise' do
        expect{ result }.to_not raise_error
      end

      it 'is false' do
        expect(result).to eq(false)
      end
    end

  end
end
