describe 'CoreServerResponse' do
  describe '#initialize' do
    it 'defaults are nil when called without a response' do
      response = CoreServerResponse.new

      expect(response.raw).to be_nil
      expect(response.json).to be_nil
    end

    it 'sets raw to the response provided' do
      response = CoreServerResponse.new('test')
      expect(response.raw).to eq('test')
    end

    it 'sets json if the body is parseable' do
      response = CoreServerResponse.new(double('response', :body => '[]', :[] => 'application/json'))
      expect(response.json).to eq([])
    end

    it 'sets json to nil if the body is not parseable' do
      response = CoreServerResponse.new(double('response', :body => 'rawr', :[] => 'application/json'))
      expect(response.json).to be_nil
    end

    it 'sets json to nil if the Content-Type is not application/json' do
      response = CoreServerResponse.new(double('response', :body => '{}', :[] => 'text/plain'))
      expect(response.json).to be_nil
    end
  end

  describe '#ok?' do
    it 'returns true if the response is an instance of Net::HTTPOK' do
      response = CoreServerResponse.new(double('Net:HTTPOK', :instance_of? => true))
      expect(response.ok?).to be(true)
    end

    it 'returns false if the response is not an instance of Net::HTTPOK' do
      response = CoreServerResponse.new('Yes')
      expect(response.ok?).to be(false)
    end
  end

  describe '#not_found?' do
    it 'returns true if the response is an instance of Net::HTTPNotFound' do
      response = CoreServerResponse.new(double('Net:HTTPNotFound', :instance_of? => true))
      expect(response.not_found?).to be(true)
    end

    it 'returns false if the response is not an instance of Net::HTTPNotFound' do
      response = CoreServerResponse.new(double('Net:HTTPOK', :instance_of? => false))
      expect(response.not_found?).to be(false)
    end
  end
end
