require File.dirname(__FILE__) + '/../test_helper'

class FilterQueryTest < ActiveSupport::TestCase
  
  def setup
    @view_id = "ktur-tvpa"
    @filter_and_sort_params_hash = 
    {"limit_1291"=>"no filter", "cell_content_1292"=>"", 
      "sort_direction_5"=>"Ascending", "limit_1292"=>"no filter", 
      "cell_content_1293"=>"", "commit"=>"submit", 
      "limit_1293"=>"no filter", "cell_content_1294"=>"", 
      "sort_field_1"=>"1291", "sort_field_2"=>"no sort", 
      "action"=>"alt_filter", 
      "authenticity_token"=>"Rpk0Yf93A18jiXsUzMUNiLwzLc73fYXLzBqSLWrbPVU=", 
      "limit_1294"=>"no filter", "sort_field_3"=>"no sort", "id"=>"ktur-tvpa", 
      "sort_field_4"=>"no sort", "sort_field_5"=>"no sort", 
      "sort_direction_1"=>"Ascending", "controller"=>"blists", 
      "sort_direction_2"=>"Ascending", "cell_content_1290"=>"3", 
      "sort_direction_3"=>"Ascending", "limit_1290"=>"EQUALS", 
      "cell_content_1291"=>"", "sort_direction_4"=>"Ascending"}
    @search_hash = {"search"=>"leaves"}
    @fq = FilterQuery.new(@view_id, @filter_and_sort_params_hash)
    @sort_fields = [["sort_field_1", "1291"]]
    @ids = ["1"]
    @array_of_sort_value_pairs = [["1291", true]]
  end
  
  def test_filter_header_with_no_search
      header = {"name" => "Temporary View",
     "id" => @view_id,
     "originalViewId" => @view_id}
     assert_equal header, @fq.filter_header(@filter_and_sort_params_hash)
  end

  def test_filter_header_with_search
      header = {"name" => "Temporary View",
     "id" => @view_id,
     "originalViewId" => @view_id,
     "searchString" => "leaves"}
     fq = FilterQuery.new(@view_id, @search_hash)
     assert_equal header, fq.filter_header(@search_hash)
  end
  
  def test_all_params_where_sort_field_was_not_no_sort
    assert_equal @sort_fields,  @fq.all_params_where_sort_field_was_not_no_sort(@filter_and_sort_params_hash)
  end
  
  def test_numeric_characters_from_field_names
    assert_equal @ids, @fq.numeric_characters_from_field_name(@sort_fields)
  end
  
  def test_array_of_arrays_of_sort_value_pairs
    assert_equal @array_of_sort_value_pairs, @fq.array_of_arrays_of_sort_value_pairs(@ids, @filter_and_sort_params_hash)
  end
  
  def test_filter_query_conditions_with_no_conditions
    fq = FilterQuery.new(@view_id, {})
    assert_nil fq.filter_query_conditions({})
  end
  
  def test_all_params_where_limit_to_is_empty
    assert_equal [],  @fq.all_params_where_limit_to_was_not_no_filter({})
  end

  def test_sort_query_conditions_with_no_conditions
    fq = FilterQuery.new(@view_id, {})
    assert_nil fq.sort_query_conditions({})
  end
  
  def test_all_params_where_sort_field_was_no_sort_on_all_fields
    assert_equal [],  @fq.all_params_where_sort_field_was_not_no_sort({})
  end

  def test_array_of_sort_children_hashes
    sort_array = [ {
         "ascending" => true,
         "expression" => {
         "columnId" => "1291",
          "type" => "column"
       }
     } ]
     
     assert_equal sort_array, @fq.array_of_sort_children_hashes(@array_of_sort_value_pairs)
  end
  
 
  def test_build
    filter_query = 
    {"name"=>"Temporary View",
 "id"=>"ktur-tvpa",
 "query"=>
  {    "orderBys" => [ {
         "ascending" => true,
         "expression" => {
         "columnId" => "1291",
          "type" => "column"
       }
     } ],
"filterCondition"=>
    {"value"=>"AND",
     "type"=>"operator",
     "children"=>
      [{"value"=>"EQUALS",
        "type"=>"operator",
        "children"=>
         [{"type"=>"column", "columnId"=>"1290"},
          {"value"=>"3", "type"=>"literal"}]}]}
},
 "originalViewId"=>"ktur-tvpa"}
    assert_equal filter_query, @fq.build
  end
end