class User < Model
  extend FindExtensions

  cattr_accessor :current_user, :states, :countries, :sorts, :search_sorts, :csv_columns
  attr_accessor :session_token

  def self.find_profile(id)
    parse(CoreServer::Base.connection.get_request("/users/#{id}.json?method=getProfile"))
  end

  def self.find_multiple(ids)
    parse(CoreServer::Base.connection.get_request("/users.json?#{{'ids' => ids}.to_param}"))
  end

  def self.create(attributes, inviteToken = nil, authToken = nil)
    opts = {}
    if inviteToken.present?
      opts[:inviteToken] = inviteToken
    end
    if authToken.present?
      opts[:authToken] = authToken
    end

    if FeatureFlags.derive[:enable_new_account_verification_email]
      opts[:email_verification] = true
    end
    path = "/users.json?#{opts.to_param}"
    parse(CoreServer::Base.connection.create_request(path, attributes.to_json))
  end

  def self.set_role(username, role)
    parse(CoreServer::Base.connection.update_request("/users.json?method=promote&name=#{username}&role=#{role}"))
  end

  def self.re_enable_permissions(username)
    parse(CoreServer::Base.connection.update_request("/users.json?method=reEnablePermissions&name=#{username}"))
  end

  def self.reset_password(login)
    req = Net::HTTP::Post.new('/users')
    req.set_form_data('method' => 'forgotPassword', 'login' => login)

    # pass/spoof in the current domain cname
    req['X-Socrata-Host'] = CurrentDomain.cname

    result = Net::HTTP.start(CORESERVICE_URI.host, CORESERVICE_URI.port) do |http|
      http.request(req)
    end

    result.is_a?(Net::HTTPSuccess)
  end

  def self.roles_list
    (RequestStore[:roles_list] ||= {})[CurrentDomain.cname] ||=
      Configuration.find_by_type('user_rights', false, CurrentDomain.cname, true).
        inject([]) do |memo, config|
          memo.concat(config.properties.keys)
        end.uniq
  end

  def self.verify_email(token)
    parse(CoreServer::Base.connection.create_request("/users.json?method=finishAccountCreate&token=#{token}"))
  end

  def self.find_deleted_user(email)
    parse(CoreServer::Base.connection.get_request("/users.json?method=getDeletedByEmail&email=#{CGI.escape(email)}"))
  end

  def self.undelete(uid)
    parse(CoreServer::Base.connection.update_request("/users.json?method=undelete&uid=#{uid}"))
  end

  def create(inviteToken = nil, authToken = nil)
    User.create(data_hash, inviteToken, authToken)
  end

  def update_password(params)
    self.class.parse(CoreServer::Base.connection.update_request("/users/#{id}.json", params.to_json))
  end

  def prepare_json
    dhash = data_hash
    dhash['displayState'] = displayState
    dhash['displayCountry'] = displayCountry
    dhash['displayLocation'] = displayLocation
    dhash['htmlDescription'] = htmlDescription
    dhash['profile_image'] = profile_image_path
    dhash
  end

  def to_json(options = nil)
    prepare_json.to_json(options)
  end

  def to_csv_row(options = nil)
    User.csv_columns.keys.map { |column| @data[column] }
  end

  def route_params
    { profile_name: (displayName || '-').convert_to_url, id: id }
  end

  def displayScore
    if score.nil?
      '0'
    elsif score > 0.90
      '%.1f' % (score * 100)
    else
      '%d' % (score * 100)
    end
  end

  def displayState
    state.nil? ? '' : @@states[state.upcase]
  end

  def displayCountry
    country.nil? ? '' : @@countries[country.upcase]
  end

  def displayTitleAndOrg
    title_pieces = []
    title_pieces << title if title.present?
    title_pieces << company if company.present?
    title_pieces.join(', ')
  end

  def displayLocation
    loc_pieces = []
    loc_pieces << city if city.present?
    loc_pieces << displayState if state.present? && country == 'US'
    loc_pieces << displayCountry if country.present?
    loc_pieces.join(', ')
  end

  def htmlDescription
    (description.blank? ? '' : CGI.escapeHTML(description).gsub("\n", '<br/>')).html_safe
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

  def auth0_identifiers
    path = '/auth0_identifiers.json'
    Auth0Identifier.parse(CoreServer::Base.connection.get_request(path))
  end

  def app_tokens
    AppToken.find_by_user_id(id)
  end

  def my_friend?
    current_user.present? && current_user.friends.any? { |friend| friend.id == id }
  end

  # size can be "medium", or "small"
  def profile_image_path(size = 'medium')
    if size == 'large'
      profileImageUrlLarge || '/images/large-profile.png'
    elsif size == 'medium'
      profileImageUrlMedium || '/images/medium-profile.png'
    elsif size == 'small'
      profileImageUrlSmall || '/images/small-profile.png'
    else
     "/users/#{id}/profile_images/#{size}"
    end
  end

  def profile_image=(file)
    CoreServer::Base.connection.multipart_post_file("/users/#{id}/profile_images", file)
  end

  def is_owner?(view)
    view.owner.id == id
  end
  alias :owner? :is_owner?

  def is_roled_user?
    role_name.present?
  end
  alias :roled_user? :is_roled_user?

  # Recently renamed from is_admin? to avoid confusion. Renamed in the Javascript code as well.
  def is_superadmin?
    flag?('admin')
  end
  alias :superadmin? :is_superadmin?

  def has_right_to_publish?(view)
    # Taken from View.java canUpdateView:1257 in core
    view.rights_include?(ViewRights::UPDATE_VIEW) || has_right?(UserRights::EDIT_OTHERS_DATASETS)
  end

  def has_right?(right)
    rights.to_a.include?(right)
  end

  def can_approve?
    has_right?(UserRights::MANAGE_APPROVAL) || (Approval.find()[0] || Approval.new).is_approver?(self)
  end

  def can_create_or_edit_visualization_canvas?
    is_roled_user? || is_superadmin?
  end

  def can_use_site_appearance?
    is_superadmin? ||
      (FeatureFlags.derive[:site_appearance_visible] &&
      has_right?(UserRights::EDIT_SITE_THEME))
  end

  def role_name
    @data['roleName']
  end

  def sort_key
    (displayName || email).to_s.downcase
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
    'US' => 'United States',
    'UK' => 'United Kingdom',
    'CA' => 'Canada',
    'AF' => 'Afghanistan',
    'AL' => 'Albania',
    'DZ' => 'Algeria',
    'AS' => 'American Samoa',
    'AD' => 'Andorra',
    'AO' => 'Angola',
    'AI' => 'Anguilla',
    'AQ' => 'Antarctica',
    'AG' => 'Antigua and Barbuda',
    'AR' => 'Argentina',
    'AM' => 'Armenia',
    'AW' => 'Aruba',
    'AU' => 'Australia',
    'AT' => 'Austria',
    'AZ' => 'Azerbaidjan',
    'BS' => 'Bahamas',
    'BH' => 'Bahrain',
    'BD' => 'Bangladesh',
    'BB' => 'Barbados',
    'BY' => 'Belarus',
    'BE' => 'Belgium',
    'BZ' => 'Belize',
    'BJ' => 'Benin',
    'BM' => 'Bermuda',
    'BT' => 'Bhutan',
    'BO' => 'Bolivia',
    'BA' => 'Bosnia-Herzegovina',
    'BW' => 'Botswana',
    'BV' => 'Bouvet Island',
    'BR' => 'Brazil',
    'IO' => 'British Indian Ocean Territory',
    'BN' => 'Brunei Darussalam',
    'BG' => 'Bulgaria',
    'BF' => 'Burkina Faso',
    'BI' => 'Burundi',
    'KH' => 'Cambodia',
    'CM' => 'Cameroon',
    'CV' => 'Cape Verde',
    'KY' => 'Cayman Islands',
    'CF' => 'Central African Republic',
    'TD' => 'Chad',
    'CL' => 'Chile',
    'CN' => 'China',
    'CX' => 'Christmas Island',
    'CC' => 'Cocos (Keeling) Islands',
    'CO' => 'Colombia',
    'KM' => 'Comoros',
    'CG' => 'Congo',
    'CK' => 'Cook Islands',
    'CR' => 'Costa Rica',
    'HR' => 'Croatia',
    'CU' => 'Cuba',
    'CY' => 'Cyprus',
    'CZ' => 'Czech Republic',
    'DK' => 'Denmark',
    'CD' => 'Democratic Republic of the Congo',
    'DJ' => 'Djibouti',
    'DM' => 'Dominica',
    'DO' => 'Dominican Republic',
    'TP' => 'East Timor',
    'EC' => 'Ecuador',
    'EG' => 'Egypt',
    'SV' => 'El Salvador',
    'GQ' => 'Equatorial Guinea',
    'ER' => 'Eritrea',
    'EE' => 'Estonia',
    'ET' => 'Ethiopia',
    'FK' => 'Falkland Islands',
    'FO' => 'Faroe Islands',
    'FJ' => 'Fiji',
    'FI' => 'Finland',
    'CS' => 'Former Czechoslovakia',
    'SU' => 'Former USSR',
    'FR' => 'France',
    'FX' => 'France (European Territory)',
    'GF' => 'French Guyana',
    'TF' => 'French Southern Territories',
    'GA' => 'Gabon',
    'GM' => 'Gambia',
    'GE' => 'Georgia',
    'DE' => 'Germany',
    'GH' => 'Ghana',
    'GI' => 'Gibraltar',
    'GB' => 'Great Britain',
    'GR' => 'Greece',
    'GL' => 'Greenland',
    'GD' => 'Grenada',
    'GP' => 'Guadeloupe (French)',
    'GU' => 'Guam (USA)',
    'GT' => 'Guatemala',
    'GN' => 'Guinea',
    'GW' => 'Guinea Bissau',
    'GY' => 'Guyana',
    'HT' => 'Haiti',
    'HM' => 'Heard and McDonald Islands',
    'HN' => 'Honduras',
    'HK' => 'Hong Kong',
    'HU' => 'Hungary',
    'IS' => 'Iceland',
    'IN' => 'India',
    'ID' => 'Indonesia',
    'INT' => 'International',
    'IR' => 'Iran',
    'IQ' => 'Iraq',
    'IE' => 'Ireland',
    'IL' => 'Israel',
    'IT' => 'Italy',
    'CI' => "Ivory Coast (Cote D'Ivoire)",
    'JM' => 'Jamaica',
    'JP' => 'Japan',
    'JO' => 'Jordan',
    'KZ' => 'Kazakhstan',
    'KE' => 'Kenya',
    'KI' => 'Kiribati',
    'KW' => 'Kuwait',
    'KG' => 'Kyrgyzstan',
    'LA' => 'Laos',
    'LV' => 'Latvia',
    'LB' => 'Lebanon',
    'LS' => 'Lesotho',
    'LR' => 'Liberia',
    'LY' => 'Libya',
    'LI' => 'Liechtenstein',
    'LT' => 'Lithuania',
    'LU' => 'Luxembourg',
    'MO' => 'Macau',
    'MK' => 'Macedonia',
    'MG' => 'Madagascar',
    'MW' => 'Malawi',
    'MY' => 'Malaysia',
    'MV' => 'Maldives',
    'ML' => 'Mali',
    'MT' => 'Malta',
    'MH' => 'Marshall Islands',
    'MQ' => 'Martinique (French)',
    'MR' => 'Mauritania',
    'MU' => 'Mauritius',
    'YT' => 'Mayotte',
    'MX' => 'Mexico',
    'FM' => 'Micronesia',
    'MD' => 'Moldavia',
    'MC' => 'Monaco',
    'MN' => 'Mongolia',
    'MS' => 'Montserrat',
    'MA' => 'Morocco',
    'MZ' => 'Mozambique',
    'MM' => 'Myanmar',
    'NA' => 'Namibia',
    'NR' => 'Nauru',
    'NP' => 'Nepal',
    'NL' => 'Netherlands',
    'AN' => 'Netherlands Antilles',
    'NT' => 'Neutral Zone',
    'NC' => 'New Caledonia (French)',
    'NZ' => 'New Zealand',
    'NI' => 'Nicaragua',
    'NE' => 'Niger',
    'NG' => 'Nigeria',
    'NU' => 'Niue',
    'NF' => 'Norfolk Island',
    'KP' => 'North Korea',
    'MP' => 'Northern Mariana Islands',
    'NO' => 'Norway',
    'OM' => 'Oman',
    'PK' => 'Pakistan',
    'PW' => 'Palau',
    'PA' => 'Panama',
    'PG' => 'Papua New Guinea',
    'PY' => 'Paraguay',
    'PE' => 'Peru',
    'PH' => 'Philippines',
    'PN' => 'Pitcairn Island',
    'PL' => 'Poland',
    'PF' => 'Polynesia (French)',
    'PT' => 'Portugal',
    'PR' => 'Puerto Rico',
    'QA' => 'Qatar',
    'RE' => 'Reunion (French)',
    'RO' => 'Romania',
    'RU' => 'Russian Federation',
    'RW' => 'Rwanda',
    'GS' => 'S. Georgia & S. Sandwich Isls.',
    'SH' => 'Saint Helena',
    'KN' => 'Saint Kitts & Nevis Anguilla',
    'LC' => 'Saint Lucia',
    'PM' => 'Saint Pierre and Miquelon',
    'ST' => 'Saint Tome (Sao Tome) and Principe',
    'VC' => 'Saint Vincent & Grenadines',
    'WS' => 'Samoa',
    'SM' => 'San Marino',
    'SA' => 'Saudi Arabia',
    'SN' => 'Senegal',
    'SC' => 'Seychelles',
    'SL' => 'Sierra Leone',
    'SG' => 'Singapore',
    'SK' => 'Slovak Republic',
    'SI' => 'Slovenia',
    'SB' => 'Solomon Islands',
    'SO' => 'Somalia',
    'ZA' => 'South Africa',
    'KR' => 'South Korea',
    'ES' => 'Spain',
    'LK' => 'Sri Lanka',
    'SD' => 'Sudan',
    'SR' => 'Suriname',
    'SJ' => 'Svalbard and Jan Mayen Islands',
    'SZ' => 'Swaziland',
    'SE' => 'Sweden',
    'CH' => 'Switzerland',
    'SY' => 'Syria',
    'TJ' => 'Tadjikistan',
    'TW' => 'Taiwan',
    'TZ' => 'Tanzania',
    'TH' => 'Thailand',
    'TG' => 'Togo',
    'TK' => 'Tokelau',
    'TO' => 'Tonga',
    'TT' => 'Trinidad and Tobago',
    'TN' => 'Tunisia',
    'TR' => 'Turkey',
    'TM' => 'Turkmenistan',
    'TC' => 'Turks and Caicos Islands',
    'TV' => 'Tuvalu',
    'UG' => 'Uganda',
    'UA' => 'Ukraine',
    'AE' => 'United Arab Emirates',
    'UY' => 'Uruguay',
    'MIL' => 'USA Military',
    'UM' => 'USA Minor Outlying Islands',
    'UZ' => 'Uzbekistan',
    'VU' => 'Vanuatu',
    'VA' => 'Vatican City State',
    'VE' => 'Venezuela',
    'VN' => 'Vietnam',
    'VG' => 'Virgin Islands (British)',
    'VI' => 'Virgin Islands (USA)',
    'WF' => 'Wallis and Futuna Islands',
    'EH' => 'Western Sahara',
    'YE' => 'Yemen',
    'YU' => 'Yugoslavia',
    'ZM' => 'Zambia',
    'ZW' => 'Zimbabwe'
  }

  @@sorts = [
    ['ACTIVITY', 'Socrata Grade'],
    ['ALPHA', 'A - Z'],
    ['ALPHA_DESC', 'Z - A'],
    ['NUM_OF_FOLLOWERS', '# of Followers'],
    ['NUM_OF_FRIENDS', '# of Friends'],
    ['LAST_LOGGED_IN', 'Last Login Date'],
    ['NUM_OF_PUBLIC_TABLES', '# of Public Datasets']
  ]

  @@search_sorts = [
    ['RELEVANCE', 'Relevance'],
    ['SCORE', 'Socrata Grade'],
    ['NEWEST', 'Recently updated'],
    ['OLDEST', 'Oldest'],
    ['LAST_LOGIN', 'Last Login Date']
  ]

  @@csv_columns = {
    'id' => 'UID',
    'displayName' => 'Display Name',
    'email' => 'Email Address',
    'roleName' => 'Role'
  }

end
