require 'rails_helper'
require_relative '../../lib/dataset_landing_page'

describe DatasetLandingPage do
  let(:dataset_landing_page) do
    DatasetLandingPage.new
  end

  let(:view) do
    View.new({
      :id => '1234-5678'
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

  describe '#get_popular_views' do
    before(:each) do
      allow(View).to receive(:find).and_return(view)
      allow_any_instance_of(View).to receive(:find_dataset_landing_page_related_content).and_return(
        Array.new(5, view)
      )
      allow(dataset_landing_page).to receive(:format_view_widget).and_return(formatted_view)
    end

    it 'returns all views by default' do
      expect(dataset_landing_page.get_popular_views('data-lens').length).to eq(5)
    end

    it 'respects the limit parameter' do
      expect(dataset_landing_page.get_popular_views('data-lens', 3).length).to eq(3)
      expect(dataset_landing_page.get_popular_views('data-lens', 5).length).to eq(5)
      expect(dataset_landing_page.get_popular_views('data-lens', 9001).length).to eq(5)
      expect(dataset_landing_page.get_popular_views('data-lens', -1).length).to eq(0)
      expect(dataset_landing_page.get_popular_views('data-lens', 'purple').length).to eq(0)
    end

    it 'respects the offset parameter' do
      expect(dataset_landing_page.get_popular_views('data-lens', nil, 1).length).to eq(4)
      expect(dataset_landing_page.get_popular_views('data-lens', nil, 10).length).to eq(0)
      expect(dataset_landing_page.get_popular_views('data-lens', nil, -2).length).to eq(2)
      expect(dataset_landing_page.get_popular_views('data-lens', nil, 'purple').length).to eq(5)
    end
  end

  describe '#get_featured_content' do
    it 'makes the appropriate calls to retrieve featured content' do
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
    it 'makes the appropriate calls to retrieve the view by id' do
      expect(View).to receive(:find).and_return(view)

      expect(dataset_landing_page).to receive(:format_view_widget).
        and_return(formatted_featured_item).
        exactly(1).times

      result = dataset_landing_page.get_formatted_view_widget_by_id('abcd-1234')

      expect(result).to eq(formatted_featured_item)
    end
  end
end
