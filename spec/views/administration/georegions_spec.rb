require 'rails_helper'

describe 'administration/georegions.html.erb' do
  before(:each) do
    allow_any_instance_of(ActionView::Helpers::CaptureHelper).to receive(:content_for)
    allow_any_instance_of(Jammit::Helper).to receive(:include_javascripts).and_return('')
    allow_any_instance_of(ApplicationHelper).to receive(:render_translations).and_return('')
    stub_template 'administration/_left_nav.html.erb' => ''
  end

  describe 'rendering' do
    before(:each) do
      assign(:georegions, {
          :counts => {
            :available => 5,
            :enabled => 4
          },
          :custom => [],
          :default => [],
          :translations => nil
        })
      render
    end

    it 'renders' do
      expect(rendered).to include('Manage Spatial Lens')
    end

    it 'renders the available and enabled counts' do
      expect(rendered).to include('You have enabled 4 of 5 available regions')
    end

    it 'renders the table partial twice' do
      expect(view).to render_template(:partial => '_georegions_table', :count => 2)
    end
  end

  describe 'rendering partial' do

    it 'renders the table partial with data' do
      curated_region = CuratedRegion.new(
        'id' => 1,
        'name' => 'My Curated Region',
        'enabledFlag' => true,
        'defaultFlag' => false
      )
      assign(:georegions, {
          :counts => {
            :available => 1,
            :enabled => 1
          },
          :custom => [curated_region],
          :default => [],
          :translations => nil
        })
      render
      expect(rendered).to include('My Curated Region')
      expect(rendered).to include('Yes')
    end

  end
end
