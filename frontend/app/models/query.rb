class Query < Model
  def groupBys
    data['groupBys']
  end

  def orderBys
    data['orderBys']
  end

  def filterCondition
    data['filterCondition']
  end

  def cleaned
    d = data.dup
    if d.has_key?('namedFilters')
      fc = d['filterCondition']
      d['filterCondition'] = {'type' => 'operator', 'value' => 'AND', 'children' => []}
      d['filterCondition']['children'] << fc if !fc.blank?
      d['namedFilters'].each {|k, v| d['filterCondition']['children'] << v}
      d.delete('namedFilters')
    end
    d
  end
end
