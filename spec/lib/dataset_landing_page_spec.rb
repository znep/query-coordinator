require 'rails_helper'
require_relative '../../lib/dataset_landing_page'
require_relative '../../lib/cetera'

describe DatasetLandingPage do
  let(:dataset_landing_page) do
    DatasetLandingPage.new
  end

  let(:view) do
    View.new({
      'id' => '1234-5678',
      'newBackend' => true
    })
  end

  let(:featured_item) do
    {
      :position => 2,
      :contentType => 'internal',
      :name => 'featured',
      :featuredView => {}
    }
  end

  let(:formatted_view) do
    {
      :name => 'Data Lens',
      :id => 'data-lens',
      :description => 'Glasses for your data!',
      :url => 'data/lens',
      :displayType => 'data_lens',
      :updatedAt => 1234567,
      :viewCount => 0,
      :isPrivate => false
    }
  end

  let(:formatted_featured_item) do
    {
      :contentType => 'internal',
      :name => 'name',
      :featuredView => formatted_view
    }
  end

  describe '#get_related_views' do
    it 'returns nothing if the view does not exist' do
      expect(View).to receive(:find).and_return(nil)
      expect(view).not_to receive(:find_dataset_landing_page_related_content)
      expect(dataset_landing_page).not_to receive(:format_view_widget)
      results = dataset_landing_page.get_related_views('abcd-1234', 'cookie', 'request_id')

      expect(results).to eq([])
    end

    context 'public dataset' do
      before(:each) do
        allow(View).to receive(:find).and_return(view)
        allow_any_instance_of(View).to receive(:is_public?).and_return(true)
        allow(view).to receive(:migrations).and_return({'obeId' => 'peng-uins'})
      end

      def expect_cetera_invoked_with_correct_uid(uid, uid_to_query)
        expect(Cetera).to receive(:get_derived_from_views).
          with(
            uid_to_query,
            {
              :sortBy => 'most_accessed',
              :cookie_string => 'cookie',
              :request_id => 'request_id'
            }
          ).
          at_least(:once).
          and_return([])

        dataset_landing_page.get_related_views(uid, 'cookie', 'request_id')
      end

      it 'uses the provided uid if view is OBE' do
        view = View.new('id' => 'peng-uins', 'newBackend' => false)
        expect(View).to receive(:find).and_return(view)
        expect(view).not_to receive(:migrations)

        expect_cetera_invoked_with_correct_uid('peng-uins', 'peng-uins')
      end

      it 'uses the provided uid if no OBE version exists' do
        expect(View).to receive(:find).and_return(view)
        expect(view).to receive(:migrations).and_raise(CoreServer::ConnectionError.new(nil))

        expect_cetera_invoked_with_correct_uid('1234-5678', '1234-5678')
      end

      it 'uses the OBE uid if an OBE version exists' do
        expect(View).to receive(:find).and_return(view)
        expect(view).to receive(:migrations).and_return('obeId' => 'peng-uins')

        expect_cetera_invoked_with_correct_uid('1234-5678', 'peng-uins')
      end

      it 'uses Cetera.get_derived_from_views to retrieve the related views from Cetera' do
        expect(Cetera).to receive(:get_derived_from_views).and_return([])
        results = dataset_landing_page.get_related_views('data-lens', 'cookie', 'request_id')

        expect(results).to eq([])
      end

      it 'passes the sort by option to Cetera' do
        expect(Cetera).to receive(:get_derived_from_views).
          with(
            'peng-uins',
            {
              :sortBy => 'date',
              :cookie_string => 'cookie',
              :request_id => 'request_id'
            }
          ).
          and_return([])

        dataset_landing_page.get_related_views('data-lens', 'cookie', 'request_id', 'date')
      end

      it 'formats the response' do
        expect(Cetera).to receive(:get_derived_from_views).and_return([{}])
        expect(dataset_landing_page).to receive(:format_view_widget).
          and_return(formatted_view)
        results = dataset_landing_page.get_related_views('data-lens', 'cookie', 'request_id')

        expect(results).to eq([formatted_view])
      end
    end

    context 'private dataset' do
      it 'uses View.find_dataset_landing_page_related_content to retrieve related views' do
        expect(View).to receive(:find).and_return(view)
        expect(view).to receive(:is_public?).and_return(false)
        expect(view).to receive(:find_dataset_landing_page_related_content).and_return([view])
        expect(dataset_landing_page).to receive(:format_view_widget).
          and_return(formatted_featured_item).
          exactly(1).times
        results = dataset_landing_page.get_related_views('abcd-1234', 'cookie', 'request_id')

        expect(results).to eq([formatted_featured_item])
      end
    end
  end

  describe '#get_popular_views' do
    def make_request(limit = nil, offset = nil)
      dataset_landing_page.get_popular_views('data-lens', 'cookie', 'request_id', limit, offset)
    end

    it 'returns an empty array if the view does not exist' do
      expect(View).to receive(:find).and_return(nil)
      expect(make_request).to eq([])
    end

    context 'public dataset' do
      before(:each) do
        allow(View).to receive(:find).and_return(view)
        allow_any_instance_of(View).to receive(:is_public?).and_return(true)
        allow(view).to receive(:migrations).and_return({'obeId' => 'peng-uins'})
      end

      def expect_cetera_invoked_with_correct_uid(uid, uid_to_query)
        expect(Cetera).to receive(:get_derived_from_views).
          with(
            uid_to_query,
            {
              :sortBy => 'most_accessed',
              :cookie_string => 'cookie',
              :request_id => 'request_id'
            }
          ).
          at_least(:once).
          and_return([])

        dataset_landing_page.get_popular_views(uid, 'cookie', 'request_id')
      end

      it 'uses the provided uid if view is OBE' do
        view = View.new('id' => 'peng-uins', 'newBackend' => false)
        expect(View).to receive(:find).and_return(view)
        expect(view).not_to receive(:migrations)

        expect_cetera_invoked_with_correct_uid('peng-uins', 'peng-uins')
      end

      it 'uses the provided uid if no OBE version exists' do
        expect(View).to receive(:find).and_return(view)
        expect(view).to receive(:migrations).and_raise(CoreServer::ConnectionError.new(nil))

        expect_cetera_invoked_with_correct_uid('1234-5678', '1234-5678')
      end

      it 'uses the OBE uid if an OBE version exists' do
        expect(View).to receive(:find).and_return(view)
        expect(view).to receive(:migrations).and_return('obeId' => 'peng-uins')

        expect_cetera_invoked_with_correct_uid('1234-5678', 'peng-uins')
      end

      it 'uses Cetera.get_derived_from_views to retrieve the related views from Cetera' do
        expect(Cetera).to receive(:get_derived_from_views).and_return([])
        expect(make_request).to eq([])
      end

      it 'formats the response' do
        expect(Cetera).to receive(:get_derived_from_views).and_return([{}])
        expect(dataset_landing_page).to receive(:format_view_widget).
          and_return(formatted_view)
        expect(make_request).to eq([formatted_view])
      end
    end

    context 'private dataset' do
      before(:each) do
        allow(View).to receive(:find).and_return(view)
        allow_any_instance_of(View).to receive(:is_public?).and_return(false)
        allow_any_instance_of(View).to receive(:find_dataset_landing_page_related_content).and_return(
          Array.new(5, view)
        )
        allow(dataset_landing_page).to receive(:format_view_widget).and_return(formatted_view)
      end

      it 'returns all views by default' do
        expect(make_request.length).to eq(5)
      end

      it 'respects the limit parameter' do
        expect(make_request(3).length).to eq(3)
        expect(make_request(5).length).to eq(5)
        expect(make_request(9001).length).to eq(5)
        expect(make_request(-1).length).to eq(0)
        expect(make_request('purple').length).to eq(0)
      end

      it 'respects the offset parameter' do
        expect(make_request(nil, 1).length).to eq(4)
        expect(make_request(nil, 10).length).to eq(0)
        expect(make_request(nil, -2).length).to eq(2)
        expect(make_request(nil, 'purple').length).to eq(5)
      end
    end
  end

  describe '#get_featured_content' do
    it 'uses View.featured_content to retrieve featured content' do
      expect(View).to receive(:find).and_return(view)
      expect_any_instance_of(View).to receive(:featured_content).and_return(
        Array.new(3, featured_item)
      )

      expect(dataset_landing_page).to receive(:format_featured_item).
        and_return(formatted_featured_item).
        exactly(3).times

      expect(dataset_landing_page.get_featured_content('view-wooo').length).to eq(3)
    end
  end

  describe '#get_formatted_view_widget_by_id' do
    it 'uses View.find to retrieve the view by id' do
      expect(View).to receive(:find).and_return(view)

      expect(dataset_landing_page).to receive(:format_view_widget).
        and_return(formatted_featured_item).
        exactly(1).times

      result = dataset_landing_page.get_formatted_view_widget_by_id('abcd-1234')

      expect(result).to eq(formatted_featured_item)
    end
  end
end