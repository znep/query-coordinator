require 'rails_helper'
require_relative '../../lib/dataslate_routing'

describe DataslateRouting do
  before(:each) do
    allow(Page).to receive(:routing_table).and_return(service_response)
    allow_any_instance_of(CoreServer::Connection).to receive(:get_request).
      and_return(dataset_response)
  end
  def pathify(path)
    { 'path' => path }
  end

  let(:service_response) { %w( /svc1 /svc/:slug /svc/:slug/end ).map(&method(:pathify)) }
  let(:dataset_response) { %w( /ds1 /ds/:slug /ds/:slug/end ).map(&method(:pathify)).to_json }
  let(:page_result) { { page: Page.new, from: page_source, vars: page_vars } }
  let(:page_vars) { [ ] }

  describe '.for' do
    context 'if looking up from the Pages Service' do
      before(:each) do
        allow(Page).to receive(:find_by_unique_path).and_return(Page.new)
      end
      let(:page_source) { :service }

      it 'should return a page' do
        expect(DataslateRouting.for('/svc1')).to eq(page_result)
      end

      it 'should return nil if page does not exist' do
        expect(DataslateRouting.for('/missing')).to eq(nil)
      end

      context 'when it has vars' do
        let(:page_vars) { [ 'foo' ] }
        it 'should return a page with vars' do
          expect(DataslateRouting.for('/svc/foo')).to eq(page_result)
          expect(DataslateRouting.for('/svc/foo/end')).to eq(page_result)
        end
      end
    end

    context 'if looking up from the Pages Dataset' do
      before(:each) do
        allow_any_instance_of(DataslateRouting).to receive(:fetch_from_pages_dataset).
          and_return(Page.new)
      end
      let(:page_source) { :dataset }

      it 'should return a page' do
        expect(DataslateRouting.for('/ds1')).to eq(page_result)
      end

      it 'should return nil if page does not exist' do
        expect(DataslateRouting.for('/missing')).to eq(nil)
      end

      context 'when it has vars' do
        let(:page_vars) { [ 'foo' ] }
        it 'should return a page with vars' do
          expect(DataslateRouting.for('/ds/foo')).to eq(page_result)
          expect(DataslateRouting.for('/ds/foo/end')).to eq(page_result)
        end
      end
    end
  end
end
