require 'rails_helper'
require_relative '../../lib/constraints/catalog_landing_page_constraint'

describe Constraints::CatalogLandingPageConstraint do

  include TestHelperMethods

  describe '#matches?' do

    subject(:constraint) { described_class.new }

    before(:each) do
      init_current_domain
      init_feature_flag_signaller(with: { enable_catalog_landing_page: true })
      allow(CatalogLandingPage).to receive(:exists?).and_return(existence)
    end
    let(:request) { double(:request, path: '/browse', query_parameters: {}) }

    context 'if the path exists' do
      let(:existence) { true }
      it 'is accepted' do
        expect(constraint.matches?(request)).to eq(true)
      end
    end

    context 'if the path does not exist' do
      let(:existence) { false }
      it 'is rejected' do
        expect(constraint.matches?(request)).to eq(false)
      end
    end

  end

end

