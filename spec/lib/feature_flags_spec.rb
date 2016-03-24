require 'rails_helper'
require_relative '../../lib/feature_flags'

describe 'FeatureFlags' do

  describe '.process_value' do
    it 'should return a string when given a string' do
      processed_value = FeatureFlags.process_value('foo')

      expect(processed_value).to be_a(String)
      expect(processed_value).to eq('foo')
      expect(processed_value).to respond_to(:to_str)
    end

    it 'should return a number when given a number' do
      processed_value = FeatureFlags.process_value('1')

      expect(processed_value).to be_a(Numeric)
      expect(processed_value).to eq(1)
      expect(processed_value).to respond_to(:to_int)
    end

    it 'should return a float when given a float' do
      processed_value = FeatureFlags.process_value('1.1')

      expect(processed_value).to be_a(Numeric)
      expect(processed_value).to be_a(Float)
      expect(processed_value).to eq(1.1)
      expect(processed_value).to respond_to(:to_int)
    end
  end

  describe '.iframe_parameters' do
    it 'should suss out query parameters correctly' do
      params = FeatureFlags.iframe_parameters('http://www.example.com/?foo=bar&bar=1')

      expect(params).to be_a(Hash)
      expect(params).to include({ 'foo' => 'bar', 'bar' => '1' })
    end
  end

  describe '.merge' do
    before :each do
      ExternalConfig.stubs(:for => test_flags)
    end

    describe 'with no expected values' do
      let(:test_flags) do
        {
          'flag_name' => {
            'defaultValue' => true
          }
        }
      end

      it 'should accept any value' do
        expect(FeatureFlags.merge({}, { 'flag_name' => 'foo' }).flag_name).to eq('foo')
        expect(FeatureFlags.merge({}, { 'flag_name' => '1' }).flag_name).to eq(1)
        expect(FeatureFlags.merge({}, { 'flag_name' => '1.1' }).flag_name).to eq(1.1)
        expect(FeatureFlags.merge({}, { 'flag_name' => 'true' }).flag_name).to eq(true)
        expect(FeatureFlags.merge({}, { 'flag_name' => 'false' }).flag_name).to eq(false)
      end

      describe 'and disableTrueFalse set' do
        let(:default_value) { 'default' }
        let(:test_flags) do
          {
            'flag_name' => {
              'defaultValue' => default_value,
              'disableTrueFalse' => true
            }
          }
        end

        it 'should still accept any value' do
          expect(FeatureFlags.merge({}, { 'flag_name' => 'foo' }).flag_name).to eq('foo')
          expect(FeatureFlags.merge({}, { 'flag_name' => '1' }).flag_name).to eq(1)
          expect(FeatureFlags.merge({}, { 'flag_name' => '1.1' }).flag_name).to eq(1.1)
          expect(FeatureFlags.merge({}, { 'flag_name' => 'true' }).flag_name).to eq(true)
          expect(FeatureFlags.merge({}, { 'flag_name' => 'false' }).flag_name).to eq(false)
        end
      end
    end

    describe 'with expected values' do
      let(:default_value) { true }
      let(:test_flags) do
        {
          'flag_name' => {
            'defaultValue' => default_value,
            'expectedValues' => 'foo bar'
          }
        }
      end

      it 'should exclude non-whitelisted values by dropping through to the default value' do
        expect(FeatureFlags.merge({}, { 'flag_name' => '1' }).flag_name).to eq(default_value)
        expect(FeatureFlags.merge({}, { 'flag_name' => '1.1' }).flag_name).to eq(default_value)
      end

      it 'should always accept true and false' do
        expect(FeatureFlags.merge({}, { 'flag_name' => 'true' }).flag_name).to eq(true)
        expect(FeatureFlags.merge({}, { 'flag_name' => 'false' }).flag_name).to eq(false)
      end

      it 'should accept whitelisted values' do
        expect(FeatureFlags.merge({}, { 'flag_name' => 'foo' }).flag_name).to eq('foo')
        expect(FeatureFlags.merge({}, { 'flag_name' => 'bar' }).flag_name).to eq('bar')
      end

      describe 'and disableTrueFalse set' do
        let(:default_value) { 'default' }
        let(:test_flags) do
          {
            'flag_name' => {
              'defaultValue' => default_value,
              'expectedValues' => 'foo bar',
              'disableTrueFalse' => true
            }
          }
        end

        it 'should exclude non-whitelisted values by dropping through to the default value' do
          expect(FeatureFlags.merge({}, { 'flag_name' => '1' }).flag_name).to eq(default_value)
          expect(FeatureFlags.merge({}, { 'flag_name' => '1.1' }).flag_name).to eq(default_value)
        end

        it 'should reject true and false' do
          expect(FeatureFlags.merge({}, { 'flag_name' => 'true' }).flag_name).to eq(default_value)
          expect(FeatureFlags.merge({}, { 'flag_name' => 'false' }).flag_name).to eq(default_value)
        end

        it 'should accept whitelisted values' do
          expect(FeatureFlags.merge({}, { 'flag_name' => 'foo' }).flag_name).to eq('foo')
          expect(FeatureFlags.merge({}, { 'flag_name' => 'bar' }).flag_name).to eq('bar')
        end

        describe 'but true and false are expectedValues' do #wtf
          let(:test_flags) do
            {
              'flag_name' => {
                'defaultValue' => default_value,
                'expectedValues' => 'foo bar true false',
                'disableTrueFalse' => true
              }
            }
          end

          it 'should no longer reject true and false' do
            expect(FeatureFlags.merge({}, { 'flag_name' => 'true' }).flag_name).to eq(true)
            expect(FeatureFlags.merge({}, { 'flag_name' => 'false' }).flag_name).to eq(false)
          end
        end
      end
    end

  end

  describe '.derive' do
    before :each do
      ExternalConfig.stubs(:for => config_defaults)
      CurrentDomain.stubs(:feature_flags => domain_flags)
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
        let(:domain_flags) { {} }

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
end
