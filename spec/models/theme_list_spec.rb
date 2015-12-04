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

  context 'with no custom themes' do
    describe '#to_json' do
      it 'renders theme_list.json.erb' do
        expect(subject.to_json).to eq(theme_list.to_json)
      end
    end

    describe '#themes' do
      it 'returns themes from theme_list' do
        expect(subject.themes).to eq(theme_list['themes'])
      end
    end
  end

  context 'with custom themes' do
    let(:custom_theme) { double('theme', id: 'custom-theme-1') }

    before do
      allow(Theme).to receive(:all_custom_for_current_domain).and_return([custom_theme])
      allow(custom_theme).to receive(:for_theme_list_config).and_return({ 'id' => custom_theme.id })
    end

    describe '#themes' do
      it 'includes custom theme' do
        custom_theme = subject.themes.detect{ |theme| theme['id'] == 'custom-theme-1' }
        expect(custom_theme).to_not be_nil
      end
    end
  end
end
