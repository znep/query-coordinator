module Enumerable
  def pluck(key)
    map { |entry| entry.try(:[], key) }
  end
end
