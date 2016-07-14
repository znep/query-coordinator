require 'rails_helper'
require_relative '../../lib/common_socrata_methods'

describe CommonSocrataMethods do

  class DummyClass
    include CommonSocrataMethods
  end

  let(:dummy_class_instance) { DummyClass.new }

  describe '#forwardable_session_cookies' do

    it 'returns nil if the local_cookies are nil' do
      result = dummy_class_instance.forwardable_session_cookies(nil)
      expect(result).to be(nil)
    end

    it 'returns a cookie string of all valid cookies' do
      local_cookies = {
        'logged_in' => true,
        '_socrata_session_id' => '123',
        '_core_session_id' => '456',
        'socrata-csrf-token' => '789',
        'invalid_cookie' => 'adsfadsf'
      }

      result = dummy_class_instance.forwardable_session_cookies(local_cookies)
      expect(result).to eq('logged_in=true; _socrata_session_id=123; _core_session_id=456; socrata-csrf-token=789')
    end
  end
end
