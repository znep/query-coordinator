class IsArrayValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    unless record[attribute].is_a?(Array)
      record.errors[attribute] << 'must be array'
    end
  end
end
