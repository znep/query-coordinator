require 'rails_helper'

RSpec.describe ThemeList, type: :model do
  let(:subject) { ThemeList.new }
  let(:theme_list) { JSON.parse(fixture('theme_list.json').read) }

  before do
    allow_any_instance_of(ActionView::Base).to receive(:render).
      with(file: "#{Rails.root}/app/views/stories/theme_list.json.erb").
      and_return(fixture('theme_list.json').read)
    allow(Theme).to receive(:all_custom_for_current_domain).and_return([])
  end

  describe '#standard_theme_list' do
    it 'returns the standard themes' do
      expect(subject.standard_theme_list.length).to eq(4)
    end
  end

  context 'with no custom themes' do
    describe '#to_json' do
      it 'renders theme_list.json.erb' do
        expect(subject.to_json).to eq(theme_list.to_json)
      end
    end

    describe '#custom_theme_list' do
      it 'returns an empty array' do
        expect(subject.custom_theme_list.length).to eq(0)
      end
    end
  end

  context 'with custom themes' do
    let(:custom_theme) { double('theme', id: 'custom-theme-1') }

    before do
      allow(Theme).to receive(:all_custom_for_current_domain).and_return([custom_theme])
      allow(custom_theme).to receive(:for_theme_list_config).and_return({ 'id' => custom_theme.id })
    end

    it 'sets custom themes' do
      expect(subject.custom_themes.length).to eq(1)
    end

    describe '#custom_theme_list' do
      it 'returns custom themes from theme_list' do
        expect(subject.custom_theme_list.length).to eq(1)
        expect(subject.custom_theme_list.first['id']).to eq('custom-theme-1')
      end
    end
  end
end
