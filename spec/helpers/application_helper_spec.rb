require 'rails_helper'

describe ApplicationHelper do
  include TestHelperMethods

  describe '#suppress_govstat?', :verify_stubs => false do

    let(:current_user) { double('current_user') }
    let(:member_response) { false }

    before do
      allow(helper).to receive(:current_user).and_return(current_user)
      allow(CurrentDomain).to receive(:member?).with(current_user).and_return(member_response)
    end

    context 'when response from CurrentDomain is nil' do
      let(:member_response) { nil }

      it 'returns true' do
        expect(suppress_govstat?).to eq(true)
      end
    end

    context 'when response from CurrentDomain is false' do
      let(:member_response) { false }

      it 'returns true' do
        expect(suppress_govstat?).to eq(true)
      end
    end

    context 'when response from CurrentDomain is true' do
      let(:member_response) { true }

      it 'returns false' do
        expect(suppress_govstat?).to eq(false)
      end

      context 'when @suppress_govstat is true' do
        before do
          @suppress_govstat = true
        end

        it 'returns true' do
          expect(suppress_govstat?).to eq(true)
        end
      end
    end

  end

  describe '#dataset_landing_page_enabled?' do

    let(:site_chrome_find_double) do
      double.tap { |site_chrome| allow(site_chrome).to receive(:dslp_enabled?).and_return(dslp_enabled) }
    end

    before do
      allow(SiteAppearance).to receive(:find).and_return(site_chrome_find_double)
    end

    context 'site chrome is activated' do
      let(:dslp_enabled) { true }

      it 'returns true' do
        helper.request.cookies[:socrata_site_chrome_preview] = false
        expect(dataset_landing_page_enabled?).to eq(true)
      end
    end

    context 'site chrome is not activated' do
      let(:dslp_enabled) { false }

      it 'is true if in site chrome preview mode' do
        helper.request.cookies[:socrata_site_chrome_preview] = true
        expect(dataset_landing_page_enabled?).to eq(true)
      end

      it 'is false not in site chrome preview mode' do
        helper.request.cookies[:socrata_site_chrome_preview] = false
        expect(dataset_landing_page_enabled?).to eq(false)
      end
    end

  end

  describe 'using_cetera? when feature flag is set' do

    let(:cetera_host) { 'http://localhost:1234' }
    let(:controller_name) { 'browse' }
    let(:action_name) { 'show' }

    before do
      init_current_domain
      allow(FeatureFlags).to receive(:using_signaller?).and_return(false)
      allow(FeatureFlags.derive).to receive(:cetera_search?).and_return(true)
      allow(APP_CONFIG).to receive(:cetera_host).and_return(cetera_host)
      allow(helper).to receive(:controller_name).and_return(controller_name)
      allow(helper).to receive(:action_name).and_return(action_name)
    end

    context 'cetera_host is not set' do
      let(:cetera_host) { nil }
      it 'should be false' do
        expect(helper.using_cetera?).to eq(false)
      end
    end

    context 'cetera_host is set' do
      it 'should be true' do
        expect(helper.using_cetera?).to eq(true)
      end

      context 'cetera_host syntax is incorrect' do
        let(:cetera_host) { 'localhost' }
        it 'should be false' do
          expect(Rails.logger).to receive(:error)
          expect(helper.using_cetera?).to eq(false)
        end
      end
    end

    context 'on profile controller' do
      let(:controller_name) { 'profile' }
      it 'should be false' do
        expect(helper.using_cetera?).to eq(false)
      end
    end

    context 'on browse controller' do
      context 'action is select_dataset' do
        let(:action_name) { 'select_dataset' }
        it 'should be false' do
          expect(helper.using_cetera?).to eq(false)
        end
      end
      context 'action is not select_dataset' do
        it 'should be true' do
          expect(helper.using_cetera?).to eq(true)
        end
      end
    end

    context 'on administration controller' do
      let(:controller_name) { 'administration' }
      context 'action is not home' do
        it 'should be false' do
          expect(helper.using_cetera?).to eq(false)
        end
      end
      context 'action is home' do
        let(:action_name) { 'home' }
        it 'should be false' do
          expect(helper.using_cetera?).to eq(true)
        end
      end
    end

    context 'included in non-controller classes' do
      before do
        helper.instance_eval do
          undef :controller_name, :action_name, :request
        end
      end

      after do
        helper.class_eval do
          attr_accessor :controller_name, :action_name, :request
        end
      end

      it 'should be true' do
        expect(helper.using_cetera?).to eq(true)
      end
    end

  end

end
