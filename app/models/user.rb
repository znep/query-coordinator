class User < Model
  cattr_accessor :current_user, :states, :countries, :sorts, :search_sorts
  attr_accessor :session_token

  non_serializable :displayName
  
  def self.find_profile(id)
    path = "/users/#{id}.json"
    parse(CoreServer::Base.connection.get_request(path))
  end
  
  def self.create(attributes, inviteToken = nil)
    path = "/#{self.name.pluralize.downcase}.json"
    if (inviteToken && inviteToken != "")
      path += "?inviteToken=#{inviteToken}"
    end
    return parse(CoreServer::Base.connection.create_request(path, JSON.generate(attributes)))
  end

  def create(inviteToken = nil)
    User.create(data_hash, inviteToken)
  end
  
  # Needed for multiuser
  def multiuser_authentication_token(timestamp)
    hmac = HMAC::SHA1.new(MULTIUSER_SECRET)
    return hmac.update("#{oid}:#{timestamp}").hexdigest
  end

  def to_json
    dhash = data_hash
    dhash["displayState"] = displayState
    dhash["displayCountry"] = displayCountry
    dhash["displayLocation"] = displayLocation
    dhash["htmlDescription"] = htmlDescription
    dhash["profile_image"] = profile_image_path

    dhash.to_json
  end
  
  def href
    "/profile/#{displayName.convert_to_url}/#{id}"
  end
  
  def self.href(member_name, member_id)
    "/profile/#{member_name.convert_to_url}/#{member_id}"
  end

  def displayScore
    if score.nil?
      "0"
    elsif score > 0.90
      return "%.1f" % (score * 100)
    else
      return "%d" % (score * 100);
    end
  end

  def displayState
    state.nil? ? '' : @@states[state.upcase]
  end

  def displayCountry
    country.nil? ? '' : @@countries[country.upcase]
  end

  def displayLocation
    loc_pieces = []
    if (!city.blank?)
      loc_pieces << city
    end
    if (!state.blank? && country == "US")
      loc_pieces << displayState
    end
    if (!country.blank?)
      loc_pieces << displayCountry
    end
    loc_pieces.join(', ')
  end

  def htmlDescription
    description.blank? ? '' : CGI.escapeHTML(description).gsub("\n", '<br/>')
  end
  
  def friends
    return @friends if @friends
    
    path = "/users/#{id}/contacts.json"
    @friends = User.parse(CoreServer::Base.connection.get_request(path))
  end
  
  def followers
    path = "/users/#{id}/followers.json"
    User.parse(CoreServer::Base.connection.get_request(path))
  end

  def openid_identifiers
    path = "/users/#{id}/open_id_identifiers.json"
    OpenIdIdentifier.parse(CoreServer::Base.connection.get_request(path))
  end
  
  def my_friend?
    return false if current_user.nil?
    return current_user.friends.any? { |friend|
      friend.id == id
    }
  end
  
  def self.login(login,password)
    parse(CoreServer::Base.connection.get_request("/authenticate/#{login}.json?password=#{password}"))
  end

  def is_established?
    # An established user has 4 or more total blists.
    View.find(Hash.new).length > 3
  end

  # size can be "large", "medium", or "small"
  def profile_image_path(size = "large")
    "/users/#{self.id}/profile_images/#{size}"
  end

  def profile_image=(file)
    CoreServer::Base.connection.multipart_post_file("/users/#{self.id}/profile_images", file)
  end

  def public_blists
    View.find_for_user(self.id).reject {|v| !v.is_public? || v.owner.id != id}
  end
  
  def is_owner?(view)
    view.owner.id == self.id
  end
  
  def is_admin?
    self.flag?("admin")
  end
  
  def is_premium?
    self.accountCategory == "premium_sdp"
  end
  
  def can_access_premium_on?(view)
    (self.is_premium? && self.is_owner?(view)) || self.is_admin?
  end

  @@states = {
                '--' => '------',
                'AK' => 'Alaska',
                'AL' => 'Alabama',
                'AR' => 'Arkansas',
                'AZ' => 'Arizona',
                'CA' => 'California',
                'CO' => 'Colorado',
                'CT' => 'Connecticut',
                'DE' => 'Delaware',
                'DC' => 'District of Columbia',
                'FL' => 'Florida',
                'GA' => 'Georgia',
                'HI' => 'Hawaii',
                'IA' => 'Iowa',
                'ID' => 'Idaho',
                'IL' => 'Illinois',
                'IN' => 'Indiana',
                'KS' => 'Kansas',
                'KY' => 'Kentucky',
                'LA' => 'Louisiana',
                'MA' => 'Massachusetts',
                'MD' => 'Maryland',
                'ME' => 'Maine',
                'MI' => 'Michigan',
                'MN' => 'Minnesota',
                'MS' => 'Mississippi',
                'MO' => 'Missouri',
                'MT' => 'Montana',
                'NC' => 'North Carolina',
                'ND' => 'North Dakota',
                'NE' => 'Nebraska',
                'NH' => 'New Hampshire',
                'NJ' => 'New Jersey',
                'NM' => 'New Mexico',
                'NV' => 'Nevada',
                'NY' => 'New York',
                'OH' => 'Ohio',
                'OK' => 'Oklahoma',
                'OR' => 'Oregon',
                'PA' => 'Pennsylvania',
                'RI' => 'Rhode Island',
                'SC' => 'South Carolina',
                'SD' => 'South Dakota',
                'TN' => 'Tennessee',
                'TX' => 'Texas',
                'UT' => 'Utah',
                'VA' => 'Virginia',
                'VT' => 'Vermont',
                'WA' => 'Washington',
                'WI' => 'Wisconsin',
                'WV' => 'West Virginia',
                'WY' => 'Wyoming'
  }

  @@countries = {
            '--' => '------',
            "US" => "United States",
            "GB" => "United Kingdom",
            "CA" => "Canada",
            "AF" => "Afghanistan",
            "AL" => "Albania",
            "DZ" => "Algeria",
            "AS" => "American Samoa",
            "AD" => "Andorra",
            "AO" => "Angola",
            "AI" => "Anguilla",
            "AQ" => "Antarctica",
            "AG" => "Antigua and Barbuda",
            "AR" => "Argentina",
            "AM" => "Armenia",
            "AW" => "Aruba",
            "AU" => "Australia",
            "AT" => "Austria",
            "AZ" => "Azerbaidjan",
            "BS" => "Bahamas",
            "BH" => "Bahrain",
            "BD" => "Bangladesh",
            "BB" => "Barbados",
            "BY" => "Belarus",
            "BE" => "Belgium",
            "BZ" => "Belize",
            "BJ" => "Benin",
            "BM" => "Bermuda",
            "BT" => "Bhutan",
            "BO" => "Bolivia",
            "BA" => "Bosnia-Herzegovina",
            "BW" => "Botswana",
            "BV" => "Bouvet Island",
            "BR" => "Brazil",
            "IO" => "British Indian Ocean Territory",
            "BN" => "Brunei Darussalam",
            "BG" => "Bulgaria",
            "BF" => "Burkina Faso",
            "BI" => "Burundi",
            "KH" => "Cambodia",
            "CM" => "Cameroon",
            "CV" => "Cape Verde",
            "KY" => "Cayman Islands",
            "CF" => "Central African Republic",
            "TD" => "Chad",
            "CL" => "Chile",
            "CN" => "China",
            "CX" => "Christmas Island",
            "CC" => "Cocos (Keeling) Islands",
            "CO" => "Colombia",
            "KM" => "Comoros",
            "CG" => "Congo",
            "CK" => "Cook Islands",
            "CR" => "Costa Rica",
            "HR" => "Croatia",
            "CU" => "Cuba",
            "CY" => "Cyprus",
            "CZ" => "Czech Republic",
            "DK" => "Denmark",
            "DJ" => "Djibouti",
            "DM" => "Dominica",
            "DO" => "Dominican Republic",
            "TP" => "East Timor",
            "EC" => "Ecuador",
            "EG" => "Egypt",
            "SV" => "El Salvador",
            "GQ" => "Equatorial Guinea",
            "ER" => "Eritrea",
            "EE" => "Estonia",
            "ET" => "Ethiopia",
            "FK" => "Falkland Islands",
            "FO" => "Faroe Islands",
            "FJ" => "Fiji",
            "FI" => "Finland",
            "CS" => "Former Czechoslovakia",
            "SU" => "Former USSR",
            "FR" => "France",
            "FX" => "France (European Territory)",
            "GF" => "French Guyana",
            "TF" => "French Southern Territories",
            "GA" => "Gabon",
            "GM" => "Gambia",
            "GE" => "Georgia",
            "DE" => "Germany",
            "GH" => "Ghana",
            "GI" => "Gibraltar",
            "GB" => "Great Britain",
            "GR" => "Greece",
            "GL" => "Greenland",
            "GD" => "Grenada",
            "GP" => "Guadeloupe (French)",
            "GU" => "Guam (USA)",
            "GT" => "Guatemala",
            "GN" => "Guinea",
            "GW" => "Guinea Bissau",
            "GY" => "Guyana",
            "HT" => "Haiti",
            "HM" => "Heard and McDonald Islands",
            "HN" => "Honduras",
            "HK" => "Hong Kong",
            "HU" => "Hungary",
            "IS" => "Iceland",
            "IN" => "India",
            "ID" => "Indonesia",
            "INT" => "International",
            "IR" => "Iran",
            "IQ" => "Iraq",
            "IE" => "Ireland",
            "IL" => "Israel",
            "IT" => "Italy",
            "CI" => "Ivory Coast (Cote D'Ivoire)",
            "JM" => "Jamaica",
            "JP" => "Japan",
            "JO" => "Jordan",
            "KZ" => "Kazakhstan",
            "KE" => "Kenya",
            "KI" => "Kiribati",
            "KW" => "Kuwait",
            "KG" => "Kyrgyzstan",
            "LA" => "Laos",
            "LV" => "Latvia",
            "LB" => "Lebanon",
            "LS" => "Lesotho",
            "LR" => "Liberia",
            "LY" => "Libya",
            "LI" => "Liechtenstein",
            "LT" => "Lithuania",
            "LU" => "Luxembourg",
            "MO" => "Macau",
            "MK" => "Macedonia",
            "MG" => "Madagascar",
            "MW" => "Malawi",
            "MY" => "Malaysia",
            "MV" => "Maldives",
            "ML" => "Mali",
            "MT" => "Malta",
            "MH" => "Marshall Islands",
            "MQ" => "Martinique (French)",
            "MR" => "Mauritania",
            "MU" => "Mauritius",
            "YT" => "Mayotte",
            "MX" => "Mexico",
            "FM" => "Micronesia",
            "MD" => "Moldavia",
            "MC" => "Monaco",
            "MN" => "Mongolia",
            "MS" => "Montserrat",
            "MA" => "Morocco",
            "MZ" => "Mozambique",
            "MM" => "Myanmar",
            "NA" => "Namibia",
            "NR" => "Nauru",
            "NP" => "Nepal",
            "NL" => "Netherlands",
            "AN" => "Netherlands Antilles",
            "NT" => "Neutral Zone",
            "NC" => "New Caledonia (French)",
            "NZ" => "New Zealand",
            "NI" => "Nicaragua",
            "NE" => "Niger",
            "NG" => "Nigeria",
            "NU" => "Niue",
            "NF" => "Norfolk Island",
            "KP" => "North Korea",
            "MP" => "Northern Mariana Islands",
            "NO" => "Norway",
            "OM" => "Oman",
            "PK" => "Pakistan",
            "PW" => "Palau",
            "PA" => "Panama",
            "PG" => "Papua New Guinea",
            "PY" => "Paraguay",
            "PE" => "Peru",
            "PH" => "Philippines",
            "PN" => "Pitcairn Island",
            "PL" => "Poland",
            "PF" => "Polynesia (French)",
            "PT" => "Portugal",
            "PR" => "Puerto Rico",
            "QA" => "Qatar",
            "RE" => "Reunion (French)",
            "RO" => "Romania",
            "RU" => "Russian Federation",
            "RW" => "Rwanda",
            "GS" => "S. Georgia & S. Sandwich Isls.",
            "SH" => "Saint Helena",
            "KN" => "Saint Kitts & Nevis Anguilla",
            "LC" => "Saint Lucia",
            "PM" => "Saint Pierre and Miquelon",
            "ST" => "Saint Tome (Sao Tome) and Principe",
            "VC" => "Saint Vincent & Grenadines",
            "WS" => "Samoa",
            "SM" => "San Marino",
            "SA" => "Saudi Arabia",
            "SN" => "Senegal",
            "SC" => "Seychelles",
            "SL" => "Sierra Leone",
            "SG" => "Singapore",
            "SK" => "Slovak Republic",
            "SI" => "Slovenia",
            "SB" => "Solomon Islands",
            "SO" => "Somalia",
            "ZA" => "South Africa",
            "KR" => "South Korea",
            "ES" => "Spain",
            "LK" => "Sri Lanka",
            "SD" => "Sudan",
            "SR" => "Suriname",
            "SJ" => "Svalbard and Jan Mayen Islands",
            "SZ" => "Swaziland",
            "SE" => "Sweden",
            "CH" => "Switzerland",
            "SY" => "Syria",
            "TJ" => "Tadjikistan",
            "TW" => "Taiwan",
            "TZ" => "Tanzania",
            "TH" => "Thailand",
            "TG" => "Togo",
            "TK" => "Tokelau",
            "TO" => "Tonga",
            "TT" => "Trinidad and Tobago",
            "TN" => "Tunisia",
            "TR" => "Turkey",
            "TM" => "Turkmenistan",
            "TC" => "Turks and Caicos Islands",
            "TV" => "Tuvalu",
            "UG" => "Uganda",
            "UA" => "Ukraine",
            "AE" => "United Arab Emirates",
            "UY" => "Uruguay",
            "MIL" => "USA Military",
            "UM" => "USA Minor Outlying Islands",
            "UZ" => "Uzbekistan",
            "VU" => "Vanuatu",
            "VA" => "Vatican City State",
            "VE" => "Venezuela",
            "VN" => "Vietnam",
            "VG" => "Virgin Islands (British)",
            "VI" => "Virgin Islands (USA)",
            "WF" => "Wallis and Futuna Islands",
            "EH" => "Western Sahara",
            "YE" => "Yemen",
            "YU" => "Yugoslavia",
            "ZR" => "Zaire",
            "ZM" => "Zambia",
            "ZW" => "Zimbabwe"
  }
  
  @@sorts = [
    ["ACTIVITY", "Socrata Grade"],
    ["ALPHA", "A - Z"],
    ["ALPHA_DESC", "Z - A"],
    ["NUM_OF_FOLLOWERS", "# of Followers"],
    ["NUM_OF_FRIENDS", "# of Friends"],
    ["LAST_LOGGED_IN", "Last Login Date"],
    ["NUM_OF_PUBLIC_TABLES", "# of Public Data Sets"]
  ]

  @@search_sorts = [
    ["RELEVANCE", "Relevance"],
    ["SCORE", "Socrata Grade"],
    ["NEWEST", "Recently updated"],
    ["OLDEST", "Oldest"],
    ["LAST_LOGIN", "Last Login Date"]
  ]


end
