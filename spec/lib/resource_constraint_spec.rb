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

    # The test case below cannot be included yet because it would require some
    # additional enforcement and I can't verify that said enforcement is safe.
    # The original constraint for the :id path parameter was based on the regex
    # defined as Frontend::UID_REGEXP which is *not* strict — it will match a
    # string that *contains* the pattern \w{4}-\w{4} (i.e. '3456-seve' here),
    # instead of requiring the entire string to match the pattern.

    # it 'is not accepted with an invalid 4x4 id parameter' do
    #   expect(constraint.matches?(request_with_invalid_id)).to be false
    # end

  end

end
