module YUI
  class Compressor

    def compress(stream_or_string)
      streamify(stream_or_string) do |stream|
        tempfile = Tempfile.new('yui_compress')
        tempfile.write stream.read
        tempfile.flush
        full_command = "%s %s" % [command, tempfile.path]

        begin
          output = `#{full_command}`
        rescue Exception => e
          # windows shells tend to blow up here when the command fails
          raise RuntimeError, "compression failed: %s" % e.message
        ensure
          tempfile.close!
        end

        if $?.exitstatus.zero?
          output
        else
          stream.rewind
          File.open('/tmp/yui_compressor_failure', 'w') { |file| file.write(stream.read) }
          puts(%Q{\nCOMPRESSION FAILURE! Examine file in "/tmp/yui_compressor_failure" for details why.\n\n})
          # Bourne shells tend to blow up here when the command fails, usually because java is missing
          raise RuntimeError, "Command '%s' returned non-zero exit status" % full_command
        end
      end
    end

  end
end
