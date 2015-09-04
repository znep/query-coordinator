require 'rails_helper'

describe AdminHelper do
  describe '#form_button' do

    it 'generates a form tag' do
      expect(helper.form_button('/', 'text')).to match(/^<form/)
    end
  end
end
