class SocrataTaggedLogFormatter < ActiveSupport::Logger::SimpleFormatter
  include ActiveSupport::TaggedLogging::Formatter

  def call(severity, timestamp, progname, msg)
    "#{timestamp.utc.strftime "%Y-%m-%d %H:%M:%S,%L"} #{tags_text}[#{'%-5s' % severity}] #{msg}\n"
  end
end

