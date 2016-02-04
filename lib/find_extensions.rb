module FindExtensions

  # @param ids_array
  # @return hash id => result
  def find_multiple_dedup(ids_array)
    unique_ids = ids_array.uniq
    if unique_ids.empty?
      return {}
    end
    core_result_by_id = {}
    find_multiple(unique_ids).each do |view|
      core_result_by_id[view.id] = view
    end
    unique_ids.each do |id|
      if !core_result_by_id.has_key?(id)
        core_result_by_id[id] = nil
      end
    end
    core_result_by_id
  end

end