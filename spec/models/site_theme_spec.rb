require 'rails_helper'

describe SiteTheme do
  describe 'site theme model' do
    it 'can be instantiated' do
      expect { SiteTheme.new }.to_not raise_error(Exception)
    end

    # does not require auth to load
    it 'can load from core' do
      VCR.use_cassette('site_theme_loads_from_core') do
        site_theme = SiteTheme.find_one(32)
        expect(site_theme).not_to be_nil
      end
    end

    it 'can set properties as empty array' do
      site_theme = SiteTheme.new
      site_theme.update_properties({})
      expect(site_theme.properties).to eq([])
    end

    it 'can set properties from hash' do
      site_theme = SiteTheme.new
      new_properties = { 'thing' => 'something', 'other_thing' => 'something_else' }
      expected = [
        { 'name' => 'thing', 'value' => 'something' },
        { 'name' => 'other_thing', 'value' => 'something_else' }
      ]

      site_theme.update_properties(new_properties)
      expect(site_theme.properties).to eq(expected)
    end

    it 'can update properties from hash' do
      site_theme = SiteTheme.new(
        properties: [
          { 'name' => 'old_property', 'value' => 'old_value' },
          { 'name' => 'overwrite', 'value' => 'before' }
        ]
      )

      new_properties = {
        'overwrite' => 'after',
        'new_property' => 'new_value'
      }

      expected = [
        { 'name' => 'old_property', 'value' => 'old_value' },
        { 'name' => 'overwrite', 'value' => 'after' },
        { 'name' => 'new_property', 'value' => 'new_value' }
      ]

      site_theme.update_properties(new_properties)
      expect(site_theme.properties).to eq(expected)
    end
  end
end
