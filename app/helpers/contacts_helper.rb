module ContactsHelper

  def get_groups
    Group.find().sort {|a,b| a.name <=> b.name}
  end

  def get_contact_tags
    contacts = Contact.find()
    # TODO: Add groups in here when they have tags

    tags = []
    contacts.each do |c|
      if !c.tags.nil?
        tags << c.tags.collect { |t| t.to_s }
      end
    end
    tags.flatten.sort.uniq
  end

end
