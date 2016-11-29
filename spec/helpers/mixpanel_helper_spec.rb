require 'rails_helper'

RSpec.describe MixpanelHelper, type: :helper do

  let(:token) { 'a token' }

  describe '#mixpanel_tracking_enabled?' do
    context 'when no Mixpanel token exists' do
      before do
        allow(Rails.application.config).to receive(:mixpanel_token).and_return(nil)
        set_feature_flags(MixpanelHelper::FLAG => true)
      end

      it 'returns false' do
        expect(helper.mixpanel_tracking_enabled?).to eq(false)
      end
    end

    context 'when the feature flag is disabled' do
      before do
        allow(Rails.application.config).to receive(:mixpanel_token).and_return(token)
        set_feature_flags(MixpanelHelper::FLAG => false)
      end

      it 'returns false' do
        expect(helper.mixpanel_tracking_enabled?).to eq(false)
      end
    end

    context 'when a Mixpanel token exists and the feature flag is enabled' do
      before do
        allow(Rails.application.config).to receive(:mixpanel_token).and_return(token)
        set_feature_flags(MixpanelHelper::FLAG => true)
      end

      it 'returns true' do
        expect(helper.mixpanel_tracking_enabled?).to eq(true)
      end
    end
  end
end
