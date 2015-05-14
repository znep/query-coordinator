revision_file = File.join(Rails.root, "REVISION")

begin
  REVISION_NUMBER = File.read(revision_file).chomp()
  REVISION_DATE = File.stat(revision_file).mtime.to_i
rescue
  REVISION_NUMBER = nil
  REVISION_DATE = nil
end
