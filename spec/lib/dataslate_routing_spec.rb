require 'rails_helper'
require_relative '../../lib/dataslate_routing'

describe DataslateRouting do
  before(:each) do
    RequestStore.clear!
    allow(Page).to receive(:routing_table).and_return(service_response)
  end
  def pathify(path)
    { 'path' => path }
  end

  let(:service_response) do
    %w( / /svc1 /svc /svc/other /svc/:slug /svc/:slug/end ).map(&method(:pathify))
  end
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
        expect(DataslateRouting.for('/svc')).to eq(page_result)
        expect(DataslateRouting.for('/svc/other')).to eq(page_result)
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

    context 'on homepages' do
      before(:each) do
        allow(Page).to receive(:find_by_unique_path).and_return(Page.new)
      end
      let(:page_source) { :service }

      it 'should return a real page' do
        expect(DataslateRouting.for('/')).to eq(page_result)
      end
    end

    context 'when cached' do
      before(:each) do
        allow(Rails.cache).to receive(:read).and_return(routing_table)
        allow(Page).to receive(:find_by_unique_path).and_return(Page.new)
      end
      let(:page_source) { :service }
      let(:routing_table) do
        { '/some/path' => { from: :service, path: '/some/path' } }
      end

      it 'should return a real page' do
        expect(DataslateRouting.for('/some/path')).to eq(page_result)
      end
    end
  end
end
