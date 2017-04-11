require 'rails_helper'

describe CatalogLandingPageHelper do
  include TestHelperMethods

  let(:is_publisher?) { true }
  let(:is_administrator?) { true }
  let(:is_superadmin?) { true }
  let(:catalog_landing_page) { double }

  let(:current_user) do
    user_double = double
    allow(helper).to receive(:current_user).and_return(user_double)
  end

  before do
    init_current_domain
    init_feature_flag_signaller
    current_user = init_current_user(
      ApplicationController.new.tap do |controller|
        session_double = double
        allow(session_double).to receive(:[]=)
        controller.request = ActionDispatch::Request.new(ENV)
        controller.response = ActionDispatch::Response.new
        allow(controller).to receive(:session).and_return(session_double)
      end
    )
    allow(current_user).to receive(:is_publisher?).and_return(is_publisher?)
    allow(current_user).to receive(:is_administrator?).and_return(is_administrator?)
    allow(current_user).to receive(:is_superadmin?).and_return(is_superadmin?)
    allow(helper).to receive(:current_user).and_return(current_user)
    helper.instance_variable_set('@catalog_landing_page', catalog_landing_page)
  end

  describe '#can_manage_catalog_landing_page?', :verify_stubs => false do
    context 'either administrator, publisher, or superadmin' do
      it 'should return true' do
        expect(helper.can_manage_catalog_landing_page?).to eq(true)
      end
    end

    context 'none of administrator, publisher, superadmin' do
      let(:is_publisher?){ false }
      let(:is_administrator?) { false }
      let(:is_superadmin?) { false }

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
