require 'rails_helper'

RSpec.describe MixpanelHelper, type: :helper do

  describe '#mixpanel_config_options' do
    let(:result) { helper.mixpanel_config_options }

    before do
      allow(helper).to receive(:full_mixpanel_tracking_feature_enabled?).and_return(false)
    end

    it 'returns a hash of options' do
      expect(result).to be_a(Hash)
    end

    it 'sets secure_cookie to true' do
      expect(result[:secure_cookie]).to eq(true)
    end

    it 'sets cookie_expiration to nil by default' do
      expect(result[:cookie_expiration]).to eq(nil)
    end

    context 'when fullMixpanelTracking is enabled' do
      before do
        allow(helper).to receive(:full_mixpanel_tracking_feature_enabled?).and_return(true)
      end

      it 'sets cookie_expiration to 365' do
        expect(result[:cookie_expiration]).to eq(365)
      end
    end
  end
end
