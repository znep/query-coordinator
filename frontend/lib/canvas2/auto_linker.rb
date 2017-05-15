# encoding: UTF-8

module Canvas2
  # When given an HTML document/snippet and provided as the Document for a
  # Nokogiri HTML SAX parser, this class wraps any bits of text that look like
  # URLs in <a/> tags, unless they're already within an <a/>.
  class AutoLinker < Nokogiri::XML::SAX::Document

    # Once parsing is complete, this attr contains the autolinked HTML (minus
    # any <html/> and <body/> tags present in the input).
    attr_reader :output

    def initialize()
      @out = []
      @anchor_tag_stack = []
      @anchor_with_href_count = 0

      #used to collapse multiple character runs.
      @current_linkifiable_characters_run = ''
    end


    # The event handlers try to match the ones in auto_linker.rb as closely
    # as possible.

    def start_document()
    end

    def start_element(tag_name, attribs)
      emit_and_flush_linkifiable_characters_run()

      # The parser will auto-add these tags in HTML mode. We don't want them.
      # For now we accept that we'll remove these tags if the source happens
      # to include them explicitly.
      return if (tag_name == 'html' || tag_name == 'body')

      has_href = false

      emit('<')
      emit(tag_name)

      attribs.each do |attr|
        attrib_name = attr[0]
        value = attr[1]
        unless (value.nil?)
          emit(' ')
          emit(attrib_name)
          emit('="')
          emit(escape_attrib_value(value))
          emit('"')
        end

        has_href |= (attrib_name == 'href')
      end

      if (Nokogiri::HTML::ElementDescription[tag_name].empty?())
        emit('/>')
      else
        emit('>')
      end

      if (tag_name == 'a')
        @anchor_tag_stack.push(has_href)
        @anchor_with_href_count += 1 if has_href
      end
    end

    def end_element(tag_name)
      emit_and_flush_linkifiable_characters_run()

      # The parser will auto-add these tags in HTML mode. We don't want them.
      return if (tag_name == 'html' || tag_name == 'body')

      unless (Nokogiri::HTML::ElementDescription[tag_name].empty?())
        emit("<\/#{tag_name}>")
      end

      if (tag_name == 'a')
        had_href = @anchor_tag_stack.pop()
        @anchor_with_href_count -= 1 if had_href
      end
    end

    def characters(plain_text)
      # Only linkify if we're not in <a> with an href.
      should_linkify = (@anchor_with_href_count == 0)
      append_characters(plain_text, should_linkify)
    end

    def end_document()
      emit_and_flush_linkifiable_characters_run()
      @output = @out.join('')
    end

    private

    # We need to correctly collapse multiple consecutive character
    # runs, as the parser splits around things like HTML entities.
    # This is a problem because we may need to linkify across character runs.
    def append_characters(plain_text, should_linkify)
      if (should_linkify)
        @current_linkifiable_characters_run += plain_text
      else
        emit_and_flush_linkifiable_characters_run()
        emit(plain_text)
      end
    end

    # Terminate the current linkifiable characters run, as queued by calls to
    # append_characters with should_linkify=true. Runs the actual linkifying.
    def emit_and_flush_linkifiable_characters_run()
      unless (@current_linkifiable_characters_run.empty?)
        emit(linkify_plain_text(@current_linkifiable_characters_run))
        @current_linkifiable_characters_run = ''
      end
    end

    # Adds the given text to the output.
    def emit(text)
      @out.push(text)
    end

    # Given some plain text, wrap anything that looks like a link in an <a/>
    # tag.
    def linkify_plain_text(plain_text)
      # Taken from this fine establishment:
      # http://daringfireball.net/2010/07/improved_regex_for_matching_urls
      url_matcher = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/i
      has_protocol_matcher =/[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])/

      linkified_html = plain_text.gsub(url_matcher) do |matched_substring|
        # The regex matches things like www.socrata.com or socrata.com/foo.html.
        # If such a protocol-less URI was matched, use the default HTTP protocol.
        if (has_protocol_matcher.match(matched_substring))
          link_url = matched_substring
        else
          link_url = 'http://' + matched_substring
        end
        "<a class=\"auto_link\" href=\"#{link_url}\" rel=\"nofollow noreferrer external\">#{matched_substring}</a>"
      end

      return linkified_html
    end

    # Escapes HTML special characters in attribute values.
    def escape_attrib_value(s)
      ampRe = /&/
      looseAmpRe = /&([^a-z#]|#(?:[^0-9x]|x(?:[^0-9a-f]|$)|$)|$)/i
      ltRe = /[<]/
      gtRe = />/
      quotRe = /\"/
      return s.gsub(ampRe, '&amp;').gsub(ltRe, '&lt;')
          .gsub(gtRe, '&gt;').gsub(quotRe, '&#34;')
    end

  end
end
