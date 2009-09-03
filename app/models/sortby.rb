class Sortby < Model
  def asc?
    return flag?("asc")
  end
end
