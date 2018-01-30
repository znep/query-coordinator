require 'rails_helper'

describe SiteChromeHelper do

  class DummyController < ActionController::Base
    include ApplicationHelper # which in turn includes SiteChromeHelper

    def disable_site_chrome?
      false
    end
  end

  let(:subject) { DummyController.new }

  let(:site_appearance_dbl) { instance_double(SiteAppearance) }

  before do
    allow(subject).to receive(:site_appearance).and_return(site_appearance_dbl)
  end

  describe '#enable_site_chrome?' do
    let(:preview_mode) { false }
    let(:custom_chrome_enabled) { false }

    before do
      allow(subject).to receive(:site_chrome_preview_mode?).and_return(preview_mode)
      allow(subject).to receive(:enable_custom_chrome?).and_return(custom_chrome_enabled)
    end

    context '(non-page-specific)' do
      context 'when there is no site appearance model' do
        let(:site_appearance_dbl) { nil }

        it 'returns false' do
          expect(subject.enable_site_chrome?).to eq(false)
        end
      end

      context 'when in preview mode' do
        let(:preview_mode) { true }

        it 'returns true' do
          expect(subject.enable_site_chrome?).to eq(true)
        end
      end

      context 'when custom chrome is enabled' do
        let(:custom_chrome_enabled) { true }

        it 'returns true' do
          expect(subject.enable_site_chrome?).to eq(true)
        end
      end
    end

    context '(page-specific)' do
      let(:activated) { false }

      shared_examples 'a page that depends on activation state' do
        context 'when not activated' do
          it 'returns false' do
            expect(subject.enable_site_chrome?).to eq(false)
          end
        end

        context 'when activated' do
          let(:activated) { true }

          it 'returns true' do
            expect(subject.enable_site_chrome?).to eq(true)
          end
        end
      end

      before do
        allow(subject).to receive(:is_a?).with(ActionController::Base).and_return(true)
      end

      context 'on the homepage' do
        let(:subject) { CustomContentController.new }

        before do
          allow(site_appearance_dbl).to receive(:is_activated_on?).with('homepage').and_return(activated)
          subject.instance_variable_set(:@on_homepage, true)
        end

        it_behaves_like 'a page that depends on activation state'
      end

      context 'on DataSlate pages' do
        let(:subject) { CustomContentController.new }

        before do
          allow(site_appearance_dbl).to receive(:enabled_on_dataslate?).and_return(activated)
          subject.instance_variable_set(:@on_homepage, false)
          subject.instance_variable_set(:@using_dataslate, true)
        end

        it_behaves_like 'a page that depends on activation state'
      end

      context 'on Data Lens pages' do
        let(:subject) { DataLensController.new }

        before do
          allow(site_appearance_dbl).to receive(:is_activated_on?).with('data_lens').and_return(activated)
        end

        it_behaves_like 'a page that depends on activation state'
      end

      context 'on catalog pages' do
        let(:subject) { BrowseController.new }

        before do
          allow(site_appearance_dbl).to receive(:is_activated_on?).with('open_data').and_return(activated)
        end

        it_behaves_like 'a page that depends on activation state'
      end

      context 'on the login page' do
        let(:subject) { UserSessionsController.new }

        before do
          allow(site_appearance_dbl).to receive(:is_activated_on?).with('open_data').and_return(activated)
        end

        it_behaves_like 'a page that depends on activation state'
      end

      context 'on other Open Data pages' do
        let(:govstat_enabled) { false }

        before do
          allow(site_appearance_dbl).to receive(:is_activated_on?).with('open_data').and_return(activated)
          allow(subject).to receive(:enable_govstat_chrome?).and_return(govstat_enabled)
        end

        context 'when not activated' do
          it 'returns false' do
            expect(subject.enable_site_chrome?).to eq(false)
          end
        end

        context 'when activated' do
          let(:activated) { true }

          it 'returns true' do
            expect(subject.enable_site_chrome?).to eq(true)
          end
        end
      end

      context 'for styles' do
        let(:subject) { StylesController.new }

        before do
          allow(site_appearance_dbl).to receive(:is_activated_on?).with('open_data').and_return(true)
        end

        it 'returns false even when activated' do
          expect(subject.enable_site_chrome?).to eq(false)
        end
      end
    end

  end

  describe '#enable_govstat_chrome?' do
    let(:govstat_enabled) { false }
    let(:govstat_suppressed) { false }

    before do
      allow(subject).to receive(:module_enabled?).with(:govStat).and_return(govstat_enabled)
      allow(subject).to receive(:suppress_govstat?).and_return(govstat_suppressed)
      allow(FeatureFlags).to receive(:using_signaller?).and_return(false)
      allow(FeatureFlags).to receive(:derive).and_return(:show_govstat_header => false)
    end

    context 'when GovStat is not enabled' do
      it 'returns false' do
        expect(subject.enable_govstat_chrome?).to eq(false)
      end

      it 'returns true when feature flag is enabled' do
        allow(FeatureFlags).to receive(:derive).and_return(:show_govstat_header => true)
        expect(subject.enable_govstat_chrome?).to eq(true)
      end
    end

    context 'when GovStat is enabled and suppressed' do
      let(:govstat_enabled) { true }
      let(:govstat_suppressed) { true }

      it 'returns false' do
        expect(subject.enable_govstat_chrome?).to eq(false)
      end

      it 'still returns false when feature flag is enabled' do
        allow(FeatureFlags).to receive(:derive).and_return(:show_govstat_header => true)
        expect(subject.enable_govstat_chrome?).to eq(false)
      end
    end

    context 'when GovStat is enabled and not suppressed' do
      let(:govstat_enabled) { true }

      it 'returns true' do
        expect(subject.enable_govstat_chrome?).to eq(true)
      end

      it 'still returns true when feature flag is enabled' do
        allow(FeatureFlags).to receive(:derive).and_return(:show_govstat_header => true)
        expect(subject.enable_govstat_chrome?).to eq(true)
      end
    end
  end

  describe '#enable_custom_chrome?' do
    let(:activated) { false }

    before do
      allow(site_appearance_dbl).to receive(:custom_content_activated?).and_return(activated)
    end

    context 'when the site appearance model does not have custom content' do
      it 'returns false' do
        expect(subject.enable_custom_chrome?).to eq(false)
      end
    end

    context 'when the site appearance model has custom content' do
      let(:activated) { true }

      it 'returns true' do
        expect(subject.enable_custom_chrome?).to eq(true)
      end
    end
  end

  describe '#render_site_chrome?' do
    let(:chrome_enabled) { false }
    let(:chrome_suppressed) { false }

    before do
      allow(subject).to receive(:enable_site_chrome?).and_return(chrome_enabled)
      subject.instance_variable_set(:@suppress_chrome, chrome_suppressed)
    end

    context 'when site chrome is not enabled' do
      it 'returns false' do
        expect(subject.render_site_chrome?).to eq(false)
      end
    end

    context 'when site chrome is enabled and all chrome is suppressed' do
      let(:chrome_enabled) { true }
      let(:chrome_suppressed) { true }

      it 'returns false' do
        expect(subject.render_site_chrome?).to eq(false)
      end
    end

    context 'when site chrome is enabled and all chrome is not suppressed' do
      let(:chrome_enabled) { true }

      it 'returns true' do
        expect(subject.render_site_chrome?).to eq(true)
      end
    end

    context 'for Administration' do
      let(:subject) { AdministrationController.new }
      let(:chrome_enabled) { true }

      it 'returns false' do
        expect(subject.render_site_chrome?).to eq(false)
      end
    end

    context 'for Internal' do
      let(:subject) { InternalController.new }
      let(:chrome_enabled) { true }

      it 'returns false' do
        expect(subject.render_site_chrome?).to eq(false)
      end
    end

    context 'for Internal Asset Manager' do
      let(:subject) { Administration::InternalAssetManagerController.new }
      let(:chrome_enabled) { true }

      it 'returns false' do
        expect(subject.render_site_chrome?).to eq(false)
      end
    end

    context 'for Site Appearance' do
      let(:subject) { SiteAppearanceController.new }
      let(:chrome_enabled) { true }

      it 'returns false' do
        expect(subject.render_site_chrome?).to eq(false)
      end
    end
  end

  describe '#render_legacy_chrome?' do
    let(:chrome_enabled) { false }
    let(:chrome_suppressed) { false }
    let(:govstat_enabled) { false }

    before do
      allow(subject).to receive(:enable_site_chrome?).and_return(chrome_enabled)
      allow(subject).to receive(:enable_govstat_chrome?).and_return(govstat_enabled)
      subject.instance_variable_set(:@suppress_chrome, chrome_suppressed)
    end

    context 'when site chrome is enabled and all chrome is not suppressed' do
      let(:chrome_enabled) { true }

      it 'returns false' do
        expect(subject.render_legacy_chrome?).to eq(false)
      end
    end

    context 'when site chrome is not enabled and all chrome is suppressed' do
      let(:chrome_suppressed) { true }

      it 'returns false' do
        expect(subject.render_legacy_chrome?).to eq(false)
      end
    end

    context 'when site chrome is not enabled and all chrome is not suppressed' do
      it 'returns true' do
        expect(subject.render_legacy_chrome?).to eq(true)
      end
    end

    context 'when site chrome is not enabled but we use GovStat chrome instead' do
      let(:govstat_enabled) { true }

      it 'returns false' do
        expect(subject.render_legacy_chrome?).to eq(false)
      end
    end
  end

  describe '#render_site_admin_chrome?' do
    let(:chrome_enabled) { false }
    let(:chrome_suppressed) { false }

    before do
      allow(subject).to receive(:enable_govstat_chrome?).and_return(chrome_enabled)
      subject.instance_variable_set(:@suppress_chrome, chrome_suppressed)
    end

    context 'when GovStat chrome is not enabled' do
      it 'returns false' do
        expect(subject.render_site_admin_chrome?).to eq(false)
      end
    end

    context 'when GovStat chrome is enabled and all chrome is suppressed' do
      let(:chrome_enabled) { true }
      let(:chrome_suppressed) { true }

      it 'returns false' do
        expect(subject.render_site_admin_chrome?).to eq(false)
      end
    end

    context 'when GovStat chrome is enabled and all chrome is not suppressed' do
      let(:chrome_enabled) { true }

      it 'returns true' do
        expect(subject.render_site_admin_chrome?).to eq(true)
      end
    end
  end

  describe '#site_chrome_preview_mode?' do
    let(:preview_mode) { false }

    before do
      allow(subject).to receive(:cookies).and_return(socrata_site_chrome_preview: preview_mode)
    end

    context 'when the preview mode cookie is false' do
      it 'returns false' do
        expect(subject.site_chrome_preview_mode?).to eq(false)
      end
    end

    context 'when the preview mode cookie is true' do
      let(:preview_mode) { true }

      it 'returns true' do
        expect(subject.site_chrome_preview_mode?).to eq(true)
      end
    end
  end

  describe '#site_chrome_published_mode?' do
    let(:preview_mode) { false }

    before do
      allow(subject).to receive(:cookies).and_return(socrata_site_chrome_preview: preview_mode)
    end

    context 'when the preview mode cookie is true' do
      let(:preview_mode) { true }

      it 'returns false' do
        expect(subject.site_chrome_published_mode?).to eq(false)
      end
    end

    context 'when the preview mode cookie is false' do
      it 'returns true' do
        expect(subject.site_chrome_published_mode?).to eq(true)
      end
    end
  end

  describe '#site_chrome_size' do
    let(:page_view) { nil }

    before do
      subject.instance_variable_set(:@view, page_view)
    end

    context 'when not on a page with a View' do
      it 'returns nil' do
        expect(subject.site_chrome_size).to be_nil
      end
    end

    context 'when on a page with a View' do
      let(:page_view) { View.new('id' => 'four-four') }
      it 'returns "small"' do
        expect(subject.site_chrome_size).to eq('small')
      end
    end
  end

end
