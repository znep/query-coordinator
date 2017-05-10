# from Jay Fields http://blog.jayfields.com/2007/03/rails-presenter-pattern.html
require 'forwardable'

class Presenter
  extend ::Forwardable

  def initialize(params)
    params.each_pair do |attribute, value|
      self.send :"#{attribute}=", value if value.present?
    end unless params.nil?
  end
end
