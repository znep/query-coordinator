# encoding: utf-8

require 'rails_helper'
require_relative '../../test/test_helper'
require_relative '../../lib/constraints/resource_constraint'

describe Constraints::ResourceConstraint do

  describe '#matches?' do

    subject(:constraint) { described_class.new }
    let(:request_data_slate) { double('Request', path_parameters: {category: 'countystat', view_name: 'objective', id: 'housing'}) }
    let(:request_with_valid_id) { double('Request', path_parameters: {id: '1234-five', category: 'fun', view_name: 'something interesting'}) }
    let(:request_with_invalid_id) { double('Request', path_parameters: {id: '_123456-seven?', category: 'fun', view_name: 'something interesting'}) }
    let(:request_with_missing_id) { double('Request', path_parameters: {category: 'fun', view_name: 'something interesting'}) }
    let(:request_with_missing_category) { double('Request', path_parameters: {id: '1234-five', view_name: 'something interesting'}) }
    let(:request_with_missing_viewname) { double('Request', path_parameters: {id: '1234-five', category: 'fun'}) }
    let(:request_with_unicode_category) { double('Request', path_parameters: {id: '1234-five', category: '愛', view_name: 'motherly love'}) }
    let(:request_with_unicode_viewname) { double('Request', path_parameters: {id: '1234-five', category: 'love', view_name: 'الرسم-البياني-الأمومي'}) }

    it 'is rejected with a data slate path' do
      expect(constraint.matches?(request_data_slate)).to be_falsy
    end

    it 'is accepted with a valid 4x4 id parameter, category, and viewname' do
      expect(constraint.matches?(request_with_valid_id)).to be_truthy
    end

    it 'is not accepted with a missing 4x4 id parameter' do
      expect(constraint.matches?(request_with_missing_id)).to be_falsy
    end

    it 'is not accepted with a missing category' do
      expect(constraint.matches?(request_with_missing_category)).to be_falsy
    end

    it 'is not accepted with a missing viewname' do
      expect(constraint.matches?(request_with_missing_viewname)).to be_falsy
    end

    it 'is not accepted with an invalid 4x4 id parameter' do
      expect(constraint.matches?(request_with_invalid_id)).to be_falsy
    end

    it 'is accepted with unicode category parameter' do
      expect(constraint.matches?(request_with_unicode_category)).to be_truthy
    end

    it 'is accepted with unicode name parameter' do
      expect(constraint.matches?(request_with_unicode_viewname)).to be_truthy
    end

  end

end
