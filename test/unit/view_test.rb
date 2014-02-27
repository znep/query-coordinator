require 'test_helper'

class ViewTest < Test::Unit::TestCase

  def test_prefetch
    load_sample_data("test/fixtures/sample-data.json")
    view = View.find("does-not-matter")
    view.prefetch(300)
    assert view.get_rows(1)
    can = view.sodacan
    assert can.metrics["cache_size"] == 2
    assert can.metrics["num_results"] == 1
    assert can.metrics["num_calls"] == 1
  end

  def test_multiple_queries_same_prefetched_data
    load_sample_data("test/fixtures/sample-data.json")
    view = View.find("does-not-matter")
    view.prefetch(300)
    all = view.get_rows(2)
    assert all
    can = view.sodacan
    assert can.metrics["cache_size"] == 2
    assert can.metrics["num_results"] == 2
    assert can.metrics["num_calls"] == 1
    john_filter = JSON::parse('{ "filterCondition": { "type" : "operator", "value" : "EQUALS",
                                    "children" : [
                                    { "type": "literal","value": "John"},
                                    { "type" : "column", "columnFieldName" : "name"}]}}')
    sarah_filter = JSON::parse('{ "filterCondition": { "type" : "operator", "value" : "EQUALS",
                                    "children" : [
                                    { "type": "literal","value": "Sarah"},
                                    { "type" : "column", "columnFieldName" : "name"}]}}')
    johns = view.get_rows(1, 1, john_filter)
    assert johns
    can = view.sodacan
    assert can.metrics["num_calls"] == 2
    assert can.metrics["num_results"] == 3, "Unexpected result, got #{johns} because #{can.hints}"
    sarahs = view.get_rows(1, 1, sarah_filter)
    assert sarahs
    can = view.sodacan
    assert can.metrics["num_results"] == 4
    assert can.metrics["num_calls"] == 3
  end

  def test_find_in_store_does_not_raise_on_valid_store_ids
    CoreServer::Base.stubs(:connection => stub(:get_request))
    assert_nothing_raised { View.find_in_store(1, 'pg.primus')}
    assert_nothing_raised { View.find_in_store(1, 'es.omega')}
    assert_nothing_raised { View.find_in_store(1, 'pg2.primus')}
    assert_nothing_raised { View.find_in_store(1, 'es0.omega1')}
  end

  def test_find_in_store_raises_on_invalid_store_ids
    CoreServer::Base.stubs(:connection => stub(:get_request))
    assert_raises RuntimeError do; View.find_in_store(1, 'pg_primus'); end
    assert_raises RuntimeError do; View.find_in_store(1, 'es+omega'); end
    assert_raises RuntimeError do; View.find_in_store(1, 'pg2-primus'); end
    assert_raises RuntimeError do; View.find_in_store(1, 'es0[omega1]'); end
  end

end
