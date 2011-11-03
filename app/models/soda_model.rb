# This specialization of model communicates with the core server via SODA 2
class SodaModel < Model
  def self.service_name
    "id/#{super}"
  end
end
