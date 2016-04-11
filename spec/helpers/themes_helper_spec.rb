require 'rails_helper'

describe ThemesHelper do
  describe '#theme_variable_key' do
    it 'prefixes the theme section to non-general sections' do
      result = helper.theme_variable_key('header', 'fg_color')
      expect(result).to eq('header_fg_color')
    end

    it 'does not prefix the theme section to general sections' do
      result = helper.theme_variable_key('general', 'bg_color')
      expect(result).to eq('bg_color')
    end
  end

  describe '#theme_value' do
    it 'returns the theme value' do
      result = helper.theme_value('fg_color', 'red')
      expect(result).to eq('red')
    end

    it 'wraps font_family theme value in strings' do
      result = helper.theme_value('font_family', 'Comic Sans')
      expect(result).to eq('"Comic Sans"')
    end
  end
end
