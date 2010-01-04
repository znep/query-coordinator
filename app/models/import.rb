class Import < Model
  def self.import(name, file)
    # TODO: is this even used anymore?
    req = Net::HTTP::Post::Multipart.new "/imports",
      'file' => UploadIO.new(file, file.content_type, File.basename(name))
    req['X-Socrata-Host'] = CurrentDomain.cname
    parse(generic_request(req).body)
  end
end
