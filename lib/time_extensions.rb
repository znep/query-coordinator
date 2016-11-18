class Time

  def quantize_to(window)
    Time.at(self.to_i - (self.to_i % window) + window)
  end

end
