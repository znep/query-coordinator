require 'test_helper'

class ClientAnalyticsHelperTest < Test::Unit::TestCase
  describe 'is_allowed?' do
    describe 'allowed' do 

      def test_static_allowed
        assert(ClientAnalyticsHelper.is_allowed?("domain", "js-page-view"))
      end

      def test_timezone_timing
        assert(ClientAnalyticsHelper.is_allowed?("domain", "js-connect-tz-420-time"))
      end

      def test_browser
        assert(ClientAnalyticsHelper.is_allowed?("domain", "browser-chrome-37"))
      end
    end

    describe 'disallowed' do
      def test_echo
        refute(ClientAnalyticsHelper.is_allowed?("domain", "browser-chrome\nping -c 21 127.0.0.1"))
      end
    end
  end
end

