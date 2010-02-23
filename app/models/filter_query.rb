class FilterQuery
  attr_reader :view_id, :params

  def initialize(view_id, params)
    @view_id = view_id
    @params = params
  end

  def build
    result = filter_header(params)
    result = result.merge(query_hash(params))
    result
  end
  
  def query_hash(params)
    result = {}
    filter_conditions = filter_query_conditions(params)
    sort_conditions =  sort_query_conditions(params)
    result = result.merge({"filterCondition" => filter_conditions}) if filter_conditions
    result = result.merge({"orderBys" => sort_conditions}) if sort_conditions
    result = {"query" => result} unless result.empty?
    result
  end
  
    def filter_query_hash(filter_children_array)
      {"type" => "operator",
      "value" => "AND",
       "children"=> filter_children_array}
  end

  def sort_query_hash(filter_children_array)
      filter_children_array
  end

  def filter_header(params)
    result = {"name" => "Temporary View",
     "id" => self.view_id,
     "originalViewId" => self.view_id}
    result = result.merge({"searchString" => "#{params['search']}"}) if params['search']
    result
  end
  
  def sort_query_conditions(params)
    sort_fields = self.all_params_where_sort_field_was_not_no_sort(params)
    return if sort_fields.none?
    ids = numeric_characters_from_field_name(sort_fields)
    sort_children = array_of_arrays_of_sort_value_pairs(ids, self.params)
    sort_children_array = array_of_sort_children_hashes(sort_children)
    sort_query_hash(sort_children_array)
  end
  
  
  def filter_query_conditions(params)
    filters = all_params_where_limit_to_was_not_no_filter(self.params)
    return if filters.none?
    ids = numeric_characters_from_field_name(filters)
    filter_children = array_of_arrays_of_filter_operator_value_pairs(ids, self.params)
    filter_children_array = array_of_filter_children_hashes(filter_children)
    filter_query_hash(filter_children_array)
  end
  
  def  all_params_where_sort_field_was_not_no_sort(params)
    params.inject([]) { |res, kv| res << kv if kv[1] =~ /[^no sort]/ and kv[0] =~ /sort_field/; res }
  end

  def all_params_where_limit_to_was_not_no_filter(params)
    params.inject([]) { |res, kv| res << kv if kv[1] =~ /[^no filter]/ and kv[0] =~ /limit/; res }
  end
  
  def numeric_characters_from_field_name(field_names)
    field_names.collect{|key_value_row| key_value_row[0].gsub(/[^0-9]/, "")}
  end
  
  def array_of_arrays_of_sort_value_pairs(ids, params)
    ids.inject([]){|h, id| h << [params["sort_field_#{id}"], sort_direction(params["sort_direction_#{id}"])]} 
  end
  
  def sort_direction(sort_string)
    sort_string == "Ascending" ? true : false
  end
  
  def array_of_arrays_of_filter_operator_value_pairs(ids, params)
    ids.inject([]){|h, id| h << [params["limit_#{id}"], params["cell_content_#{id}"], id]} 
  end
  
  def array_of_sort_children_hashes(sort_children)
    sort_children.inject([]){|arr, sort_child| arr << sort_children_hash(sort_child[0], sort_child[1])}
  end
  
  def sort_children_hash(sort_field, sort_direction)
    {
         "ascending" => sort_direction,
         "expression" => {
         "columnId" => sort_field,
          "type" => "column"
       }
     } 
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
  


  def array_of_filter_children_hashes(filter_children)
    filter_children.inject([]){|arr, filter_child| arr << filter_children_hash(filter_child[0], filter_child[2], filter_child[1])}
  end
end
