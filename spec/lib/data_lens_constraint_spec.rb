require 'rails_helper'
require_relative '../../test/test_helper'
require_relative '../../lib/constraints/data_lens_constraint'

describe Constraints::DataLensConstraint do

  include TestHelperMethods

  describe '#matches?' do

    subject(:constraint) { described_class.new }
    let(:request_data_slate) { double('Request', path_parameters: {category: 'countystat', view_name: 'objective', id: 'housing'}, query_parameters: {}, cookies: 'kooky') }
    let(:request_without_query) { double('Request', path_parameters: {id: '1234-five'}, query_parameters: {}, cookies: 'kooky') }
    let(:data_lens) { double('View') }
    let(:marshalled_out) { Marshal.dump({}) }

    before :each do
      Rails.cache.clear
      allow(View).to receive(:find).and_return(data_lens)
      # We need to fake the dump mechanism because our view double is implemented
      # behind the scenes as a singleton or something else that can't be dumped,
      # and Marshal#dump is called after a new result is provided on cache miss.
      allow(Marshal).to receive(:dump).and_return(marshalled_out)

      init_current_domain
    end

    context 'when the given path is meant for data slate' do
      it 'is rejected' do
        expect(constraint.matches?(request_data_slate)).to be_falsy
      end
    end

    # the missing/invalid ID cases are covered by resource_constraint_spec.rb
    context 'when the given ID corresponds to a data lens' do

      it 'is accepted (data_lens version)' do
        allow(data_lens).to receive(:data_lens?).and_return(true)
        allow(data_lens).to receive(:standalone_visualization?).and_return(false)
        expect(constraint.matches?(request_without_query)).to be_truthy
      end

      it 'is accepted (standalone_visualization version, with flag)' do
        allow(FeatureFlags).to receive(:derive).and_return(standalone_lens_chart: true)
        allow(data_lens).to receive(:data_lens?).and_return(false)
        allow(data_lens).to receive(:standalone_visualization?).and_return(true)
        expect(constraint.matches?(request_without_query)).to be_truthy
      end

      it 'is not accepted (standalone_visualization version, without flag)' do
        allow(FeatureFlags).to receive(:derive).and_return(standalone_lens_chart: false)
        allow(data_lens).to receive(:data_lens?).and_return(false)
        allow(data_lens).to receive(:standalone_visualization?).and_return(true)
        expect(constraint.matches?(request_without_query)).to be_falsy
      end

    end

    context 'when the given ID does not correspond to a data lens' do

      it 'is not accepted' do
        allow(data_lens).to receive(:data_lens?).and_return(false)
        allow(data_lens).to receive(:standalone_visualization?).and_return(false)
        expect(constraint.matches?(request_without_query)).to be_falsy
      end

    end

  end

end
