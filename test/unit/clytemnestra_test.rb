require File.dirname(__FILE__) + '/../test_helper'
include Clytemnestra

class ClytemnestraTest < Test::Unit::TestCase

  # yes, this is a little silly
  def test_check_time_and_id_are_there_yo
    searchView = ViewSearchResult.new
    searchView.check_time = 1
    searchView.id = "blahblah"
  end
end