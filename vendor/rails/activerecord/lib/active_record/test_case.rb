require "active_support/test_case"

module ActiveRecord 
  class TestCase < ActiveSupport::TestCase #:nodoc:
    self.fixture_path               = FIXTURES_ROOT
    self.use_instantiated_fixtures  = false
    self.use_transactional_fixtures = true

    def create_fixtures(*table_names, &block)
      Fixtures.create_fixtures(FIXTURES_ROOT, table_names, {}, &block)
    end

    def assert_date_from_db(expected, actual, message = nil)
      # SybaseAdapter doesn't have a separate column type just for dates,
      # so the time is in the string and incorrectly formatted
      if current_adapter?(:SybaseAdapter)
        assert_equal expected.to_s, actual.to_date.to_s, message
      else
        assert_equal expected.to_s, actual.to_s, message
      end
    end

    def assert_sql(*patterns_to_match)
      $queries_executed = []
      yield
    ensure
      failed_patterns = []
      patterns_to_match.each do |pattern|
        failed_patterns << pattern unless $queries_executed.any?{ |sql| pattern === sql }
      end
      assert failed_patterns.empty?, "Query pattern(s) #{failed_patterns.map(&:inspect).join(', ')} not found."
    end

    def assert_queries(num = 1)
      $queries_executed = []
      yield
    ensure
      assert_equal num, $queries_executed.size, "#{$queries_executed.size} instead of #{num} queries were executed.#{$queries_executed.size == 0 ? '' : "\nQueries:\n#{$queries_executed.join("\n")}"}"
    end

    def assert_no_queries(&block)
      assert_queries(0, &block)
    end

    def self.use_concurrent_connections
      setup :connection_allow_concurrency_setup
      teardown :connection_allow_concurrency_teardown
    end

    def connection_allow_concurrency_setup
      @connection = ActiveRecord::Base.remove_connection
      ActiveRecord::Base.establish_connection(@connection.merge({:allow_concurrency => true}))
    end

    def connection_allow_concurrency_teardown
      ActiveRecord::Base.clear_all_connections!
      ActiveRecord::Base.establish_connection(@connection)
    end
  end
end
