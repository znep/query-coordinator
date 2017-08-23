require 'rails_helper'

describe CatalogLandingPageHelper do
  include TestHelperMethods

  let(:catalog_landing_page) { double }

  before do
    init_anonymous_environment
    helper.instance_variable_set('@catalog_landing_page', catalog_landing_page)
  end

  describe '#can_manage_catalog_landing_page?', :verify_stubs => false do
    context 'either administrator, publisher, or superadmin' do
      before do
        stub_administrator_user(helper)
      end

      it 'should return true' do
        expect(helper.can_manage_catalog_landing_page?).to eq(true)
      end
    end

    context 'none of administrator, publisher, superadmin' do
      it 'should return false' do
        expect(helper.can_manage_catalog_landing_page?).to eq(false)
      end
    end
  end

  describe '#should_render_catalog_landing_page_activator?', :verify_stubs => false do
    let(:enable_catalog_landing_page) { true }
    let(:may_activate) { true }
    let(:can_manage_catalog_landing_page) { true }
    let(:metadata) { {} }

    before do
      allow(helper).to receive(:can_manage_catalog_landing_page?).and_return(can_manage_catalog_landing_page)
      allow(CatalogLandingPage).to receive(:may_activate?).and_return(may_activate)
      allow(FeatureFlags).to receive(:value_for).and_return(:enable_catalog_landing_page)
      allow(catalog_landing_page).to receive(:metadata).and_return(metadata)
    end

    context 'when there is no existing catalog landing page' do
      let(:catalog_landing_page) { nil }

      it 'should return true' do
        expect(helper.should_render_catalog_landing_page_activator?).to eq(true)
      end
    end

    context 'when catalog landing page can be activated' do
      it 'should return true' do
        expect(helper.should_render_catalog_landing_page_activator?).to eq(true)
      end
    end

    context 'when catalog landing page cannot be activated' do
      let(:enable_catalog_landing_page) { false }
      let(:may_activate) { false }
      let(:can_manage_catalog_landing_page) { false }

      it 'should return false' do
        expect(helper.should_render_catalog_landing_page_activator?).to eq(false)
      end
    end

    context 'when metadata is present and not blank' do
      let(:metadata) { {:header => 'header'} }

      it 'should return false' do
        expect(helper.should_render_catalog_landing_page_activator?).to eq(false)
      end
    end

    context 'when metadata is present but values are blank' do
      let(:metadata) { {:header => ''} }

      it 'should return true' do
        expect(helper.should_render_catalog_landing_page_activator?).to eq(true)
      end
    end
  end
end
