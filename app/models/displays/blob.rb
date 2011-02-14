class Displays::Blob < Displays::Base
    def initialize(view)
        super
        if @@GOOGLE_VIEWERS.any? { |v| @view.blobMimeType.match(v) }
          @display_type = 'google_viewer'
        elsif @@IMAGE_VIEWERS.any? { |v| @view.blobMimeType.match(v) }
          @display_type = 'image'
        else
          @display_type = 'link'
        end
    end

    def type
      'blob'
    end

    def name
      'Non-tabular file or document'
    end

    def display_type
      @display_type
    end

    # Choose a viewer based on MIME type, default to download link
    def render_partial
      'displays/blob'
    end

    def scrolls_inline?
      @display_type == 'google_viewer'
    end

    # MIME types or Regexps that can be viewed in Google's viewer
    # Supported: pdf, doc, docx, tif, ppt
    # Note: docx should be "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    # (which can be displayed) but comes back from core server as application/zip
    @@GOOGLE_VIEWERS = ["application/pdf",
      "application/vndms-powerpoint", "image/tiff",
      "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]

    # Image types to display in-browser via IMG tag
    @@IMAGE_VIEWERS = ["image/jpeg", "image/gif", "image/png"]
end
