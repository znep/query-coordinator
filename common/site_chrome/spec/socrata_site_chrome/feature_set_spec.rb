require 'rails_helper'
require 'webmock/rspec'

describe SocrataSiteChrome::FeatureSet do
  let(:domain) { 'data.seattle.gov' }
  let(:subject) { SocrataSiteChrome::FeatureSet.new(domain) }
  let(:feature_set_json) {
    '[{ "properties": [{ "name": "SnappingSnail", "value": false }, { "name": "FloatingFox", "value": true }] }]' }
  let(:feature_set_request_status) { 200 }
  let(:coreservice_uri) { Rails.application.config_for(:config)['coreservice_uri'] }
  let(:domains_uri) { "#{coreservice_uri}/domains/#{domain}.json" }

  def parse_feature_set_json(json)
    JSON.parse(json)
  end

  before(:each) do
    stub_domains
  end

  before do
    stub_request(:get, SocrataSiteChrome::FeatureSet.feature_set_uri).
      to_return({
        status: feature_set_request_status,
        body: feature_set_json,
        headers: { 'Content-Type' => 'application/json' }
      })
  end

  describe '#feature_enabled?' do
    describe 'when the feature is enabled' do
      it 'returns true' do
        expect(subject.feature_enabled?('floatingfox')).to eq(true)
      end

      it 'is case-insensitive' do
        expect(subject.feature_enabled?('FloATingFox')).to eq(true)
      end
    end

    describe 'when the feature is disabled' do
      it 'returns false' do
        enabled = subject.feature_enabled?('snappingsnail')
        expect(enabled).to be false
      end
    end

    describe 'when the feature is non-existent' do
      it 'returns false' do
        enabled = subject.feature_enabled?('nonexistentnarwhal')
        expect(enabled).to be false
      end
    end

    describe 'when feature_set requests fail' do
      let(:feature_set_request_status) { 500 }

      it 'throws' do
        expect {
          subject.feature_enabled?('snappingsnail')
        }.to raise_error(/Failed/)
      end
    end
  end

  describe '#get_feature' do
    describe 'when feature_set requests successfully' do
      it 'returns the object that matches the name passed in' do
        feature = subject.get_feature('snappingsnail')
        expected_feature_value = parse_feature_set_json(feature_set_json).
          first['properties'].
          first

        expect(feature).to eq(expected_feature_value)
      end

      it 'returns nil when there is no match' do
        feature = subject.get_feature('nonexistentnarwhal')
        expect(feature).to be_nil
      end

      it 'is case-insensitive' do
        feature = subject.get_feature('sNAppiNGsnaiL')
        expected_feature_value = parse_feature_set_json(feature_set_json).
          first['properties'].
          first

        expect(feature).to eq(expected_feature_value)
      end
    end

    describe 'when feature_set requests fail' do
      let(:feature_set_request_status) { 500 }

      it 'throws' do
        expect {
          subject.get_feature('govstat')
        }.to raise_error(/Failed/)
      end
    end
  end

  describe '#feature_set' do
    it 'returns an unwrapped payload' do
      feature_set = subject.feature_set
      expect(feature_set).to eq(parse_feature_set_json(feature_set_json).first)
    end

    describe 'when the request is not a success? but not a failure' do
      let(:feature_set_request_status) { 301 }

      it 'throws' do
        expect {
          subject.feature_set
        }.to raise_error(/non-200/)
      end
    end

    describe 'when the request fails' do
      let(:feature_set_request_status) { 500 }

      it 'throws' do
        expect {
          subject.feature_set
        }.to raise_error(/Failed/)
      end
    end
  end
end
