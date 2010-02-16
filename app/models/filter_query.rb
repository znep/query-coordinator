class FilterQuery
  attr_reader :view_id, :params

  def initialize(view_id, params)
    @view_id = view_id
    @params = params
  end

  def build
    filters = all_params_where_limit_to_was_not_no_filter(self.params)
    ids = numeric_characters_from_field_name(filters)
    filter_children = array_of_arrays_of_operator_value_pairs(ids, self.params)
    filter_children_array = array_of_filter_children_hashes(filter_children)
    result = filter_query_hash(filter_children_array)
    result
  end
  
  def all_params_where_limit_to_was_not_no_filter(params)
    params.inject([]) { |res, kv| res << kv if kv[1] =~ /[^no filter]/ and kv[0] =~ /limit/; res }
  end
  
  def numeric_characters_from_field_name(filters)
    filters.collect{|key_value_row| key_value_row[0].gsub(/[^0-9]/, "")}
  end
  
  def array_of_arrays_of_operator_value_pairs(ids, params)
    ids.inject([]){|h, id| h << [params["limit_#{id}"], params["cell_content_#{id}"], id]} 
  end
  
  def filter_children_hash(operator, column_id, value)
    { "type" => "operator",
          "value" => operator,
          "children" => [
            { "type" => "column",
              "columnId" => column_id
            },
            { "type" => "literal",
              "value" => value
            }
          ]
    }
  end
  
  def filter_query_hash(filter_children_array)
    {
    "name" => "Temporary View",
    "id" => self.view_id,
    "originalViewId" => self.view_id,
    "query" => {
    "filterCondition" => {
      "type" => "operator",
      "value" => "AND",
       "children"=> filter_children_array}}}
  end

  def array_of_filter_children_hashes(filter_children)
    filter_children.inject([]){|arr, filter_child| arr << filter_children_hash(filter_child[0], filter_child[2], filter_child[1])}
  end
end
