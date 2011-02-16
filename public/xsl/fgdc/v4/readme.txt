FGDC Plus.xsl (version 2.0)

FGDC Plus.xsl is an XSL template that can be use with ArcGIS software
to display metadata. It shows metadata elements defined in the Content 
Standard for Digital Geospatial Metadata (CSDGM), aka FGDC Standard;
the ESRI Profile of the Content Standard for Digital Geospatial Metadata
(ESRI Profile); the Biological Data Profile of the Content Standard for 
Digital Geospatial Metadata (Biological Data Profile); and the Shoreline
Data Profile of the Content Standard for Digital Geospatial Metadata
(Shoreline Data Profile). The FGDC Plus Stylesheet includes the Dublin
Core Metadata Element Set. This stylsheet is in the public domain and
may be freely used, modified, and redistributed. It is provided "AS-IS"
without warranty or technical support.

Installation Instructions:

1.  Copy "FGDC Plus.xsl" to where other ArcGIS metadata stylesheets are 
    installed such as in C:\Program Files\ArcGIS\Metadata\Stylesheets.

Key Features:

1.  Supports W3C DOM compatible browsers such as IE7, IE6, Netscape 7, and Mozilla Firefox.
2.  Metadata content organized into sections that expand and collapse.
3.  Click on title to toggle expansion and collapse of all content (metadata sections).
4   Click on one of the links below title to tab to (open) one metadata section at at time.
5.  Page footer links to http://www.fgdc.gov/ web site.
6.  Over 40 metadata elements are parsed to respect line breaks introduced by metadata
    author to either start a new line or a new paragraph, depending on number of line breaks
    or white space characters present.
7.  Over 40 elements are searched for internal strings that containing a "://" or "www.",
    converting each one to a hypertext link to the corresponding web page.
8.  Browse graphic image with description displayed together on same page if image type is 
    JPG, JPEG, GIF, PNG, or BMP. Other file types like PDF open in separate in window.		
9.  Enumerated attribute domain values are listed in HTML table, which can be opened and closed.
10. Ignores metadata elements that contain all whitespace (spaces, carriage returns, tabs, line feeds, etc).
11. Includes Dublin Core Metadata Element Set.
12. Includes Biological Data Profile elements of CSDGM.
13. Includes Shoreline Data Profile elements of CSDGM.

FGDC Profile

1.  All metadata elements supported.
2.  Process Steps include full descriptions of each Data Source Used and Produced as long as
    the value of Process Step's Source Citation Used (srcused) and Source Citation Produced 
    (srcprod) metadata element match a Data Source Citation (srccitea) metadata element value.

ESRI Profile

1.  Includes ESRI Thumbnail image created in ArcCatalog (/metadata/Binary/Thumbnail).
2.  Includes ESRI Geoprocessing History elements (/metadata/Esri/DataProperties/lineage/Process).
3.  Includes ESRI Feature Terms elements (/metadata/spdoinfo/ptvctinf/esriterm).
4.  Includes ESRI Geometric Network elements (/metadata/spdoinfo/netinfo).
5.  Includes ESRI Subtype elements (/metadata/eainfo/detailed/subtype).
6.  Includes ESRI Relationship Class elements (/metadata/eainfo/detailed/relinfo).
7.  Includes ESRI Topology elements (/metadata/Esri/DataProperties/topoinfo). Note, topology
    rules are named and described as shown on ESRI's topology_rules_poster.pdf
8.  Includes ESRI Raster elements in (/metadata/spdoinfo/rastinfo).
9.  Includes ESRI Address Locator elements (/metadata/Esri/Locator).
10. Includes ESRI Terrain elements (/metadata/Esri/DataProperties/Terrain).

Biological Data Profile

1. Includes Biological Data - Geographic Extent elements (/metadata/idinfo/spdom/descgeog).
2. Includes Biological Data - Bounding Altitude elements (/metadata/idinfo/spdom/boundalt).
3. Includes Biological Data - ASCII file Structure elements (/metadata/distinfo/digform/asciistr).
4. Includes Biological Data - Taxonomy elements (/metadata/idinfo/taxonomy).
5. Includes Biological Data - Analytical Tool elements (/metadata/idinfo/tool).
6. Includes Biological Data - Methodology elements (/metadata/dataqual/lineage/method).
7. Includes Biological Data - Geologic Age elements (/metadata/idinfo/timeperd/timeinfo/sngdate/geolage, 
   /metadata/idinfo/timeperd/timeinfo/rngdates/beggeol/geolage, and
   /metadata/idinfo/timeperd/timeinfo/rngdates/endgeol/geolage).

Shoreline Data Profile

1. Includes Shoreline Data - Geographic Extent elements (/metadata/idinfo/spdom/descgeog).
2. Includes Shoreline Data - Tide Information elements (/metadata/dataqual/tidinfo).
3. Includes Shoreline Data - Marine Weather Condition elements (/metadata/dataqual/marweat).
4. Includes Shoreline Data - Environmental Event (/metadata/dataqual/event).

Revision History:

1.  Created March, 2006 (ver 1.0) by Howie Sternberg
2.  Revised May, 2006 (ver 1.1) by Howie Sternberg
    - Added removewhitespace() javascript function to navigate HTML in Netscape 7 and 
      Mozilla Firefox so that DIV elements open and close when clicked on in these browsers.
3.  Revised May, 2006 (ver 1.2) by Howie Sternberg
    - Added better documention to removewhitespace(), fixvalue(), and addtext() javascript functions.
    - Added Metadata Stylesheet description to Metadata Reference section. 
    - Added Help to Description section
4.  Revised May, 2006 (ver 1.3) by Howie Sternberg
    - Moved Help to FGDC Plus Metadata Stylesheet in Metadata Reference section
    - Added normalize-space() XSL function to test node text values for whitespace before writing HTML. The normalize-space()
      function removes leading and trailing whitespace and condenses all internal whitespace into a single string. In XML,
      whitespace includes spaces, carriage returns, tabs, line feeds, etc. The function is used to ignore metadata entered
      in ArcCatalog that only contains white space.
5.  Revised May, 2006 (ver 1.4) by Howie Sternberg
    - Modified clickmaster() javascript function to also call allchildrenopenedexcept(p,"md-detailhelp") to fix
      bug with opening and closing Metadata Reference section, which includes "md-detailhelp" class element.
6.  Revised June, 2006 (ver 1.5) by Howie Sternberg
    - Replaced fixvalue() and addtext() javascript functions with those more recently developed for
      "FGDC Classic for Web.xsl" and "FGDC FAQ for Web.xsl" stylesheets.
7.  Revised July, 2006 (ver 1.6) by Howie Sternberg
    - Added window.focus() to javascript onload function when showing transformed metadata in browser window that pops up.
    - Fixed bug with showing entity attributes. Now works when ESRI enttypt element is not present in metadata XML.
    - Changed display of entity attribute domain range and codeset values to be like enumerated attribute
      domain values, which are listed in HTML table that opens and closes.
8.  Modified July 29, 2006 (ver 1.7) by Howie Sternberg
    - Changed to initially display all metadata sections instead of just the Description section (#md-description)
      by modifying the initial style for #md-description, #md-graphic, #md-spatial, #md-structure, #md-quality, #md-source,
      #md-distribution, and #md-metadata from {display: none;} to {display: block;} in the fgdc_plus.css stylesheet.
    - Changed initial display of all metadata detail sections so that only the Citation description is shown by default by
      using .md-detailhide for all div elements except for the Citation description div, which uses .md-detailshow.
9.  Modified January 2, 2007 (ver 1.8) for ArcGIS 9.2 by Howie Sternberg
    - Added Dublin Core Metadata Element Set (http://dublincore.org/)
    - Added ESRI Address Locator elements (/metadata/Esri/Locator).
    - Added ESRI Terrain elements (/metadata/Esri/DataProperties/Terrain).
    - Added ESRI Thumbnail image created in ArcCatalog (/metadata/Binary/Thumbnail).
    - Fixed bug in addtext() JavaScript function to convert URL text strings into hypertext links even if URL text string is
      bound by one or two punctuation marks, brackets or parenthesis. Hypertext links are now created for URLs enclosed in
      parenthesis and followed by a punctuation mark. For example in the following phrase, the ( charater before the URL string
      and the ). characters following the URL string are not included in the HREF value - Go to ESRI (www.esri.com).
10. Modified February 3, 2007 (ver 2.0) by Howie Sternberg
    - Added Biological Data Profile elements of CSDGM (http://www.fgdc.gov/standards/projects/FGDC-standards-projects/metadata/biometadata/biodatap.pdf)
    - Added Shoreline Data Profile elements of CSDGM (http://www.csc.noaa.gov/metadata/sprofile.pdf)	  	  
    - Added metadata descriptions user can hide and show. Added setupclickdef() and  clickdef() JavaScript functions.
    - Renamed Data Format to Data Type and moved it to the Description section.
    - Reordered items in Description section.
    - Added Metadata Security Information section.