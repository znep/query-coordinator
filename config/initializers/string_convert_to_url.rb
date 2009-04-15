# Add this method to String

class String
  def convert_to_url
    output = self.gsub(/\s+/, '-').gsub(/[^a-zA-Z0-9_\-]/, '').gsub(/\-+/, '-')
    if output.nil? || output.length < 1
      output = '-'
    end
    output.slice(0, 50)
  end
end
