require 'rails_helper'

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

  describe '#get_derived_views' do
    it 'returns nothing if the view does not exist' do
      expect(View).to receive(:find).and_return(nil)
      expect(view).not_to receive(:find_dataset_landing_page_related_content)
      expect(dataset_landing_page).not_to receive(:format_view_widget)
      results = dataset_landing_page.get_derived_views('abcd-1234', 'cookie', 'request_id')

      expect(results).to eq([])
    end

    context 'public dataset' do
      before(:each) do
        allow(View).to receive(:find).and_return(view)
        allow_any_instance_of(View).to receive(:is_public?).and_return(true)
        allow(view).to receive(:migrations).and_return({'obeId' => 'peng-uins'})
      end

      def expect_cetera_invoked_with_correct_uid(uid, uid_to_query)
        expect(Cetera::Utils).to receive(:get_derived_from_views).
          with(
            uid_to_query,
            {
              :cookie_string => 'cookie',
              :request_id => 'request_id',
              :sortBy => 'most_accessed',
              :boostDatalenses => 1.15,
              :boostStories => 1.3
            }
          ).
          at_least(:once).
          and_return([])

        dataset_landing_page.get_derived_views(uid, 'cookie', 'request_id')
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
        expect(Cetera::Utils).to receive(:get_derived_from_views).and_return([])
        results = dataset_landing_page.get_derived_views('data-lens', 'cookie', 'request_id')

        expect(results).to eq([])
      end

      it 'passes options to Cetera' do
        expect(Cetera::Utils).to receive(:get_derived_from_views).
          with(
            'peng-uins',
            {
              :cookie_string => 'cookie',
              :request_id => 'request_id',
              :sortBy => 'most_accessed',
              :limit => 19,
              :offset => 31,
              :boostDatalenses => 1.15,
              :boostStories => 1.3
            }
          ).
          and_return([])

        dataset_landing_page.get_derived_views('data-lens', 'cookie', 'request_id', 19, 31, 'most_accessed')
      end

      it 'formats the response' do
        cetera_result_double = instance_double(Cetera::Results::ResultRow, :id => 'elep-hant')
        expect(cetera_result_double).to receive(:get_preview_image_url).and_return('image')
        expect(Cetera::Utils).to receive(:get_derived_from_views).and_return([cetera_result_double])
        expect(dataset_landing_page).to receive(:format_view_widget).
          and_return(formatted_view)
        results = dataset_landing_page.get_derived_views('data-lens', 'cookie', 'request_id')

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
        results = dataset_landing_page.get_derived_views('abcd-1234', 'cookie', 'request_id')

        expect(results).to eq([formatted_featured_item])
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

      result = dataset_landing_page.get_featured_content(
        'view-wooo',
        'cookies',
        'request_id'
      )

      expect(result.length).to eq(3)
    end
  end

  describe '#get_formatted_view_widget_by_id' do
    it 'uses View.find to retrieve the view by id' do
      expect(View).to receive(:find).and_return(view)

      expect(dataset_landing_page).to receive(:format_view_widget).
        and_return(formatted_featured_item).
        exactly(1).times

      result = dataset_landing_page.get_formatted_view_widget_by_id(
        'abcd-1234',
        'cookies',
        'request_id'
      )

      expect(result).to eq(formatted_featured_item)
    end
  end
end
