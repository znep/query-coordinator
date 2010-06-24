# This defines how to display an HREF-dataset, e.g.g a link to another page
class Displays::Href < Displays::Base
  def scrolls_inline?
    false
  end

  def render_partial
    'displays/href'
  end

  def required_stylesheets
    ['blists-blob-screen.css']
  end
end
