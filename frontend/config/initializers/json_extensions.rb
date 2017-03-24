require 'json'

module JSON
  # For API coherence with Javascript JSON object
  def self.stringify(*args)
    JSON.unparse(*args)
  end
end
