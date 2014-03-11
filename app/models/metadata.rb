class Metadata < Model
  def attachments
    data['attachments']
  end

  def custom_fields
    unless data['custom_fields'].blank?
      return data['custom_fields'].to_a.sort {|a, b| a[0] <=> b[0]}
    end
  end

  def accessPoints
    data['accessPoints']
  end

  def feature_flags
    data['feature_flags']
  end
end
