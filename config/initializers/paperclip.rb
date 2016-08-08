require 'paperclip/copy_attachments'

Paperclip::Attachment.default_options[:url] = ':s3_domain_url'
Paperclip::Attachment.default_options[:path] = '/:class/:attachment/:id_partition/:style/:filename'

# Add entries to this hash whenever the `file` system command may conflict with
# the content type that we say an attachment should have.
#
# The `file` command uses heuristics to guess the content type, which may not
# always be accurate; for example, a single-character file will be reported as
# application/octet-stream. A validation conflict will present the following
# type of message in the job worker log:
#
#   [paperclip] Content Type Spoof: Filename embedded_fragment.html (text/html
#     from Headers, ["text/html"] from Extension), content type discovered from
#     file command: application/octet-stream. See documentation to allow this
#     combination.
#
# The alternative is disabling spoofing validation altogether, but hopefully we
# can use this more targeted approach sustainably.
Paperclip.options[:content_type_mappings] = {
  html: 'application/octet-stream'
}
