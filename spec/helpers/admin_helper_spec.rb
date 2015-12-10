require 'rails_helper'

describe AdminHelper do
  describe '#form_button' do

    it 'generates a form tag' do
      expect(helper.form_button('/', 'text')).to match(/^<form/)
    end
  end

  describe 'a11y_metadata_fieldset_summary' do
    it 'returns an a11y_summary with non-empty "fields" value' do
      metadata_fields = { 'fields' => [ { 'name' => 'anemone' } ] }
      columns = []
      expect(helper.a11y_metadata_fieldset_summary(metadata_fields, columns))
    end

    it 'returns an a11y_summary with empty "fields" value' do
      metadata_fields = { }
      columns = []
      expect(helper.a11y_metadata_fieldset_summary(metadata_fields, columns))
    end
  end

end
