require 'rails_helper'
require_relative '../../test/test_helper'
require_relative '../../lib/constraints/resource_constraint'

describe Constraints::ResourceConstraint do

  describe '#matches?' do

    subject(:constraint) { described_class.new }
    let(:request_with_valid_id) { double('Request', path_parameters: {id: '1234-five'}) }
    let(:request_with_invalid_id) { double('Request', path_parameters: {id: '_123456-seven?'}) }
    let(:request_with_missing_id) { double('Request', path_parameters: {}) }

    it 'is accepted with a valid 4x4 id parameter' do
      expect(constraint.matches?(request_with_valid_id)).to be_truthy
    end

    it 'is not accepted with a missing 4x4 id parameter' do
      expect(constraint.matches?(request_with_missing_id)).to be_falsy
    end

    it 'is not accepted with an invalid 4x4 id parameter' do
      expect(constraint.matches?(request_with_invalid_id)).to be_falsy
    end

  end

end
