# This display simply dumps plain text from the display format of the view.  Primarily useful for testing basic
# display framework functionality.
class Displays::PlainText < Displays::Base
    def scrolls_inline?
        false
    end

    def render_body(context)
        "<pre>#{h @options.body}</pre>"
    end
end
