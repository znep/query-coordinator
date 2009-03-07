class Datatype < Model
  # Override super.type and return the type of the datatype
  def type
    data['type']
  end

  def possible_aggregates
    aggs = [
      {'title' => 'None', 'name' => 'none'},
      {'title' => 'Average', 'name' => 'average'},
      {'title' => 'Count', 'name' => 'count'},
      {'title' => 'Sum', 'name' => 'sum'},
      {'title' => 'Maximum', 'name' => 'maximum'},
      {'title' => 'Minimum', 'name' => 'minimum'}
    ]

    case type.downcase
    when "blist_in_blist", "picklist"
      aggs.reject! {|a| a['name'] != 'none'}
    when "text", "photo", "phone", "checkbox", "flag", "url",
      "email", "document", "tag"
      aggs.reject! {|a|
        ['average', 'sum', 'maximum', 'minimum'].any? {|n| n == a['name']}}
    when "date"
      aggs.reject! {|a| ['average', 'sum'].any? {|n| n == a['name']}}
    when "stars"
      aggs.reject! {|a| 'sum' == a['name']}
    end

    aggs
  end
end
