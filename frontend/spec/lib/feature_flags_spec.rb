require 'rails_helper'
require_relative '../../lib/feature_flags'

describe 'FeatureFlags' do

  describe '.iframe_parameters' do
    it 'should suss out query parameters correctly' do
      params = FeatureFlags.iframe_parameters('http://www.example.com/?foo=bar&bar=1')

      expect(params).to be_a(Hash)
      expect(params).to include({ 'foo' => 'bar', 'bar' => '1' })
    end
  end

  describe '.derive' do
    before :each do
      allow(FeatureFlags).to receive(:descriptions).and_return(config_defaults)
      allow(CurrentDomain).to receive(:feature_flags).and_return(domain_flags)
    end

    let(:config_defaults) do
      {
        'flag_name' => {
          'defaultValue' => default_value,
          'expectedValues' => 'domain_value view_value request_value iframe_value'
        }
      }
    end
    let(:domain_flags) { Hashie::Mash.new('flag_name' => 'domain_value') }
    # Stubbing a View object using a Hashie::Mash for simplicity
    let(:view) do
      Hashie::Mash.new.tap { |hsh| hsh.metadata!.feature_flags = { 'flag_name' => 'view_value' } }
    end
    let(:request) do
      Hashie::Mash.new.tap do |hsh|
        hsh.query_parameters = { 'flag_name' => 'request_value' }
        hsh.referer = 'http://example.com/?flag_name=iframe_value'
      end
    end

    let(:default_value) { 'config_default' }
    let(:domain_value) { domain_flags.flag_name }
    let(:view_value) { view.metadata.feature_flags.flag_name }
    let(:request_value) { request.query_parameters.flag_name }
    let(:iframe_value) { 'iframe_value' } # Yes, it's in two places. :(

    describe 'with no parameters' do
      it 'should use domain flags' do
        expect(FeatureFlags.derive.flag_name).to eq(domain_value)
      end

      describe 'and the domain flags are missing' do
        let(:domain_flags) { Hashie::Mash.new }

        it 'should return the config default' do
          expect(FeatureFlags.derive.flag_name).to eq(default_value)
        end
      end

      describe 'and the domain value is invalid' do
        let(:domain_flags) { Hashie::Mash.new('flag_name' => 'domain_invalid') }

        it 'should return the config default' do
          expect(FeatureFlags.derive.flag_name).to eq(default_value)
        end
      end
    end

    describe 'with one parameter' do
      it 'should use view metadata flags' do
        expect(FeatureFlags.derive(view).flag_name).to eq(view_value)
      end

      describe 'and invalid view metadata flags' do
        let(:view) do
          Hashie::Mash.new.tap { |hsh| hsh.metadata!.feature_flags = { 'flag_name' => 'invalid' } }
        end

        it 'should return the domain flag' do
          expect(FeatureFlags.derive(view).flag_name).to eq(domain_value)
        end
      end
    end

    describe 'with two parameters' do
      it 'should use request flags' do
        expect(FeatureFlags.derive(view, request).flag_name).to eq(request_value)
        expect(FeatureFlags.derive(nil, request).flag_name).to eq(request_value)
      end

      describe 'and invalid request flags' do
        let(:request) do
          Hashie::Mash.new.tap { |hsh| hsh.query_parameters = { 'flag_name' => 'invalid' } }
        end

        it 'should use view metadata flags when available' do
          expect(FeatureFlags.derive(view, request).flag_name).to eq(view_value)
        end

        it 'should use domain flags when no view' do
          expect(FeatureFlags.derive(nil, request).flag_name).to eq(domain_value)
        end
      end

      describe 'and is in an iframe' do
        it 'should use iframe parameters when told to' do
          expect(FeatureFlags.derive(view, request, true).flag_name).to eq(iframe_value)
          expect(FeatureFlags.derive(nil, request, true).flag_name).to eq(iframe_value)
        end

        describe 'but iframe value is invalid' do
          let(:request) do
            Hashie::Mash.new.tap do |hsh|
              hsh.query_parameters = { 'flag_name' => 'request_value' }
              hsh.referer = 'http://example.com/?flag_name=invalid'
            end
          end

          it 'should use the request parameter' do
            expect(FeatureFlags.derive(view, request, true).flag_name).to eq(request_value)
            expect(FeatureFlags.derive(nil, request, true).flag_name).to eq(request_value)
          end
        end
      end
    end
  end

  describe '.value_for' do
    let(:derived_flags) { Hashie::Mash.new.tap { |hashie| hashie.test_method = 'foo' } }

    it 'should use mutate_value to' do
      class << FeatureFlags::Getters
        define_method :test_method do |value|
          value.to_s + ' mutated'
        end
      end

      allow(FeatureFlags).to receive(:derive).and_return(derived_flags)

      expect(FeatureFlags.value_for(:test_method)).to eq('foo mutated')
    end
  end
end
