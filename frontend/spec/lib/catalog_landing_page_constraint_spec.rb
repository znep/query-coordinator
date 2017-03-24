require 'rails_helper'
require_relative '../../lib/constraints/catalog_landing_page_constraint'

describe Constraints::CatalogLandingPageConstraint do

  include TestHelperMethods

  describe '#matches?' do

    subject(:constraint) { described_class.new }
    let(:path) { '/browse' }
    let(:request) { double('request', { params: request_params, path: path, query_parameters: request_params }) }
    let(:clp_configuration) { double({}) }
    let(:clp_configuration_properties) do
      catalog_queries.zip(Array.new(catalog_queries.size).map(&:to_h)).to_h
    end
    let(:catalog_queries) { [] }
    let(:custom_facets) { nil }

    before(:each) do
      init_current_domain
      init_feature_flag_signaller
      rspec_stub_feature_flags_with(:enable_catalog_landing_page => true)
      allow(CurrentDomain).to receive(:configuration).
        with(:catalog_landing_page).
        and_return(clp_configuration)
      allow(clp_configuration).to receive(:properties).
        and_return(clp_configuration_properties)

      allow(CurrentDomain).to receive(:property).
        with(:custom_facets, :catalog).
        and_return(custom_facets)
    end

    shared_examples 'an acceptable path' do
      it 'is accepted' do
        expect(constraint.matches?(request)).to eq(true)
      end
    end

    shared_examples 'an invalid path' do
      it 'is rejected' do
        expect(constraint.matches?(request)).to eq(false)
      end
    end

    context 'when the given path matches a known catalog query' do
      let(:catalog_queries) { [CGI.escape('category=Fun')] }
      let(:request_params) do
        { 'category' => 'Fun' }
      end

      it_behaves_like 'an acceptable path'
    end

    context 'when the CLP configuration does not exist on this domain' do
      let(:clp_configuration) { double('clp', { nil?: true, present?: false }) }
      let(:request_params) do
        {}
      end

      it_behaves_like 'an invalid path'
    end

    context 'when custom facets are defined' do
      let(:catalog_queries) { [CGI.escape('custom=facet')] }
      let(:custom_facets) { [ double('one', param: 'custom') ] }

      context 'and the path includes it' do
        let(:request_params) { { 'custom' => 'facet' } }

        it_behaves_like 'an acceptable path'
      end

      context 'and the path does not include it' do
        let(:request_params) { { 'custom' => 'blargh' } }

        it_behaves_like 'an invalid path'
      end
    end

    context 'when array values are used' do
      let(:catalog_queries) { [CGI.escape('tags[]=that&tags[]=this')] }

      context 'and the path includes it' do
        let(:request_params) { { 'tags' => %w( this that ) } }

        it_behaves_like 'an acceptable path'
      end

      context 'and the path does not include it' do
        let(:request_params) { { 'tags' => %w( this ) } }

        it_behaves_like 'an invalid path'
      end
    end

  end

end

