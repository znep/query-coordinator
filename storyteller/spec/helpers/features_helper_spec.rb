require 'rails_helper'

RSpec.describe FeaturesHelper, type: :helper do

  before(:each) do
    stub_current_domain # required for features, not feature flags
  end

  describe '#open_performance_enabled?' do
    let(:features) { [] }

    before do
      set_features(features)
    end

    it 'returns false by default' do
      expect(helper.open_performance_enabled?).to eq(false)
    end

    context 'when govstat feature is enabled' do
      let(:features) { %w( govstat ) }

      it 'returns true if the corresponding feature is enabled' do
        expect(helper.open_performance_enabled?).to eq(true)
      end
    end
  end

  describe '#render_admin_header?' do
    let(:features) { [] }
    let(:feature_flags) { {} }

    before do
      set_feature_flags(feature_flags)
      set_features(features)
    end

    it 'returns false if feature flag and feature are off' do
      expect(helper.render_admin_header?).to eq(false)
    end

    context 'when show_govstat_header feature flag is enabled' do
      let(:feature_flags) { {'show_govstat_header' => true} }

      it 'returns true' do
        expect(helper.render_admin_header?).to eq(true)
      end
    end

    context 'when govstat feature is enabled' do
      let(:features) { %w( govstat ) }

      it('returns true') do
        expect(helper.render_admin_header?).to eq(true)
      end
    end

    context 'when govstat feature is enabled' do
      let(:features) { %w( govstat ) }
      let(:feature_flags) { {'show_govstat_header' => true} }

      it('returns true') do
        expect(helper.render_admin_header?).to eq(true)
      end
    end
  end

  describe '#staging_lockdown_enabled?' do
    let(:features) { [] }

    before do
      set_features(features)
    end

    it 'returns false by default' do
      expect(helper.staging_lockdown_enabled?).to eq(false)
    end

    context 'when staging_lockdown_ignore_hosts does not include the current domain' do
      before do
        allow(Rails.application.config).to receive(:staging_lockdown_ignore_hosts).and_return(['example.com'])
      end

      it 'returns false' do
        expect(helper.staging_lockdown_enabled?).to eq(false)
      end
    end

    context 'when staging_lockdown feature is enabled' do
      let(:features) { %w( staging_lockdown ) }

      it 'returns true' do
        expect(helper.staging_lockdown_enabled?).to eq(true)
      end

      context 'when staging_lockdown_ignore_hosts includes the current domain' do
        before do
          allow(Rails.application.config).to receive(:staging_lockdown_ignore_hosts).and_return([helper.request.host])
        end

        it 'returns false' do
          expect(helper.staging_lockdown_enabled?).to eq(false)
        end
      end

      context 'when staging_lockdown_ignore_hosts does not include the current domain' do
        before do
          allow(Rails.application.config).to receive(:staging_lockdown_ignore_hosts).and_return(['example.com'])
        end

        it 'returns true' do
          expect(helper.staging_lockdown_enabled?).to eq(true)
        end
      end
    end
  end

  describe '#mixpanel_tracking_enabled?' do
    let(:token) { 'a token' }
    let(:feature_flag) { true }

    let(:result) { helper.mixpanel_tracking_enabled? }

    before do
      allow(Rails.application.config).to receive(:mixpanel_token).and_return(token)
      set_feature_flags('enable_storyteller_mixpanel' => feature_flag)
      allow(helper).to receive(:mixpanel_tracking_feature_enabled?).and_return(false)
      allow(helper).to receive(:full_mixpanel_tracking_feature_enabled?).and_return(false)
    end

    context 'when no Mixpanel token exists' do
      let(:token) { nil }

      it 'returns false' do
        expect(result).to eq(false)
      end
    end

    context 'when the feature flag is disabled' do
      let(:feature_flag) { false }

      it 'returns false' do
        expect(result).to eq(false)
      end
    end

    context 'when a Mixpanel token exists and the feature flag is enabled but no features are set' do
      let(:feature_flag) { true }
      let(:token) { 'sweet token' }

      it 'returns false' do
        expect(result).to eq(false)
      end

      context 'when mixpanelTracking module is enabled' do
        before do
          allow(helper).to receive(:mixpanel_tracking_feature_enabled?).and_return(true)
        end

        it 'returns true' do
          expect(result).to eq(true)
        end
      end

      context 'when fullMixpanelTracking module is enabled' do
        before do
          allow(helper).to receive(:full_mixpanel_tracking_feature_enabled?).and_return(true)
        end

        it 'returns true' do
          expect(result).to eq(true)
        end
      end
    end
  end

  describe '#mixpanel_tracking_feature_enabled?' do
    let(:features) { [] }
    let(:result) { helper.mixpanel_tracking_feature_enabled? }

    before do
      set_features(features)
    end

    it 'defaults to false' do
      expect(result).to eq(false)
    end

    context 'when mixpanelTracking feature is enabled' do
      let(:features) { %w( mixpaneltracking ) }

      it 'returns true' do
        expect(result).to eq(true)
      end
    end
  end

  describe '#full_mixpanel_tracking_feature_enabled?' do
    let(:features) { [] }
    let(:result) { helper.full_mixpanel_tracking_feature_enabled? }

    before do
      set_features(features)
    end

    it 'defaults to false' do
      expect(result).to eq(false)
    end

    context 'when fullMixpanelTracking feature is enabled' do
      let(:features) { %w( fullmixpaneltracking ) }

      it 'returns true' do
        expect(result).to eq(true)
      end
    end
  end

  describe '#pendo_tracking_enabled?' do
    context 'when requirements not met' do
      it 'returns false if pendo not enabled' do
        allow(Rails.application.config).to receive(:pendo_token).and_return('token')
        set_features([])

        expect(pendo_tracking_enabled?).to be_falsey
      end

      it 'returns false if pendo token not set' do
        allow(Rails.application.config).to receive(:pendo_token).and_return(nil)
        set_features(['pendo_tracking'])

        # Using be_falsey because .try method returns falsey (nil) not false
        expect(pendo_tracking_enabled?).to be_falsey
      end
    end

    context 'when we can use pendo_tracking' do
      it 'returns true' do
        allow(Rails.application.config).to receive(:pendo_token).and_return('token')
        set_features(['pendo_tracking'])

        expect(pendo_tracking_enabled?).to be_truthy
      end
    end
  end

end
