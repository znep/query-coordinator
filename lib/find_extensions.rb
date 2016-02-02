module FindExtensions

  # @param ids_array
  # @return hash id => result
  def find_multiple_dedup(ids_array)
    unique_ids = ids_array.uniq
    if unique_ids.empty?
      return {}
    end
    core_result = find_multiple(unique_ids)
    result = {}
    unique_ids.zip(core_result).each do |id, view|
      result[id] = view
    end
    result
  end

end