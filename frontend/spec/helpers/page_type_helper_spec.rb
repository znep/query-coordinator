require 'rails_helper'

describe PageTypeHelper do
  include TestHelperMethods

  before(:each) do
    init_core_session
    init_current_domain
    init_feature_flag_signaller
  end

  describe :embed do
    it 'returns false if the cur query string parameter is not present' do
      request = mock_request('/')

      expect(embed?(request)).to eq(false)
    end

    it 'returns true if the cur query string parameter is present' do
      request = mock_request('/')
      request.params['cur'] = 'somehash'

      expect(embed?(request)).to eq(true)
    end
  end

  describe :page_type do
    it 'is a homepage' do
      request = mock_request('/fr/')

      page_type = page_type(request)

      expect(page_type).to eq('homepage')
    end

    describe 'dataslate pages' do
      it 'is a wildcard page' do
        request = mock_request('/fr/unmatched/path')

        page_type = page_type(request)

        expect(page_type).to eq('dataslate')
      end
    end

    describe 'admin pages' do
      it 'detects the main admin panel as admin' do
        @request = mock_request('/admin')
      end

      it 'detects the routing approval page as admin' do
        @request = mock_request('/admin/routing_approval/manage')
      end

      it 'detects the activity page as admin' do
        @request = mock_request('/admin/activity_feed')
      end

      it 'detects the connector page as admin' do
        @request = mock_request('/admin/connectors')
      end

      after(:each) do
        page_type = page_type(@request)
        expect(page_type).to eq('admin')
      end
    end

    describe 'profile page' do
      it 'detects the profile page as profile' do
        request = mock_request('/profile/Tiger/abcd-1234')
        page_type = page_type(request)
        expect(page_type).to eq('profile')
      end
    end

    describe 'browse page' do
      it 'detects the browse page as browse' do
        request = mock_request('/browse')
        page_type = page_type(request)
        expect(page_type).to eq('browse')
      end

      it 'detects the browse page with a query as browse-search' do
        request = mock_request('/browse?q=stuff')
        page_type = page_type(request)
        expect(page_type).to eq('browse-search')
      end
    end

    describe 'govstat pages' do
      it 'detects odysseus served pages as govstat' do
        request = mock_request('/stat/goals')
        page_type = page_type(request)
        expect(page_type).to eq('govstat')
      end

      it 'detects govstat served pages as govstat' do
        request = mock_request('/manage/reports')
        page_type = page_type(request)
        expect(page_type).to eq('govstat-admin')
      end
    end

    describe 'datasets' do
      let(:view_id) { '1234-5679' }

      it 'detects a default dataset page as dataset' do
        VCR.use_cassette 'page_type_helper/dataset_default' do
          request = mock_request("/d/#{view_id}")
          page_type = page_type(request)
          expect(page_type).to eq('dataset')
        end
      end

      it 'detects a sorted dataset page as dataset-sort' do
        VCR.use_cassette 'page_type_helper/dataset_sorted' do
          request = mock_request("/d/#{view_id}")
          page_type = page_type(request)
          expect(page_type).to eq('dataset-sort')
        end
      end

      it 'detects a grouped dataset page as dataset-grouped' do
        VCR.use_cassette 'page_type_helper/dataset_group' do
          request = mock_request("/d/#{view_id}")
          page_type = page_type(request)
          expect(page_type).to eq('dataset-grouped')
        end
      end

      describe 'detects a filtered dataset page as dataset-filter' do
        it 'with where parameter' do
          VCR.use_cassette 'page_type_helper/dataset_filter_where' do
            request = mock_request("/d/#{view_id}")
            page_type = page_type(request)
            expect(page_type).to eq('dataset-filter')
          end
        end

        it 'with having parameter' do
          VCR.use_cassette 'page_type_helper/dataset_filter_having' do
            request = mock_request("/d/#{view_id}")
            page_type = page_type(request)
            expect(page_type).to eq('dataset-filter')
          end
        end
      end

      it 'detects a page with more than query element as dataset-complex' do
        VCR.use_cassette 'page_type_helper/dataset_complex' do
          request = mock_request("/d/#{view_id}")
          page_type = page_type(request)
          expect(page_type).to eq('dataset-complex')
        end
      end

      it 'with ResourceNotFound exception on find returns other' do
        ::View.should_receive(:find).exactly(1).times.and_raise(CoreServer::ResourceNotFound.new(nil))
        request = mock_request("/d/#{view_id}")
        page_type = page_type(request)
        expect(page_type).to eq('other')
      end

      it 'with CoreServerException exception on find returns other' do
        ::View.should_receive(:find).exactly(1).times.and_raise(CoreServer::CoreServerError.new('source','authentication_required', 'something is wrong'))
        request = mock_request("/d/#{view_id}")
        page_type = page_type(request)
        expect(page_type).to eq('other')
      end
    end
  end
end
