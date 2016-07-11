module Paperclip
  # Handles manual cropping for images that are uploaded
  class ManualCropper < Thumbnail

    def initialize(file, options = {}, attachment = nil)
      super

      @original_width = @current_geometry.width
      @original_height = @current_geometry.height

      if target.cropping?
        @current_geometry.width = cropped_width
        @current_geometry.height = cropped_height
      end
    end

    def target
      @attachment.instance
    end

    def transformation_command
      if target.cropping?
        crop_command = [
          "-crop",
          "#{cropped_width}x#{cropped_height}+#{cropped_x}+#{cropped_y}",
          "+repage"
        ]

        crop_command + super
      else
        super
      end
    end

    private

    def cropped_width
      @original_width * target.crop_width
    end

    def cropped_height
      @original_height * target.crop_height
    end

    def cropped_x
      @original_width * target.crop_x
    end

    def cropped_y
      @original_height * target.crop_y
    end
  end
end
