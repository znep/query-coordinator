# Add this method to String

class String
  def convert_to_url
    output = self.gsub(/\s+/, '-').gsub(/[^a-zA-Z0-9_\-]/, '-').gsub(/\-+/, '-')
    if output.nil? || output.blank?
      output = '-'
    end
    output.slice(0, 50)
  end

  def convert_to_unicode_url
    output = self.gsub(/[^\p{L}\p{N}_]+/u, '-')
    if output.nil? || output.blank?
      output = '-'
    end
    output.slice(0, 50)
  end

  def titleize_if_necessary
    if self.downcase[0] == self[0]
      self.titleize
    else
      self
    end
  end

  def capitalize_first
    self.gsub(/^[a-z]/){ |c| c.upcase }
  end

  def fix_get_encoding!
    self.force_encoding('utf-8')
  end
end
