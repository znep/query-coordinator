class Datatype < Model
  # Override super.type and return the type of the datatype
  def type
    data['type']
  end

end
