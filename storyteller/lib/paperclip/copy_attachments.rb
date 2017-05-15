# Obtained from:
# https://gist.github.com/airblade/a6c9ea0f6888d4ce1bcd
#
# Copies S3-stored Paperclip attachments from one AR model to another.
#
# This module should be mixed into the target AR model.

if Gem::Version.new(::Aws::VERSION) < Gem::Version.new(2.6)
  raise NotImplementedError, 'coded for aws-sdk v2.6'
end

module Paperclip
  module CopyAttachments

    # Copies S3-stored attachments from the source ActiveRecord instance.
    def copy_attachments_from(source, validate_copy = true)
      self.class.attachment_definitions.keys.each do |attachment_name|
        source_attachment = source.send(attachment_name)

        next if source_attachment.blank?
        next if source_attachment.options[:storage] != :s3

        destination_attachment = send(attachment_name)

        [:original, *destination_attachment.styles.keys].uniq.map do |style|
          Paperclip.log "S3 copy: #{source_attachment.path(style)} -> #{destination_attachment.path(style)}"

          source_s3_object = source_attachment.s3_object(style)
          destination_s3_object = destination_attachment.s3_object(style)

          begin
            source_s3_object.copy_to(
              destination_s3_object,
              acl: source_attachment.s3_permissions(style),
              server_side_encryption: 'AES256'
            )
          rescue Aws::S3::Errors::AccessDenied => error
            puts Paperclip.log "Aws::S3::Errors::AccessDenied when copying #{source_s3_object.key} -> #{destination_s3_object.key}"
            raise error if validate_copy
          end
        end
      end
    end

  end
end
