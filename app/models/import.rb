class Import < Model
  def self.import(name, file)
    req = Net::HTTP::Post::Multipart.new "/imports",
      'file' => UploadIO.new(file, file.content_type, File.basename(name))
    parse(generic_request(req).body)
  end
end
