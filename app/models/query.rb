class Query < Model
  def groupBys
    data['groupBys']
  end

  def orderBys
    data['orderBys']
  end
end
