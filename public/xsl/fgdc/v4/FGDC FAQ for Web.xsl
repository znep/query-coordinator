<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<!-- An xsl template for displaying metadata in ArcInfo8 with the traditional FGDC look and feel created by mp

	Copyright (c) 2000-2005, Environmental Systems Research Institute, Inc. All rights reserved.

	Supports W3C DOM compatible browsers such as IE6, IE7, Netscape 7, and Mozilla Firefox.
		
	Revision History:
		Created 03/17/00 avienneau
		Modified 07/04/06 by Howie Sternberg - Modified to support W3C DOM compatible
		browsers such as IE6, Netscape 7, and Mozilla Firefox using different
		Javascript for parsing text to respect line breaks in metadata when page loads:
		1.  Added window.onload function, which calls fixvalue() Javascript function.
		2.  Replaced fix() with fixvalue() and addtext() Javascript functions.
		3.  Replaced <xsl:value-of/> with <xsl:value-of select="."/>.
		4.  Replaced XSL code for building Distribution_Information links, using position() and last().
		5.  Replaced <xsl:stylesheet xmlns:xsl="http://www.w3.org/tr/WD-xsl" TYPE="text/javascript">
		    with <xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
		6.  Replaced <SCRIPT><xsl:comment><![CDATA[
		    with <script type="text/javascript" language="JavaScript1.3"><![CDATA[
		7.  Replaced <pre ID="original"><xsl:eval>this.text</xsl:eval></pre><SCRIPT>fix(original)</SCRIPT>
		   usually with <div><pre id="fixvalue"><xsl:value-of select="."/></pre></div>, removing enclosing div elements if present.
		8.  Lowercased all HTML element and attribute names.
		9.  Changed <BODY oncontextmenu="return true"> to <body>
		10. Changed all margin-left: values to pixels (e.g. from style="margin-left:'0.2in'" to style="margin-left:20")
		11. Changed all <xsl:if test="context()[not(end())]"> to <xsl:if test="position() != last()">
		12. Removed use of context()[] and $any$ in XSL code
		13. Replaced table, th, and td element attributes (e.g. border=, cellpadding=, valign=) with inline Style.
		Modified 7/29/06 - Howie Sternberg:
		1.  Set font-size: 9pt to all th and td elements. Changed title to H1 and Frequently-asked questions: to H2.
		Modified January 2, 2007 - Howie Sternberg
		1.  Added Dublin Core Metadata Element Set (http://dublincore.org/)
		2.  Fixed bug in addtext() JavaScript function to convert URL text strings into hypertext links even if URL text string is
			bound by one or two punctuation marks, brackets or parenthesis. Hypertext links are now created for URLs enclosed in
			parenthesis and followed by a punctuation mark. For example in the following phrase, the ( charater before the URL string
			and the ). characters following the URL string are not included in the HREF value - Go to ESRI (www.esri.com).
-->

<xsl:template match="/">
<html>
<head>
<xsl:call-template name="head_title"/>
<xsl:call-template name="head_dublin_core"/>
<script type="text/javascript" language="JavaScript1.3"><![CDATA[
/* Onload - Find each <pre> element with an Id="fixvalue" and
call fixvalue() function to parse text to respect line breaks,
replace <pre> element with <div> elememt, and convert URL address
strings in text to <a href> element. */

window.onload = function() {
	elem = document.getElementById("fixvalue");
	while (Boolean(elem != null)) {
		fixvalue(elem);
		elem = document.getElementById("fixvalue");
	}
	window.focus()
}
	
/* Fix value - Parse text in <pre> element to respect line breaks introduced in ArcCatalog
by the metadata author who intentionally introduced single line breaks to start new lines
or even more than one consecutive line break to further separate text to form paragraphs.
Note, fixvalue() calls the addtext() function, which adds text to DIV elements, which are
sequentially added to a parent DIV element to form separate lines and paragraphs of text. */

function fixvalue(elem) {
	elem.id = "";
	var n
	var val = String("");
	var pos = Number(0);
	// Make a newline character to use for basis for splitting string into 
	// an array of strings that are processed and turned into separate div
	// elements with either new line or paragraphic-like style.
	var newline = String.fromCharCode(10);
	var par = elem.parentNode;
	if (elem.innerText) {
		// Position of first newline character in IE
		n = elem;
		val = n.innerText;
		pos = val.indexOf(newline);
	} else {
		// Position of first newline character in NS, Firefox
		n = elem.childNodes[0];
		val = n.nodeValue;
		pos = val.indexOf(newline);
	}
	if (pos > 0) {
		// Text string contains at least one white space character
		var sValue = new String ("");
		// Split entire text string value on newline character
		// in order to create an array of string values to process	
		var aValues = val.split(newline);
		var padBottom = Number(0);
		var add = Boolean("false");
		// Loop thru each potential new line or paragraph and append <DIV>
		// element and set its className accordingly.				
		for (var i = 0; i <= aValues.length - 1; i++) {
			var div = document.createElement("DIV");
			sValue = aValues[i];
			add = false;
			for (var j = 0; j < sValue.length; j++) {
				if (sValue.charCodeAt(j) > 32) {
					add = true;
					// window.alert("CHARACTER AT " + sValue.charAt(j) + " CHARCODE " + sValue.charCodeAt(j))
					break;
				}
			}
			if (add) {
				if (i == 0) {
					// Must clone and append label property (e.g. <b>Abstract</b>) to first <DIV>
					// element, and then remove it from parent if at first element in aValues array.
					prev = elem.previousSibling;
					if (Boolean(prev != null)) {
						var label = prev.cloneNode(true)
						div.appendChild(label);
						par.removeChild(prev);
					}
				}
				// Now test to see whether to set style.paddingBottom to 0 or 4 for newline or 
				// paragraph, respectively.  Look ahead and if all characters in the next element 
				// in the aValues array (the next DIV element to make) are not white space then set
				// style.paddingBottom = 0. Otherwise, set style.paddingBottom = 4 to separate the 
				// the current <DIV> from the next <DIV> element. 			
				padBottom = Number(0);
				if (i < aValues.length - 1) {
					// Assume paragraph-like separation between DIV elements
					padBottom = Number(4);
					// Look for non-white space characters in content for next DIV
					var nextValue = aValues[i+1];
					for (var k = 0; k < nextValue.length; k++) {
						if (nextValue.charCodeAt(k) > 32) {
							// Found a non-white space character
							padBottom = Number(0);
							// window.alert("CHARACTER AT " + nextval.charAt(k) + " CHARCODE " + nextval.charCodeAt(k))
							break;
						}
					}
				}
				// Pad element
				div.style.paddingLeft = 0;
				div.style.paddingRight = 0;
				div.style.paddingTop = 0;
				div.style.paddingBottom = padBottom;
				// Scan text for URL strings before adding text to div element
				addtext(div,sValue);
				// Add new div element to parent div element
				par.appendChild(div);
			}
		}
		par.removeChild(elem);
	} else {
		// No white space charaters in text string so can be added directly to parent DIV element.
		par.removeChild(elem);
		// Scan text for URL strings before adding text to div element
		addtext(par,val);
	}		
}

/* Add text - This function adds text to (inside) DIV element, but before doing so 
searches for strings in the text that resemble URLs and converts them to hypertext
elements and adds them to the div element as well. Searches for strings that begin 
with "://" or "www." and converts them to <a href> elements. Add text function is 
called by fixvalue function */ 
 
function addtext(elem,txt) {
	// Scan entire text value and test for presense of URL strings, 
	// convert URL strings to Hypertext Elements, convert text strings
	// between URL strings to Text Nodes and append all Hypertext
	// Elements and Text Nodes to DIV element.
	var start = new Number (0);
	var end = new Number (0);
	var url = new String("");
	var urlpattern = /(\w+):\/\/([\w.]+)((\S)*)|www\.([\w.]+)((\S)*)/g;
	var punctuation = /[\.\,\;\:\?\!\[\]\(\)\{\}\'\"]/;
	var result
	var elemText
	while((result = urlpattern.exec(txt)) != null) {
		var fullurl = result[0];
		var protocol = result[1];
		url = fullurl;
		end = result.index;
		if (start < end){
			// Append Text Node to parent
			elemText = document.createTextNode(txt.substring(start, end));
			elem.appendChild(elemText);
		}
		var lastchar = fullurl.charAt(fullurl.length - 1);
		// Remove last character from url if character is punctuation mark, bracket or parenthesis;
		if (lastchar.match(punctuation) != null) {
			// Remove next-to-last character from url if character is punctuation mark, bracket or parenthesis. For example the ")" in "),"
			var nexttolastchar = fullurl.charAt(fullurl.length - 2);
			if (nexttolastchar.match(punctuation) != null) {
				url = fullurl.substring(0,fullurl.length - 2);		
			} else {		
				url = fullurl.substring(0,fullurl.length - 1);
			}		
		}
		start = (result.index + url.length)
		// Test to concatinate 'http://' to url if not already begininng with 'http://', 'https://' or 'ftp://'"
		if (protocol == "") {
			url = "http://" + url;
		}
		// Append Hypertext (anchor) Element to parent
		elemText = document.createTextNode(url);
		var elemAnchor = document.createElement("A");
		elemAnchor.setAttribute("href", url);
		elemAnchor.setAttribute("target", "viewer");
		elemAnchor.appendChild(elemText);
		elem.appendChild(elemAnchor);				
	}
	end = txt.length;
	if (start < end) {
		// Append Text Node that follows last Hypertext Element
		elemText = document.createTextNode(txt.substring(start, end));
		elem.appendChild(elemText);
	}
}
]]></script>
  </head>

  <body>

    <a name="Top"/>
    <xsl:for-each select="metadata/idinfo/citation/citeinfo/title[. != '']">
      <h1><xsl:value-of select="."/></h1>
    </xsl:for-each>

    <h2>Frequently-asked questions:</h2>
    <ul>
      <li>
        <a href="#what">What does this data set describe?</a> 
        <ol>
          <li><a href="#what.1">How should this data set be cited?</a></li>
          <li><a href="#what.2">What geographic area does the data set cover?</a></li>
          <li><a href="#what.3">What does it look like?</a></li>
          <li><a href="#what.4">Does the data set describe conditions during a particular time period?</a></li>
          <li><a href="#what.5">What is the general form of this data set?</a></li>
          <li><a href="#what.6">How does the data set represent geographic features?</a></li>
          <li><a href="#what.7">How does the data set describe geographic features?</a></li>
        </ol>
      </li>
      <li>
        <a href="#who">Who produced the data set?</a> 
        <ol>
          <li><a href="#who.1">Who are the originators of the data set?</a></li>
          <li><a href="#who.2">Who also contributed to the data set?</a></li>
          <li><a href="#who.3">To whom should users address questions about the data?</a></li>
        </ol>
      </li>
      <li><a href="#why">Why was the data set created?</a></li>
      <li>
        <a href="#how">How was the data set created?</a> 
        <ol>
          <li><a href="#how.1">Where did the data come from?</a></li>
          <li><a href="#how.2">What changes have been made?</a></li>
        </ol>
      </li>
      <li>
        <a href="#quality">How reliable are the data; what problems remain in the data set?</a> 
        <ol>
          <li><a href="#quality.1">How well have the observations been checked?</a></li>
          <li><a href="#quality.2">How accurate are the geographic locations?</a></li>
          <li><a href="#quality.3">How accurate are the heights or depths?</a></li>
          <li><a href="#quality.4">Where are the gaps in the data? What is missing?</a></li>
          <li><a href="#quality.5">How consistent are the relationships among the data, including topology?</a></li>
        </ol>
      </li>
      <li>
        <a href="#getacopy">How can someone get a copy of the data set?</a> 
        <ol>
          <li><a href="#getacopy.0">Are there legal restrictions on access or use of the data?</a></li>
          <li><a href="#getacopy.1">Who distributes the data?</a></li>
          <li><a href="#getacopy.2">What's the catalog number I need to order this data set?</a></li>
          <li><a href="#getacopy.3">What legal disclaimers am I supposed to read?</a></li>
          <li><a href="#getacopy.4">How can I download or order the data?</a></li>
          <li><a href="#getacopy.5">Is there some other way to get the data?</a></li>
          <li><a href="#getacopy.6">What hardware or software do I need in order to use the data set?</a></li>
        </ol>
      </li>
      <li><a href="#metaref">Who wrote the metadata?</a></li>
    </ul>
    <hr/>

    <a name="what"><h3>What does this data set describe?</h3></a>
    <div style="margin-left:20">
      <xsl:for-each select="metadata/idinfo/citation/citeinfo/title[. != '']">
        <div><i>Title: </i></div>
        <div style="margin-left:40"><xsl:value-of select="."/></div>
        <br/>
      </xsl:for-each>

      <xsl:for-each select="metadata/idinfo/descript/abstract[. != '']">
        <div><i>Abstract: </i></div>
        <div style="margin-left:40">
          <pre id="fixvalue"><xsl:value-of select="."/></pre>      
        </div>
        <br/>
      </xsl:for-each>

      <xsl:for-each select="metadata/idinfo/descript/supplinf[. != '']">
        <div><i>Supplemental information: </i></div>
        <div style="margin-left:40">
          <pre id="fixvalue"><xsl:value-of select="."/></pre>      
        </div>
        <br/>
      </xsl:for-each>
    </div>

    <ol>
      <li>
        <a name="what.1"><b>How should this data set be cited?</b></a>
        <br/><br/>
        <xsl:apply-templates select="metadata/idinfo/citation/citeinfo"/>
      </li>

      <li>
        <a name="what.2"><b>What geographic area does the data set cover?</b></a>
        <br/><br/>
        <xsl:for-each select="metadata/idinfo/spdom/bounding[* != '']">
          <div style="margin-left:20">
            <div>Bounding coordinates:</div>
            <div style="margin-left:40">
              <xsl:for-each select="westbc[. != '']"><div><i>West: </i><xsl:value-of select="."/></div></xsl:for-each>
              <xsl:for-each select="eastbc[. != '']"><div><i>East: </i><xsl:value-of select="."/></div></xsl:for-each>
              <xsl:for-each select="northbc[. != '']"><div><i>North: </i><xsl:value-of select="."/></div></xsl:for-each>
              <xsl:for-each select="southbc[. != '']"><div><i>South: </i><xsl:value-of select="."/></div></xsl:for-each>
            </div>
          </div>
          <br/>
        </xsl:for-each>
      </li>

      <li>
        <a name="what.3"><b>What does it look like?</b></a>
        <br/><br/>
        <xsl:for-each select="metadata/idinfo/browse[(browsen != '') or (browset != '') or (browsed != '')]">
          <div style="margin-left:20">
            <div>
              <xsl:for-each select="browsen[. != '']">
                <a target="viewer"><xsl:attribute name="href"><xsl:value-of select="."/></xsl:attribute><xsl:value-of select="."/></a>
              </xsl:for-each>
              <xsl:for-each select="browset[. != '']">
                (<xsl:value-of select="."/>)
              </xsl:for-each>
            </div>
            <xsl:for-each select="browsed[. != '']">
              <div style="margin-left:40"><xsl:value-of select="."/></div>
            </xsl:for-each>
          </div>
          <br/>
        </xsl:for-each>
      </li>

      <li>
        <a name="what.4"><b>Does the data set describe conditions during a particular time period?</b></a>
        <br/><br/>
        <xsl:for-each select="metadata/idinfo/timeperd[(.//caldate != '') or 
            (timeinfo/rngdates/* != '') or (current != '')]">
          <xsl:apply-templates select="timeinfo"/>
          <xsl:for-each select="current[. != '']">
            <div style="margin-left:20"><i>Currentness reference: </i></div>
            <div style="margin-left:60">
              <pre id="fixvalue"><xsl:value-of select="."/></pre>      
            </div>
          </xsl:for-each>
          <br/>
        </xsl:for-each>
     </li>

      <li>
        <a name="what.5"><b>What is the general form of this data set?</b></a>
        <br/><br/>
        <xsl:for-each select="metadata/idinfo/citation/citeinfo/geoform[. != '']">
          <div style="margin-left:20"><i>Geospatial data presentation form: </i><xsl:value-of select="."/></div>
          <br/>
        </xsl:for-each>
      </li>

      <li>
        <a name="what.6"><b>How does the data set represent geographic features?</b></a>
        <br/><br/>
        <ol TYPE="a">
          <li>
            <b>How are geographic features stored in the data set?</b>
            <br/><br/>
            <xsl:for-each select="metadata/spdoinfo/indspref[. != '']">
              <div style="margin-left:20">
                <i>Indirect spatial reference: </i>
                <div style="margin-left:40"><xsl:value-of select="."/></div>
              </div>
              <br/>
            </xsl:for-each>
            <xsl:if test="metadata/spdoinfo[(direct != '') or (ptvctinf/sdtsterm/* != '') or 
                (ptvctinf/vpfterm//* != '') or  (rastinfo/colcount != '') or 
                (rastinfo/rowcount != '') or (rastinfo/vrtcount != '') or 
                (rastinfo/rasttype != '')]">
              <div style="margin-left:20">
                <xsl:for-each select="metadata/spdoinfo/direct[. != '']">
                  This is a <xsl:value-of select="."/> data set.
                </xsl:for-each>
                <xsl:if test="metadata/spdoinfo/ptvctinf[sdtsterm/* != '']">
                  It contains the following vector data types (SDTS terminology):
                  <ul>
                    <xsl:for-each select="metadata/spdoinfo/ptvctinf/sdtsterm[* != '']">
                      <li><xsl:for-each select="sdtstype[. != '']"><xsl:value-of select="."/> </xsl:for-each><xsl:for-each select="ptvctcnt[. != '']"> (<xsl:value-of select="."/>)</xsl:for-each></li>
                    </xsl:for-each>
                  </ul>
                </xsl:if>
                <xsl:if test="metadata/spdoinfo/ptvctinf[vpfterm//* != '']">
                  <xsl:for-each select="metadata/spdoinfo/ptvctinf/vpfterm/vpflevel[. != '']">
                    The VPF topology level is <xsl:value-of select="."/>.
                  </xsl:for-each>
                  <xsl:if test="metadata/spdoinfo/ptvctinf/vpfterm[vpfinfo/* != '']">
                    It contains the following vector data types (VPF terminology):
                    <ul>
                      <xsl:for-each select="metadata/spdoinfo/ptvctinf/vpfterm/vpfinfo[* != '']">
                        <li><xsl:for-each select="vpftype[. != '']"><xsl:value-of select="."/> </xsl:for-each><xsl:for-each select="ptvctcnt[. != '']">(<xsl:value-of select="."/>)</xsl:for-each></li>
                      </xsl:for-each>
                    </ul>
                  </xsl:if>
                </xsl:if>
                <xsl:if test="metadata/spdoinfo/rastinfo[(rowcount != '') or (colcount != '') or (vrtcount != '') or (rasttype != '')]">
                  It contains the following raster data types:
                  <ul>
                    <xsl:for-each select="metadata/spdoinfo/rastinfo">
                      <li>
                        <xsl:if test="(rowcount != '') or (colcount != '') or (vrtcount != '')">
                          Dimensions <xsl:value-of select="rowcount[. != '']"/> x <xsl:value-of select="colcount[. != '']"/><xsl:for-each select="vrtcount[. != '']"> x <xsl:value-of select="."/></xsl:for-each>
                        </xsl:if><xsl:if test="((rowcount != '') or (colcount != '') or (vrtcount != '')) and (rasttype != '')">, </xsl:if>
                        <xsl:for-each select="rasttype[. != '']">type <xsl:value-of select="."/></xsl:for-each>
                      </li>
                    </xsl:for-each>
                  </ul>
                </xsl:if>
              </div>
              <br/>
            </xsl:if>
          </li>

          <li>
            <b>What coordinate system is used to represent geographic features?</b>
            <br/><br/>
            <xsl:if test="metadata/spref[.//* != '']">
              <div style="margin-left:20">
                <xsl:for-each select="metadata/spref/horizsys/geograph[* != '']">
                  <div>
                    Horizontal positions are specified in geographic coordinates, that is, latitude and longitude. 
                    <xsl:for-each select="latres[. != '']">Latitudes are given to the nearest <xsl:value-of select="."/>. </xsl:for-each>
                    <xsl:for-each select="longres[. != '']">Longitudes are given to the nearest <xsl:value-of select="."/>. </xsl:for-each>
                    <xsl:for-each select="geogunit[. != '']">Latitude and longitude values are specified in <xsl:value-of select="."/>. </xsl:for-each>
                  </div>
                  <br/>
                </xsl:for-each>
                <xsl:for-each select="metadata/spref/horizsys/planar[.//* != '']">
                  <xsl:for-each select="mapproj[.//* != '']">
                    <div>The map projection used is <xsl:value-of select="mapprojn[. != '']"/>.</div>
                    <br/>
                    <div>Projection parameters: </div>
                    <xsl:apply-templates select="*"/>
                    <br/>
                  </xsl:for-each>
                  <xsl:for-each select="gridsys[.//* != '']">
                    <div>The grid coordinate system used is <xsl:value-of select="gridsysn[. != '']"/></div>
                    <br/>
                    <xsl:apply-templates select="*"/>
                    <br/>
                  </xsl:for-each>
                  <xsl:for-each select="localp[* != '']">
                    <div>
                      Horizontal coordinates are specified using a local planar system.
                      <xsl:for-each select="localpd[. != '']"><xsl:value-of select="."/></xsl:for-each>
                    </div>
                    <br/>
                    <xsl:for-each select="localpgi[. != '']"><div><xsl:value-of select="."/></div><br/></xsl:for-each>
                  </xsl:for-each>
                  <xsl:for-each select="planci[* != '']">
                    <xsl:for-each select="plance[. != '']"><div>Planar coordinates are encoded using <xsl:value-of select="."/>.</div></xsl:for-each>
                    <xsl:for-each select="coordrep/absres[. != '']"><div>Abscissae (x-coordinates) are specified to the nearest <xsl:value-of select="."/>.</div></xsl:for-each>
                    <xsl:for-each select="coordrep/ordres[. != '']"><div>Ordinates (y-coordinates) are specified to the nearest <xsl:value-of select="."/>.</div></xsl:for-each>
                    <xsl:for-each select="distbrep[* != '']">
                      <div>Planar coordinates are specified using distance and bearing values.</div>
                      <xsl:for-each select="distres[. != '']"><div>Resolution of distance values: <xsl:value-of select="."/></div></xsl:for-each>
                      <xsl:for-each select="bearres[. != '']"><div>Resolution of bearing values: <xsl:value-of select="."/></div></xsl:for-each>
                      <xsl:for-each select="bearunit[. != '']"><div>Bearing is specified in units of <xsl:value-of select="."/>.</div></xsl:for-each>
                      <xsl:for-each select="bearrefd[. != '']"><div>Bearing is measured <xsl:value-of select="."/>.</div></xsl:for-each>
                      <xsl:for-each select="bearrefm[. != '']"><div>Bearing is measured from the <xsl:value-of select="."/> meridian.</div></xsl:for-each>
                    </xsl:for-each>
                    <xsl:for-each select="plandu[. != '']"><div>Planar coordinates are specified in <xsl:value-of select="."/>.</div></xsl:for-each>
                    <br/>
                  </xsl:for-each>
                </xsl:for-each>
                <xsl:for-each select="metadata/spref/horizsys/local[* != '']">
                  This local coordinate system was used: <xsl:value-of select="localdes[. != '']"/>.
                  <br/><br/>
                  <xsl:for-each select="localgeo[. != '']"><xsl:value-of select="."/></xsl:for-each>
                  <br/><br/>
                </xsl:for-each>
                <xsl:for-each select="metadata/spref/horizsys/geodetic[* != '']">
                  <xsl:for-each select="horizdn[. != '']"><div>The horizontal datum used is <xsl:value-of select="."/>.</div></xsl:for-each>
                  <xsl:for-each select="ellips[. != '']"><div>The ellipsoid used is <xsl:value-of select="."/>.</div></xsl:for-each>
                  <xsl:for-each select="semiaxis[. != '']"><div>The semi-major axis of the ellipsoid used is <xsl:value-of select="."/>.</div></xsl:for-each>
                  <xsl:for-each select="denflat[. != '']"><div>The flattening of the ellipsoid used is 1/<xsl:value-of select="."/>.</div></xsl:for-each>
                  <br/>
                </xsl:for-each>
                <xsl:for-each select="metadata/spref/vertdef[.//* != '']">
                  Vertical coordinate system definition:
                  <div style="margin-left:20">
                    <xsl:for-each select="altsys[* != '']">
                      Altitude system definition:
                      <div style="margin-left:40">
                        <xsl:for-each select="altdatum[. != '']"><div><i>Altitude datum name: </i>  <xsl:value-of select="."/></div></xsl:for-each>
                        <xsl:for-each select="altres[. != '']"><div><i>Altitude resolution: </i>  <xsl:value-of select="."/></div></xsl:for-each>
                        <xsl:for-each select="altunits[. != '']"><div><i>Altitude distance units: </i>  <xsl:value-of select="."/></div></xsl:for-each>
                        <xsl:for-each select="altenc[. != '']"><div><i>Altitude encoding method: </i>  <xsl:value-of select="."/></div></xsl:for-each>
                      </div>
                    </xsl:for-each>
                    <xsl:if test="(altsys/* != '') and (depthsys/* != '')">
                      <br/>
                    </xsl:if>
                    <xsl:for-each select="depthsys[* != '']">
                      Depth system definition:
                      <div style="margin-left:40">
                        <xsl:for-each select="depthdn[. != '']"><div><i>Depth datum name: </i>  <xsl:value-of select="."/></div></xsl:for-each>
                        <xsl:for-each select="depthres[. != '']"><div><i>Depth resolution: </i>  <xsl:value-of select="."/></div></xsl:for-each>
                        <xsl:for-each select="depthdu[. != '']"><div><i>Depth distance units: </i>  <xsl:value-of select="."/></div></xsl:for-each>
                        <xsl:for-each select="depthem[. != '']"><div><i>Depth encoding method: </i>  <xsl:value-of select="."/></div></xsl:for-each>
                      </div>
                    </xsl:for-each>
                  </div>
                  <br/>
                </xsl:for-each>
              </div>
            </xsl:if>
          </li>
        </ol>
      </li>

      <li>
        <a name="what.7"><b>How does the data set describe geographic features?</b></a>
        <br/><br/>
        <xsl:for-each select="metadata/eainfo/detailed[enttyp/enttypl != '']">
          <div style="margin-left:20">
            <div><b><tt style="font-size:15"><xsl:value-of select="enttyp/enttypl"/></tt></b></div>
            <div style="margin-left:40">
              <xsl:for-each select="enttyp[(enttypd != '') or (enttypds != '')]">
                <div><pre id="fixvalue"><xsl:for-each select="enttypd[. != '']"><xsl:value-of select="."/></xsl:for-each><xsl:for-each select="enttypds[. != '']"><xsl:text> (Source: </xsl:text><xsl:value-of select="."/>)</xsl:for-each></pre></div>
                <br/>
              </xsl:for-each>
              <xsl:for-each select="attr[attrlabl != '']">
                <div><b><tt><xsl:value-of select="attrlabl"/></tt></b></div>
                <xsl:if test="attrdef[. != ''] or attrdefs[. != '']">
                  <div style="margin-left:40">
                  <pre id="fixvalue">
                  <xsl:for-each select="attrdef[. != '']">
                  <xsl:value-of select="."/>
                  </xsl:for-each>
                  <xsl:for-each select="attrdefs[. != '']">
                    <xsl:text> (Source: </xsl:text><xsl:value-of select="."/>)
                  </xsl:for-each>
                  </pre>
                  </div>
                  <br/>
                </xsl:if>
                <xsl:for-each select="attrmfrq[. != '']">
                  <div style="margin-left:40"><i>Frequency of measurement: </i><xsl:value-of select="."/></div>
                  <br/>
                </xsl:for-each>
                <xsl:for-each select="attrdomv/udom[. != '']">
                  <div style="margin-left:40"><i><xsl:value-of select="."/></i></div>
                  <br/>
                </xsl:for-each>
                <xsl:if test="attrdomv/edom[(edomv != '') or (edomvd != '')]">
                  <table style="margin-left:40; border-collapse:collapse;">
                    <tr>
                      <th style="font-size: 9pt; border: solid 1px #A9A9A9; padding:4px; vertical-align:top; text-align:center;">Value</th>
                      <th style="font-size: 9pt; border: solid 1px #A9A9A9; padding:4px; vertical-align:top; text-align:center;">Definition</th>
                    </tr>
                    <xsl:for-each select="attrdomv/edom[(edomv != '') or (edomvd != '')]">
                      <tr>
                        <td style="font-size: 9pt; border: solid 1px #A9A9A9; padding:4px; vertical-align:top;"><xsl:value-of select="edomv"/></td>
                        <td style="font-size: 9pt; border: solid 1px #A9A9A9; padding:4px; vertical-align:top;">
                          <div>
                            <xsl:choose>
                              <xsl:when test="edomvd[. != '']">
                                <xsl:for-each select="edomvd[. != '']">
                                  <pre id="fixvalue"><xsl:value-of select="."/></pre>
                                </xsl:for-each>
                              </xsl:when>
                              <xsl:otherwise xml:space="preserve">
                                <div> [not provided] </div></xsl:otherwise></xsl:choose>
                          </div>
                        </td>
                      </tr>
                    </xsl:for-each>
                  </table>
                  <br/>
                </xsl:if>
                <xsl:if test="attrdomv/rdom[* != '']">
                  <table style="margin-left:40; border-collapse:collapse;">
                    <tr>
                      <th colspan="2" style="font-size: 9pt; border: solid 1px #A9A9A9; padding:4px; vertical-align:top; text-align:center;">Range of values</th>
                    </tr>
                    <xsl:for-each select="attrdomv/rdom/rdommin[. != '']">
                      <tr>
                        <th style="font-size: 9pt; border: solid 1px #A9A9A9; padding:4px; vertical-align:top; text-align:left;">Minimum:</th>
                        <td style="font-size: 9pt; border: solid 1px #A9A9A9; padding:4px; vertical-align:top;"><xsl:value-of select="."/></td>
                      </tr>
                    </xsl:for-each>
                    <xsl:for-each select="attrdomv/rdom/rdommax[. != '']">
                      <tr>
                        <th style="font-size: 9pt; border: solid 1px #A9A9A9; padding:4px; vertical-align:top; text-align:left;">Maximum:</th>
                        <td style="font-size: 9pt; border: solid 1px #A9A9A9; padding:4px; vertical-align:top;"><xsl:value-of select="."/></td>
                      </tr>
                    </xsl:for-each>
                    <xsl:for-each select="attrdomv/rdom/attrunit[. != '']">
                      <tr>
                        <th style="font-size: 9pt; border: solid 1px #A9A9A9; padding:4px; vertical-align:top; text-align:left;">Units:</th>
                        <td style="font-size: 9pt; border: solid 1px #A9A9A9; padding:4px; vertical-align:top;"><xsl:value-of select="."/></td>
                      </tr> 
                    </xsl:for-each>
                    <xsl:for-each select="attrdomv/rdom/attrmres[. != '']">
                      <tr>
                        <th style="font-size: 9pt; border: solid 1px #A9A9A9; padding:4px; vertical-align:top; text-align:left;">Resolution:</th>
                        <td style="font-size: 9pt; border: solid 1px #A9A9A9; padding:4px; vertical-align:top;"><xsl:value-of select="."/></td>
                      </tr>
                    </xsl:for-each>
                  </table>
                  <br/>
                </xsl:if>
                <xsl:if test="attrdomv/codesetd[* != '']">
                  <table style="margin-left:40; border-collapse:collapse;">
                    <tr>
                      <th colspan="2" style="font-size: 9pt; border: solid 1px #A9A9A9; padding:4px; vertical-align:top; text-align:center;">Formal codeset</th>
                    </tr>
                    <xsl:for-each select="attrdomv/codesetd/codesetn[. != '']">
                      <tr>
                        <th style="font-size: 9pt; border: solid 1px #A9A9A9; padding:4px; vertical-align:top; text-align:left;">Codeset name:</th>
                        <td style="font-size: 9pt; border: solid 1px #A9A9A9; padding:4px; vertical-align:top;"><xsl:value-of select="."/></td>
                      </tr>
                    </xsl:for-each>
                    <xsl:for-each select="attrdomv/codesetd/codesets[. != '']">
                      <tr> 
                        <th style="font-size: 9pt; border: solid 1px #A9A9A9; padding:4px; vertical-align:top; text-align:left;">Codeset source:</th>
                        <td style="font-size: 9pt; border: solid 1px #A9A9A9; padding:4px; vertical-align:top;"><xsl:value-of select="."/></td>
                      </tr>
                    </xsl:for-each>
                  </table>
                  <br/>
                </xsl:if>
              </xsl:for-each>
            </div>
          </div>
        </xsl:for-each>
        <xsl:for-each select="metadata/eainfo/overview[* != '']">
          <div style="margin-left:20">
            <xsl:for-each select="eaover[. != '']">
              <div><i>Entity and attribute overview: </i></div>
              <div style="margin-left:40">
                <pre id="fixvalue"><xsl:value-of select="."/></pre>      
              </div>
            </xsl:for-each>
            <xsl:if test="(eaover != '') and (eadetcit != '')">
              <br/>
            </xsl:if>
            <xsl:for-each select="eadetcit[. != '']">
              <div><i>Entity and attribute detail citation: </i></div>
              <div style="margin-left:40">
                <pre id="fixvalue"><xsl:value-of select="."/></pre>      
              </div>
            </xsl:for-each>
            <xsl:if test="position() != last()">
              <br/>
            </xsl:if>
          </div>
        </xsl:for-each>
      </li>
    </ol>
    <a href="#Top">Back to Top</a>
    <hr/>

    <a name="who"><h3>Who produced the data set?</h3></a>
    <ol>
      <li>
        <a name="who.1"><b>Who are the originators of the data set?</b> (may include formal authors, digital compilers, and editors)</a>
        <br/><br/>
        <xsl:if test="metadata/idinfo/citation/citeinfo/origin[. != '']">
          <ul>
            <xsl:for-each select="metadata/idinfo/citation/citeinfo/origin[. != '']">
              <li><xsl:value-of select="."/></li>
            </xsl:for-each>
          </ul>
          <br/>
        </xsl:if>
      </li>

      <li>
       <a name="who.2"><b>Who also contributed to the data set?</b></a>
        <br/><br/>
        <xsl:for-each select="metadata/idinfo/datacred[. != '']">
          <div style="margin-left:20">
            <pre id="fixvalue"><xsl:value-of select="."/></pre>      
          </div>
          <br/>
        </xsl:for-each>
     </li>

      <li>
        <a name="who.3"><b>To whom should users address questions about the data?</b></a>
        <br/><br/>
        <xsl:apply-templates select="metadata/idinfo/ptcontac/cntinfo"/>
      </li>
    </ol>
    <a href="#Top">Back to Top</a>
    <hr/>

    <a name="why"><h3>Why was the data set created?</h3></a>
    <xsl:for-each select="metadata/idinfo/descript/purpose[. != '']">
      <div style="margin-left:20">
        <pre id="fixvalue"><xsl:value-of select="."/></pre>      
      </div>
      <br/>
    </xsl:for-each>
    <a href="#Top">Back to Top</a>
    <hr/>
 
    <a name="how"><h3>How was the data set created?</h3></a>
    <ol>
      <li>
        <a name="how.1"><b>Where did the data come from?</b></a>
        <br/><br/>
        <xsl:for-each select="metadata/dataqual/lineage/srcinfo[(srccitea != '') or 
            (typesrc != '') or (srcscale != '') or (srccontr != '') or 
            (srccite/citeinfo/origin != '') or (srccite/citeinfo/pubdate != '') or 
            (srccite/citeinfo/title != '') or (srccite/citeinfo/serinfo/* != '') or 
            (srccite/citeinfo/pubinfo/* != '') or (srccite/citeinfo/onlink != '') or 
            (srccite/citeinfo/ othercit != '')]">
            <xsl:variable name="srcinfoPosition">
              <xsl:number value="position()" format="1"/>
            </xsl:variable>
            <xsl:variable name="srcinfoLast">
              <xsl:number value="last()" format="1"/>
            </xsl:variable>
          <div style="margin-left:20">
            <div>
              <xsl:for-each select="srccitea[. != '']"><b><xsl:value-of select="."/></b>
               (source <xsl:value-of select="$srcinfoPosition"/> of <xsl:value-of select="$srcinfoLast"/>)
              </xsl:for-each>
            </div>
            <xsl:if test="srccite/citeinfo[(origin != '') or (pubdate != '') or 
                (title != '') or (serinfo/* != '') or (pubinfo/* != '') or 
                (onlink != '') or (othercit != '')]">
              <br/>
              <div style="margin-left:20">
                <xsl:apply-templates select="srccite/citeinfo"/>
              </div>
            </xsl:if>
            <xsl:for-each select="typesrc[. != '']">
              <div style="margin-left:40"><i>Type of source media: </i><xsl:value-of select="."/></div>
            </xsl:for-each>
            <xsl:for-each select="srcscale[. != '']">
              <div style="margin-left:40"><i>Source scale denominator: </i><xsl:value-of select="."/></div>
            </xsl:for-each>
            <xsl:for-each select="srccontr[. != '']">
              <div style="margin-left:40"><i>Source contribution: </i></div>
              <div style="margin-left:80">
                <pre id="fixvalue"><xsl:value-of select="."/></pre>      
              </div>
            </xsl:for-each>
          </div>
          <br/>
        </xsl:for-each>
      </li>

      <li>
        <a name="how.2"><b>What changes have been made?</b></a>
        <br/><br/>
        <xsl:for-each select="metadata/dataqual/lineage/procstep[(procdate != '') or 
            (procdesc != '') or (srcused != '') or (srcprod != '') or 
            (proccont/cntinfo/cntperp/* != '') or (proccont/cntinfo/cntorgp/* != '') or 
            (proccont/cntinfo/cntaddr/address != '') or (proccont/cntinfo/cntaddr/city != '') or 
            (proccont/cntinfo/cntaddr/state != '') or (proccont/cntinfo/cntaddr/postal != '') or 
            (proccont/cntinfo/cntaddr/country != '') or (proccont/cntinfo/cntvoice != '') or 
            (proccont/cntinfo/cntfax != '') or (proccont/cntinfo/cntemail != '') or 
            (proccont/cntinfo/hours != '') or (proccont/cntinfo/cntinst != '')]">
            <xsl:variable name="procstepPosition">
              <xsl:number value="position()" format="1"/>
            </xsl:variable>
            <xsl:variable name="procstepLast">
              <xsl:number value="last()" format="1"/>
            </xsl:variable>
          <div style="margin-left:20">
            <div>
              <xsl:for-each select="procdate[. != '']"><i>Date: </i><xsl:value-of select="."/>
              (change <xsl:value-of select="$procstepPosition"/> of <xsl:value-of select="$procstepLast"/>)
              </xsl:for-each>
            </div>
            <xsl:for-each select="procdesc[. != '']">
              <div style="margin-left:40">
                <pre id="fixvalue"><xsl:value-of select="."/></pre>      
              </div>
              <br/>
            </xsl:for-each>
            <xsl:if test="proccont/cntinfo[(cntperp/* != '') or (cntorgp/* != '') or 
                (cntaddr/address != '') or (cntaddr/city != '') or (cntaddr/state != '') or 
                (cntaddr/postal != '') or (cntaddr/country != '') or (cntvoice != '') or 
                (cntfax != '') or (cntemail != '') or (hours != '') or (cntinst != '')]">
              <div style="margin-left:40">
                <i>Person responsible for change: </i><br/>
                <div style="margin-left:20"><xsl:apply-templates select="proccont/cntinfo"/></div>
              </div>
              <br/>
            </xsl:if>
            <xsl:if test="srcused[. != '']">
              <div style="margin-left:40">
                <i>Data sources used in this process: </i>
                <ul>
                  <xsl:for-each select="srcused[. != '']">
                    <li TYPE="disc"><xsl:value-of select="."/></li>
                  </xsl:for-each>
                </ul>
              </div>
              <br/>
            </xsl:if>
            <xsl:if test="srcprod[. != '']">
              <div style="margin-left:40">
                <i>Data sources produced in this process: </i>
                <ul>
                  <xsl:for-each select="srcprod[. != '']">
                    <li TYPE="disc"><xsl:value-of select="."/></li>
                  </xsl:for-each>
                </ul>
              </div>
              <br/>
            </xsl:if>
          </div>
        </xsl:for-each>
      </li>
    </ol>
    <a href="#Top">Back to Top</a>
    <hr/>

    <a name="quality"><h3>How reliable are the data; what problems remain in the data set?</h3></a>
    <ol>
      <li>
        <a name="quality.1"><b>How well have the observations been checked?</b></a>
        <br/><br/>
        <xsl:for-each select="metadata/dataqual/attracc/attraccr[. != '']">
          <div style="margin-left:20">
            <pre id="fixvalue"><xsl:value-of select="."/></pre>      
          </div>
          <br/>
        </xsl:for-each>
      </li>

      <li>
        <a name="quality.2"><b>How accurate are the geographic locations?</b></a>
        <br/><br/>
        <xsl:for-each select="metadata/dataqual/posacc/horizpa/horizpar[. != '']">
          <div style="margin-left:20">
            <pre id="fixvalue"><xsl:value-of select="."/></pre>      
          </div>
          <br/>
        </xsl:for-each>
      </li>

      <li>
        <a name="quality.3"><b>How accurate are the heights or depths?</b></a>
        <br/><br/>
        <xsl:for-each select="metadata/dataqual/posacc/vertacc/vertaccr[. != '']">
          <div style="margin-left:20">
            <pre id="fixvalue"><xsl:value-of select="."/></pre>      
          </div>
          <br/>
        </xsl:for-each>
      </li>

      <li>
        <a name="quality.4"><b>Where are the gaps in the data? What is missing?</b></a>
        <br/><br/>
        <xsl:for-each select="metadata/dataqual/complete[. != '']">
          <div style="margin-left:20">
            <pre id="fixvalue"><xsl:value-of select="."/></pre>      
          </div>
          <br/>
        </xsl:for-each>
      </li>

      <li>
        <a name="quality.5"><b>How consistent are the relationships among the observations, including topology?</b></a>
        <br/><br/>
        <xsl:for-each select="metadata/dataqual/logic[. != '']">
          <div style="margin-left:20">
            <pre id="fixvalue"><xsl:value-of select="."/></pre>      
          </div>
          <br/>
        </xsl:for-each>
      </li>
    </ol>
    <a href="#Top">Back to Top</a>
    <hr/>

    <a name="getacopy"><h3>How can someone get a copy of the data set?</h3></a>
    <div style="margin-left:20">
      <a name="getacopy.0"><b>Are there legal restrictions on access or use of the data?</b></a>
      <br/><br/>
      <xsl:for-each select="metadata/idinfo/accconst[. != '']">
        <div style="margin-left:20"><i>Access constraints: </i><xsl:value-of select="."/></div>
      </xsl:for-each>
      <xsl:for-each select="metadata/idinfo/useconst[. != '']">
        <div style="margin-left:20"><i>Use constraints: </i></div>
        <div style="margin-left:60">
          <pre id="fixvalue"><xsl:value-of select="."/></pre>      
        </div>
      </xsl:for-each>
      <xsl:if test="metadata/idinfo[(accconst != '') or (useconst != '')]">
        <br/>
      </xsl:if>
    </div>
    <xsl:for-each select="metadata/distinfo">
      <a><xsl:attribute name="name">Distrib<xsl:value-of select="position()"/></xsl:attribute></a>
      <div style="margin-left:20">
        <b>Distributor <xsl:value-of select="position()"/></b> of <xsl:value-of select="last()"/>
        <xsl:if test="position() > 1">
          &lt;<a><xsl:attribute name="href">#Distrib<xsl:value-of select="position() - 1"/></xsl:attribute>Back</a>&gt;
        </xsl:if>
        <xsl:if test="position() != last()">
          &lt;<a><xsl:attribute name="href">#Distrib<xsl:value-of select="position() + 1"/></xsl:attribute>Next</a>&gt;
        </xsl:if>
      </div>
      <br/>
      <ol>
        <div style="margin-left:20">
          <li>
            <a name="getacopy.1"><b>Who distributes the data set?</b></a>
            <br/><br/>
            <xsl:apply-templates select="distrib/cntinfo"/>
            <xsl:if test="distrib/cntinfo[(cntperp/* != '') or (cntorgp/* != '') or 
                (cntaddr/address != '') or (cntaddr/city != '') or (cntaddr/state != '') or 
                (cntaddr/postal != '') or (cntaddr/country != '') or (cntvoice != '') or 
                (cntfax != '') or (cntemail != '') or (hours != '') or (cntinst != '')]">
              <br/>
            </xsl:if>
          </li>

          <li>
            <a name="getacopy.2"><b>What's the catalog number I need to order this data set?</b></a>
            <br/><br/>
            <xsl:for-each select="resdesc[. != '']">
              <div style="margin-left:20"><xsl:value-of select="."/></div>
              <br/>
            </xsl:for-each>
          </li>

          <li>
            <a name="getacopy.3"><b>What legal disclaimers am I supposed to read?</b></a>
            <br/><br/>
            <xsl:for-each select="distliab[. != '']">
              <div style="margin-left:20">
                <pre id="fixvalue"><xsl:value-of select="."/></pre>      
              </div>
              <br/>
            </xsl:for-each>
          </li>

          <li>
            <a name="getacopy.4"><b>How can I download or order the data?</b></a>
            <br/><br/>
            <xsl:if test="stdorder[(nondig != '') or (digform/digtinfo/formcont != '') or 
                      (digform/digtinfo/formname != '') or (digform/digtinfo/formvern != '') or 
                      (digform/digtinfo/formspec != '') or (digform/digtinfo/transize != '') or 
                      (digform/digtopt/onlinopt/computer/networka/networkr != '') or 
                      (digform/digtopt/offoptn//* != '') or (fees != '') or 
                      (ordering != '') or (turnarnd != '')]">
              <xsl:for-each select="stdorder">
                <ul>
                  <xsl:for-each select="nondig[. != '']">
                    <li><b>Availability in non-digital form:</b>
                      <br/><br/>
                      <div style="margin-left:20"><xsl:value-of select="."/></div>
                      <br/>
                    </li>
                  </xsl:for-each>
                  <xsl:if test="digform[(digtinfo/formcont != '') or 
                      (digtinfo/formname != '') or (digtinfo/formvern != '') or 
                      (digtinfo/formspec != '') or (digtinfo/transize != '') or 
                      (digtopt/onlinopt/computer/networka/networkr != '') or 
                      (digtopt/offoptn//* != '')]">
                    <li><b>Availability in digital form:</b></li>
                    <br/><br/>
                    <div style="margin-left:20">
                      <xsl:for-each select="digform[(digtinfo/formcont != '') or 
                          (digtinfo/formname != '') or (digtinfo/formvern != '') or 
                          (digtinfo/formspec != '') or (digtinfo/transize != '') or 
                          (digtopt/onlinopt/computer/networka/networkr != '') or 
                          (digtopt/offoptn//* != '')]">
                        <table style="border-collapse:collapse;">
                          <tbody>
                            <xsl:if test="digtinfo[(formcont != '') or (formname != '') or 
                                (formvern != '') or (formspec != '') or (transize != '')]">
                              <tr>
                                <th style="font-size: 9pt; border: solid 1px #A9A9A9; padding:4px; vertical-align:top; text-align:left;">Data format:</th>
                                <td style="font-size: 9pt; border: solid 1px #A9A9A9; padding:4px; vertical-align:top;">
                                  <xsl:for-each select="digtinfo">
                                   <div>
                                    <xsl:for-each select="formcont[. != '']"><xsl:value-of select="."/></xsl:for-each>
                                    <xsl:for-each select="formname[. != '']"><xsl:text> in format </xsl:text><xsl:value-of select="."/></xsl:for-each>
                                    <xsl:for-each select="formvern[. != '']"><xsl:text> (version </xsl:text><xsl:value-of select="."/>)</xsl:for-each>
                                    <xsl:for-each select="formspec[. != '']"><xsl:text> </xsl:text><xsl:value-of select="."/></xsl:for-each>
                                    <xsl:for-each select="transize[. != '']"><xsl:text> Size: </xsl:text><xsl:value-of select="."/></xsl:for-each>
                                   </div>
                                    <xsl:if test="position() != last()">
                                      <br/><br/>
                                    </xsl:if>
                                  </xsl:for-each>
                                </td>
                              </tr>
                            </xsl:if>
                            <xsl:if test="digtopt/onlinopt/computer/networka/networkr[. != '']">
                              <tr>
                                <th style="font-size: 9pt; border: solid 1px #A9A9A9; padding:4px; vertical-align:top; text-align:left;">Network links:</th>
                                <td style="font-size: 9pt; border: solid 1px #A9A9A9; padding:4px; vertical-align:top;">
                                  <xsl:for-each select="digtopt/onlinopt/computer/networka/networkr[. != '']">
                                    <a><xsl:attribute name="href"><xsl:value-of select="."/></xsl:attribute><xsl:value-of select="."/></a>
                                    <xsl:if test="position() != last()">
                                      <br/>
                                    </xsl:if>
                                  </xsl:for-each>
                                </td>
                              </tr>
                            </xsl:if>
                            <xsl:if test="digtopt/offoptn[.//* != '']">
                              <tr>
                                <th style="font-size: 9pt; border: solid 1px #A9A9A9; padding:4px; vertical-align:top; text-align:left;">Media you can order:</th>
                                <td style="font-size: 9pt; border: solid 1px #A9A9A9; padding:4px; vertical-align:top;">
                                  <xsl:for-each select="digtopt/offoptn[.//* != '']">
                                    <xsl:value-of select="offmedia"/> 
                                    <xsl:for-each select="reccap[* != '']">(Density <xsl:value-of select="recden"/> <xsl:value-of select="recdenu"/>) </xsl:for-each>
                                    <xsl:for-each select="recfmt[. != '']">(format <xsl:value-of select="."/>)</xsl:for-each>
                                    <xsl:for-each select="compat[. != '']"><br/><br/>Note: <xsl:value-of select="."/></xsl:for-each>
                                    <xsl:if test="position() != last()">
                                      <br/><br/>
                                    </xsl:if>
                                  </xsl:for-each>
                                </td>
                              </tr>
                            </xsl:if>
                          </tbody>
                        </table>
                        <xsl:if test="position() != last()">
                          <br/>
                        </xsl:if>
                      </xsl:for-each>
                    </div>
                    <br/>
                  </xsl:if>
                  <xsl:for-each select="fees[. != '']">
                    <li><b>Cost to order the data: </b> <xsl:value-of select="."/></li>
                    <br/><br/>
                  </xsl:for-each>
                  <xsl:for-each select="ordering[. != '']">
                    <li><b>Special instructions:</b>
                      <br/><br/>
                      <div style="margin-left:20">
                        <pre id="fixvalue"><xsl:value-of select="."/></pre>      
                      </div>
                      <br/>
                    </li>
                  </xsl:for-each>
                  <xsl:for-each select="turnarnd[. != '']">
                    <li><b>How long will it take to get the data?</b>
                      <br/><br/>
                      <div style="margin-left:20"><xsl:value-of select="."/></div>
                      <br/>
                    </li>
                  </xsl:for-each>
                </ul>
              </xsl:for-each>
            </xsl:if>
          </li>

          <li>
            <a name="getacopy.5"><b>Is there some other way to get the data?</b></a>
            <br/><br/>
            <xsl:for-each select="custom[. != '']">
              <div style="margin-left:20">
                <pre id="fixvalue"><xsl:value-of select="."/></pre>      
              </div>
              <br/>
            </xsl:for-each>
          </li>

          <li>
            <a name="getacopy.6"><b>What hardware or software do I need in order to use the data set?</b></a>
            <br/><br/>
            <xsl:for-each select="techpreq[. != '']">
              <div style="margin-left:20"><xsl:value-of select="."/></div>
              <br/>
            </xsl:for-each>
          </li> 
        </div>
      </ol>
      <xsl:if test="position() != last()">
        <br/>
      </xsl:if>
    </xsl:for-each>
    <xsl:if test="metadata[not(distinfo)]">
      <div style="margin-left:20"><b>Distributor 0</b> of 0</div>
      <br/>
      <ol>
        <div style="margin-left:20">
          <li><a name="getacopy.1"><b>Who distributes the data set?</b></a><br/><br/></li>
          <li><a name="getacopy.2"><b>What's the catalog number I need to order this data set?</b></a><br/><br/></li>
          <li><a name="getacopy.3"><b>What legal disclaimers am I supposed to read?</b></a><br/><br/></li>
          <li><a name="getacopy.4"><b>How can I download or order the data?</b></a><br/><br/></li>
          <li><a name="getacopy.5"><b>Is there some other way to get the data?</b></a><br/><br/></li>
          <li><a name="getacopy.6"><b>What hardware or software do I need in order to use the data set?</b></a><br/><br/></li> 
        </div>
      </ol>
    </xsl:if>
    <a href="#Top">Back to Top</a>
    <hr/>

    <a name="metaref"><h3>Who wrote the metadata?</h3></a>
    <xsl:if test="metadata/metainfo[(metd != '') or (metrd != '') or (metfrd != '')]">
      <div style="margin-left:20">
        Dates:<br/>
        <div style="margin-left:40">
          <xsl:for-each select="metadata/metainfo/metd[. != '']"><div><i>Last modified: </i><xsl:value-of select="."/></div></xsl:for-each>
          <xsl:for-each select="metadata/metainfo/metrd[. != '']"><div><i>Last reviewed: </i><xsl:value-of select="."/></div></xsl:for-each>
          <xsl:for-each select="metadata/metainfo/metfrd[. != '']"><div><i>To be reviewed: </i><xsl:value-of select="."/></div></xsl:for-each>
        </div>
      </div>
      <br/>
    </xsl:if>
    <xsl:if test="metadata/metainfo/metc/cntinfo[(cntperp/* != '') or (cntorgp/* != '') or 
                (cntaddr/address != '') or (cntaddr/city != '') or (cntaddr/state != '') or 
                (cntaddr/postal != '') or (cntaddr/country != '') or (cntvoice != '') or 
                (cntfax != '') or (cntemail != '') or (hours != '') or (cntinst != '')]">
      <div style="margin-left:20">
        <i>Metadata author: </i><br/>
        <div style="margin-left:20"><xsl:apply-templates select="metadata/metainfo/metc/cntinfo"/></div>
      </div>
      <br/>
    </xsl:if>
    <xsl:if test="metadata/metainfo[(metstdn != '') or (metstdv != '')]">
      <div style="margin-left:20">
        <i>Metadata standard: </i><br/>
        <div style="margin-left:40">
          <xsl:value-of select="metadata/metainfo/metstdn[. != '']"/>
          <xsl:for-each select="metadata/metainfo/metstdv[. != '']">(<xsl:value-of select="."/>)</xsl:for-each>
        </div>
      </div>
      <br/>
    </xsl:if>
    <xsl:if test="metadata/metainfo/metextns/onlink[. != '']">
      <div style="margin-left:20">
        <i>Metadata extensions used: </i><br/>
        <xsl:for-each select="metadata/metainfo/metextns/onlink[. != '']">
          <li style="margin-left:30"><a target="viewer"><xsl:attribute name="href"><xsl:value-of select="."/></xsl:attribute><xsl:value-of select="."/></a></li>
        </xsl:for-each>
      </div>
      <br/>
    </xsl:if>
    <a href="#Top">Back to Top</a>
    <br/><br/>

  <!-- <br/><br/><br/><center><font color="#6495ED">Metadata stylesheets are provided courtesy of ESRI.  Copyright (c) 2000-2004, Environmental Systems Research Institute, Inc.  All rights reserved.</font></center> -->

  </body>
</html>
</xsl:template>

<!-- Head title -->
<xsl:template name="head_title">
	<xsl:choose>
		<xsl:when test="/metadata/idinfo/citation/citeinfo/title[normalize-space(.) != '']">
			<title><xsl:value-of select="/metadata/idinfo/citation/citeinfo/title[normalize-space(.)]"/></title>
		</xsl:when>
		<xsl:otherwise>
			<title>Metadata</title>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<!-- Dublin Core Metadata Element Set -->
<xsl:template name="head_dublin_core">
	<link rel="schema.dc" href="http://dublincore.org/documents/dces/"/>
	<!-- Title -->
	<xsl:for-each select="/metadata/idinfo/citation/citeinfo/title[normalize-space(.) != '']">
		<xsl:variable name="dc_title" select="normalize-space(.)"/>
		<meta name="dc.title" content='{$dc_title}'/>
	</xsl:for-each>
	<xsl:for-each select="/metadata/idinfo/citation/citeinfo/lworkcit/citeinfo/title[normalize-space(.) != '']">
		<xsl:variable name="dc_title" select="normalize-space(.)"/>
		<meta name="dc.title" content='{$dc_title}'/>
	</xsl:for-each>
	<!-- Creator -->
	<xsl:for-each select="/metadata/idinfo/citation/citeinfo/origin[normalize-space(.) != '']">
		<xsl:variable name="dc_creator" select="normalize-space(.)"/>
		<meta name="dc.creator" content='{$dc_creator}'/>
	</xsl:for-each>
	<xsl:for-each select="/metadata/idinfo/citation/citeinfo/lworkcit/citeinfo/origin[normalize-space(.) != '']">
		<xsl:variable name="dc_creator" select="normalize-space(.)"/>
		<meta name="dc.creator" content='{$dc_creator}'/>
	</xsl:for-each>
	<!-- Subject and Keywords -->
	<xsl:choose>
		<xsl:when test="/metadata/idinfo/keywords/theme/themekey[normalize-space(.) != '']">
			<xsl:variable name="dc_subject">
				<xsl:for-each select="/metadata/idinfo/keywords/theme/themekey[normalize-space(.) != '']">
					<xsl:choose>
						<xsl:when test="position() = 1">
							<xsl:value-of select="normalize-space(.)"/>
						</xsl:when>
						<xsl:otherwise>
							<xsl:text> </xsl:text><xsl:value-of select="normalize-space(.)"/>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:for-each>
			</xsl:variable>
			<meta name="dc.subject" content='{$dc_subject}'/>
		</xsl:when>
	</xsl:choose>
	<!-- Description -->
	<xsl:for-each select="/metadata/idinfo/descript/abstract[normalize-space(.) != '']">
		<xsl:variable name="dc_description" select="normalize-space(.)"/>
		<meta name="dc.description" content='{$dc_description}'/>
	</xsl:for-each>
	<!-- Publisher -->
	<xsl:for-each select="/metadata/idinfo/citation/citeinfo/pubinfo/publish[normalize-space(.) != '']">
		<xsl:variable name="dc_publisher" select="normalize-space(.)"/>
		<meta name="dc.publisher" content='{$dc_publisher}'/>
	</xsl:for-each>
	<!-- Contributor -->
	<xsl:for-each select="/metadata/idinfo/datacred[normalize-space(.) != '']">
		<xsl:variable name="dc_contributor" select="normalize-space(.)"/>
		<meta name="dc.contributor" content='{$dc_contributor}'/>
	</xsl:for-each>
	<!-- Date -->
	<xsl:for-each select="/metadata/idinfo/citation/citeinfo/pubdate[normalize-space(.) != '']">
		<xsl:variable name="dc_date" select="normalize-space(.)"/>
		<meta name="dc.date" content='{$dc_date}'/>
	</xsl:for-each>
	<!-- Resource Type -->
	<xsl:for-each select="/metadata/idinfo/citation/citeinfo/geoform[normalize-space(.) != '']">
		<xsl:variable name="dc_type" select="normalize-space(.)"/>
		<meta name="dc.type" content='data.{$dc_type}'/>
	</xsl:for-each>
	<!-- Format-->
	<xsl:for-each select="/metadata/idinfo/natvform[normalize-space(.) != '']">
		<xsl:variable name="dc_format" select="normalize-space(.)"/>
		<meta name="dc.format" content='{$dc_format}'/>
	</xsl:for-each>
	<!-- Identifier -->
	<xsl:for-each select="/metadata/idinfo/citation/citeinfo/onlink[normalize-space(.) != '']">
		<xsl:variable name="dc_identifier" select="normalize-space(.)"/>
		<meta name="dc.identifier" content='{$dc_identifier}'/>
	</xsl:for-each>
	<!-- Source -->
	<xsl:for-each select="/metadata/distinfo/resdesc[normalize-space(.) != '']">
		<xsl:variable name="dc_source" select="normalize-space(.)"/>
		<meta name="dc.source" content='{$dc_source}'/>
	</xsl:for-each>
	<!-- Language -->
	<xsl:for-each select="/metadata/idinfo/descript/langdata[normalize-space(.) != '']">
		<xsl:variable name="dc_lang" select="normalize-space(.)"/>
		<meta name="dc.lang" content='{$dc_lang}'/>
	</xsl:for-each>
	<!-- Coverage - geographic coordinates -->
	<xsl:for-each select="/metadata/idinfo/spdom/bounding[normalize-space(.) != '']">
		<xsl:variable name="dc_coverage_x_min" select="westbc[normalize-space(.) != '']"/>
		<meta name="dc.coverage.x.min" scheme="DD" content='{$dc_coverage_x_min}'/>
		<xsl:variable name="dc_coverage_x_max" select="eastbc[normalize-space(.) != '']"/>
		<meta name="dc.coverage.x.max" scheme="DD" content='{$dc_coverage_x_max}'/>
		<xsl:variable name="dc_coverage_y_min" select="southbc[normalize-space(.) != '']"/>
		<meta name="dc.coverage.y.min" scheme="DD" content='{$dc_coverage_y_min}'/>
		<xsl:variable name="dc_coverage_y_max" select="northbc[normalize-space(.) != '']"/>
		<meta name="dc.coverage.y.max" scheme="DD" content='{$dc_coverage_y_max}'/>
	</xsl:for-each>
	<!-- Coverage - place name -->
	<xsl:for-each select="/metadata/idinfo/keywords/place/placekey[normalize-space(.) != '']">
		<xsl:variable name="dc_coverage_placeName" select="normalize-space(.)"/>				
		<meta name="dc.coverage.placeName" content='{$dc_coverage_placeName}'/>
	</xsl:for-each>
	<!-- Coverage - time range -->
	<xsl:choose>
		<xsl:when test="/metadata/idinfo/timeperd/timeinfo/rngdates[normalize-space(.) != '']">
			<xsl:variable name="dc_coverage_t_min" select="/metadata/idinfo/timeperd/timeinfo/rngdates/begdate[normalize-space(.) != '']"/>				
			<meta name="dc.coverage.t.min" content='{$dc_coverage_t_min}'/>
			<xsl:variable name="dc_coverage_t_max" select="/metadata/idinfo/timeperd/timeinfo/rngdates/enddate[normalize-space(.) != '']"/>				
			<meta name="dc.coverage.t.max" content='{$dc_coverage_t_max}'/>
		</xsl:when>
	</xsl:choose>
	<!-- Rights -->
	<xsl:choose>
		<xsl:when test="/metadata/idinfo[accconst[normalize-space(.) != ''] or useconst[normalize-space(.) != '']]">
			<xsl:variable name="dc_rights">
				<xsl:for-each select="/metadata/idinfo/accconst[normalize-space(.) != '']">
					<xsl:text>Access constraints: </xsl:text><xsl:value-of select="normalize-space(.)"/><xsl:text>; </xsl:text>
				</xsl:for-each>
				<xsl:for-each select="/metadata/idinfo/useconst[normalize-space(.) != '']">
					<xsl:text> Use constraints: </xsl:text><xsl:value-of select="normalize-space(.)"/>
				</xsl:for-each>
			</xsl:variable>
			<meta name="dc.rights" content='{$dc_rights}'/>
		</xsl:when>
	</xsl:choose>
</xsl:template>

<!-- Contact Information -->
<xsl:template match="cntinfo[(cntperp/* != '') or (cntorgp/* != '') or (cntaddr/address != '') or 
      (cntaddr/city != '') or (cntaddr/state != '') or (cntaddr/postal != '') or 
      (cntaddr/country != '') or (cntvoice != '') or (cntfax != '') or (cntemail != '') or 
      (hours != '') or (cntinst != '')]"> 
    <div style="margin-left:20">
      <xsl:for-each select="*/cntper[. != '']"><div><xsl:value-of select="."/></div></xsl:for-each>
      <xsl:for-each select="*/cntorg[. != '']"><div><xsl:value-of select="."/></div></xsl:for-each>
      <xsl:for-each select="cntpos[. != '']"><div><xsl:value-of select="."/></div></xsl:for-each>
      <xsl:for-each select="cntaddr">
        <xsl:for-each select="address[. != '']">
          <div><pre id="fixvalue"><xsl:value-of select="."/></pre></div>      
        </xsl:for-each>
        <xsl:if test="((city != '') or (state != '') or (postal != ''))">
          <div>
            <xsl:for-each select="city[. != '']">
                <xsl:value-of select="."/></xsl:for-each><xsl:if test="(city != '') and (state != '')">, </xsl:if><xsl:for-each select="state[. != '']">
                <xsl:value-of select="."/></xsl:for-each><xsl:if test="((city != '') or (state != '')) and (postal != '')" xml:space="preserve"> </xsl:if>
                <xsl:for-each select="postal[. != '']"><xsl:value-of select="."/></xsl:for-each>
          </div>
        </xsl:if>        
        <xsl:for-each select="country[. != '']"><div><xsl:value-of select="."/></div></xsl:for-each>
        <xsl:if test="position() != last()">
          <br/>
        </xsl:if>
      </xsl:for-each>
      <xsl:if test="((cntaddr/address != '') or (cntaddr/city != '') or 
          (cntaddr/state != '') or (cntaddr/postal != '') or (cntaddr/country != '')) 
          and ((cntvoice != '') or (cntfax != '') or (cntemail != '') or 
          (hours != '') or (cntinst != ''))">
        <br/>
      </xsl:if>
      <xsl:for-each select="cntvoice[. != '']"><div><xsl:value-of select="."/> (voice)</div></xsl:for-each>
      <xsl:for-each select="cntfax[. != '']"><div><xsl:value-of select="."/> (FAX)</div></xsl:for-each>
      <xsl:for-each select="cntemail[. != '']"><div><xsl:value-of select="."/></div></xsl:for-each>
      <xsl:for-each select="hours[. != '']"><div><i>Hours of Service: </i><xsl:value-of select="."/></div></xsl:for-each>
      <xsl:for-each select="cntinst[. != '']">
        <div><i>Contact Instructions: </i></div>
        <div style="margin-left:40">
          <pre id="fixvalue"><xsl:value-of select="."/></pre>
        </div>
      </xsl:for-each>
    </div>
</xsl:template>


<!-- Citation Information -->
<xsl:template match="citeinfo[(origin != '') or (pubdate != '') or (title != '') or (serinfo/* != '') or (pubinfo/*)]"> 
    <div style="margin-left:20; margin-right:40">
      <xsl:for-each select="origin[. != '']"><xsl:value-of select="."/>, </xsl:for-each>
      <xsl:for-each select="pubdate[. != '']"><xsl:value-of select="."/>, </xsl:for-each>
      <xsl:for-each select="title[. != '']"><xsl:value-of select="."/></xsl:for-each>
      <xsl:if test="((origin != '') or (pubdate != '') or (title != '')) and ((serinfo/* != '') or (pubinfo/* != ''))">: </xsl:if>
      <xsl:for-each select="serinfo/sername[. != '']"><xsl:value-of select="."/> </xsl:for-each>
      <xsl:for-each select="serinfo/issue[. != '']"> <xsl:value-of select="."/></xsl:for-each>
      <xsl:if test="(serinfo/* != '') and (pubinfo/* != '')">, </xsl:if>
      <xsl:for-each select="pubinfo/publish[. != '']"><xsl:value-of select="."/>, </xsl:for-each>
      <xsl:for-each select="pubinfo/pubplace[. != '']"><xsl:value-of select="."/></xsl:for-each>.
    </div>
    <br/>
  <xsl:if test="onlink[. != '']"> 
    <div style="margin-left:20">
      <i>Online links: </i>
      <ul>
        <xsl:for-each select="onlink[. != '']">
          <li TYPE="disc"><a target="viewer"><xsl:attribute name="href"><xsl:value-of select="."/></xsl:attribute><xsl:value-of select="."/></a></li>
        </xsl:for-each>
      </ul>
      <br/>
    </div>
  </xsl:if>
  <xsl:for-each select="othercit[. != '']">
    <div style="margin-left:20">
      <i>Other citation details: </i>
      <div style="margin-left:40"><xsl:value-of select="."/></div>
      <br/>
    </div>
  </xsl:for-each>
  <xsl:for-each select="lworkcit[.//* != '']">
    <div style="margin-left:20">
      <div>This is part of the following larger work:</div>
      <br/>
      <div style="margin-left:40"><xsl:apply-templates select="citeinfo"/></div>
    </div>
  </xsl:for-each>
</xsl:template>


<!-- Time Period Information -->
<xsl:template match="timeinfo">
  <xsl:for-each select=".//caldate[. != '']">
    <div style="margin-left:20"><i>Calendar date: </i><xsl:value-of select="."/></div>
  </xsl:for-each>
  <xsl:for-each select="rngdates">
    <div style="margin-left:20">
      <xsl:for-each select="begdate[. != '']"><div><i>Beginning date: </i><xsl:value-of select="."/></div></xsl:for-each>
      <xsl:for-each select="begtime[. != '']"><div><i>Beginning time: </i><xsl:value-of select="."/></div></xsl:for-each>
      <xsl:for-each select="enddate[. != '']"><div><i>Ending date: </i><xsl:value-of select="."/></div></xsl:for-each>
      <xsl:for-each select="endtime[. != '']"><div><i>Ending time: </i><xsl:value-of select="."/></div></xsl:for-each>
    </div>
  </xsl:for-each>
</xsl:template>


<!-- Grid Projection Systems -->
<xsl:template match="utm">
  <div>
    <xsl:for-each select="utmzone">
      <div><i>UTM zone number: </i><xsl:value-of select="."/></div>
    </xsl:for-each>
    <xsl:for-each select="transmer">
      <div>Transverse Mercator projection parameters:</div>
    </xsl:for-each>
    <xsl:apply-templates select="transmer"/>
  </div>
</xsl:template>

<xsl:template match="ups">
  <div>
    <xsl:for-each select="upszone">
      <div><i>UPS zone identifier: </i><xsl:value-of select="."/></div>
    </xsl:for-each>
    <xsl:for-each select="polarst">
      <div>Polar stereographic projection parameters:</div>
    </xsl:for-each>
    <xsl:apply-templates select="polarst"/>
  </div>
</xsl:template>

<xsl:template match="spcs">
  <div>
    <xsl:for-each select="spcszone">
      <div><i>SPCS zone identifier: </i><xsl:value-of select="."/></div>
    </xsl:for-each>
    <xsl:for-each select="lambertc">
      <div>Lambert conformal conic projection parameters:</div>
    </xsl:for-each>
    <xsl:apply-templates select="lambertc"/>
    <xsl:for-each select="transmer">
      <div>Transverse mercator projection parameters:</div>
    </xsl:for-each>
    <xsl:apply-templates select="transmer"/>
    <xsl:for-each select="obqmerc">
      <div>Oblique mercator projection parameters:</div>
    </xsl:for-each>
    <xsl:apply-templates select="obqmerc"/>
    <xsl:for-each select="polycon">
      <div>Polyconic projection parameters:</div>
    </xsl:for-each>
    <xsl:apply-templates select="polycon"/>
  </div>
</xsl:template>

<xsl:template match="arcsys">
  <div>
    <xsl:for-each select="arczone">
      <div><i>ARC system zone identifier: </i><xsl:value-of select="."/></div>
    </xsl:for-each>
    <xsl:for-each select="equirect">
      <div>Equirectangular projection parameters:</div>
    </xsl:for-each>
    <xsl:apply-templates select="equirect"/>
    <xsl:for-each select="azimequi">
      <div>Azimuthal equidistant projection parameters:</div>
    </xsl:for-each>
    <xsl:apply-templates select="azimequi"/>
  </div>
</xsl:template>

<xsl:template match="othergrd">
  <div><i>Other grid system's definition: </i></div>
  <div style="margin-left:40"><xsl:value-of select="."/></div>
</xsl:template>


<!-- Map Projections -->
<xsl:template match="albers | equicon | lambertc">
  <div style="margin-left:40">
    <xsl:apply-templates select="stdparll"/>
    <xsl:apply-templates select="longcm"/>
    <xsl:apply-templates select="latprjo"/>
    <xsl:apply-templates select="feast"/>
    <xsl:apply-templates select="fnorth"/>
  </div>
</xsl:template>

<xsl:template match="gnomonic | lamberta | orthogr | stereo | gvnsp">
  <div style="margin-left:40">
    <xsl:for-each select="../gvnsp">
      <xsl:apply-templates select="heightpt"/>
    </xsl:for-each>
    <xsl:apply-templates select="longpc"/>
    <xsl:apply-templates select="latprjc"/>
    <xsl:apply-templates select="feast"/>
    <xsl:apply-templates select="fnorth"/>
  </div>
</xsl:template>

<xsl:template match="azimequi | polycon | transmer">
  <div style="margin-left:40">
    <xsl:for-each select="../transmer">
      <xsl:apply-templates select="sfctrmer"/>
    </xsl:for-each>
    <xsl:apply-templates select="longcm"/>
    <xsl:apply-templates select="latprjo"/>
    <xsl:apply-templates select="feast"/>
    <xsl:apply-templates select="fnorth"/>
  </div>
</xsl:template>

<xsl:template match="miller | sinusoid | vdgrin">
  <div style="margin-left:40">
    <xsl:apply-templates select="longcm"/>
    <xsl:apply-templates select="feast"/>
    <xsl:apply-templates select="fnorth"/>
  </div>
</xsl:template>

<xsl:template match="equirect">
  <div style="margin-left:40">
    <xsl:apply-templates select="stdparll"/>
    <xsl:apply-templates select="longcm"/>
    <xsl:apply-templates select="feast"/>
    <xsl:apply-templates select="fnorth"/>
  </div>
</xsl:template>

<xsl:template match="mercator">
  <div style="margin-left:40">
    <xsl:apply-templates select="stdparll"/>
    <xsl:apply-templates select="sfequat"/>
    <xsl:apply-templates select="longcm"/>
    <xsl:apply-templates select="feast"/>
    <xsl:apply-templates select="fnorth"/>
  </div>
</xsl:template>

<xsl:template match="polarst">
  <div style="margin-left:40">
    <xsl:apply-templates select="svlong"/>
    <xsl:apply-templates select="stdparll"/>
    <xsl:apply-templates select="sfprjorg"/>
    <xsl:apply-templates select="feast"/>
    <xsl:apply-templates select="fnorth"/>
  </div>
</xsl:template>

<xsl:template match="obqmerc">
  <div style="margin-left:40">
    <xsl:apply-templates select="sfctrlin"/>
    <xsl:apply-templates select="obqlazim"/>
    <xsl:apply-templates select="obqlpt"/>
    <xsl:apply-templates select="latprjo"/>
    <xsl:apply-templates select="feast"/>
    <xsl:apply-templates select="fnorth"/>
  </div>
</xsl:template>

<xsl:template match="modsak">
  <div style="margin-left:40">
    <xsl:apply-templates select="feast"/>
    <xsl:apply-templates select="fnorth"/>
  </div>
</xsl:template>

<xsl:template match="robinson">
  <div style="margin-left:40">
    <xsl:apply-templates select="longpc"/>
    <xsl:apply-templates select="feast"/>
    <xsl:apply-templates select="fnorth"/>
  </div>
</xsl:template>

<xsl:template match="spaceobq">
  <div style="margin-left:40">
    <xsl:apply-templates select="landsat"/>
    <xsl:apply-templates select="pathnum"/>
    <xsl:apply-templates select="feast"/>
    <xsl:apply-templates select="fnorth"/>
  </div>
</xsl:template>


<!-- Projection Parameters -->
<xsl:template match="stdparll">
  <div><i>Standard parallel: </i><xsl:value-of select="."/></div>
</xsl:template>

<xsl:template match="longcm">
  <div><i>Longitude of central meridian: </i><xsl:value-of select="."/></div>
</xsl:template>

<xsl:template match="latprjo">
  <div><i>Latitude of projection origin: </i><xsl:value-of select="."/></div>
</xsl:template>

<xsl:template match="feast">
  <div><i>False easting: </i><xsl:value-of select="."/></div>
</xsl:template>

<xsl:template match="fnorth">
  <div><i>False northing: </i><xsl:value-of select="."/></div>
</xsl:template>

<xsl:template match="sfequat">
  <div><i>Scale factor at equator: </i><xsl:value-of select="."/></div>
</xsl:template>

<xsl:template match="heightpt">
  <div><i>Height of perspective point above surface: </i><xsl:value-of select="."/></div>
</xsl:template>

<xsl:template match="longpc">
  <div><i>Longitude of projection center: </i><xsl:value-of select="."/></div>
</xsl:template>

<xsl:template match="latprjc">
  <div><i>Latitude of projection center: </i><xsl:value-of select="."/></div>
</xsl:template>

<xsl:template match="sfctrlin">
  <div><i>Scale factor at center line: </i><xsl:value-of select="."/></div>
</xsl:template>

<xsl:template match="obqlazim">
  <div><i>Oblique line azimuth: </i><xsl:value-of select="."/></div>
  <xsl:for-each select="azimangl">
    <div style="margin-left:20"><i>Azimuthal angle: </i><xsl:value-of select="."/></div>
  </xsl:for-each>
  <xsl:for-each select="azimptl">
    <div style="margin-left:20"><i>Azimuthal measure point longitude: </i><xsl:value-of select="."/></div>
  </xsl:for-each>
</xsl:template>

<xsl:template match="obqlpt">
  <div><i>Oblique line point: </i><xsl:value-of select="."/></div>
  <xsl:for-each select="obqllat">
    <div style="margin-left:20"><i>Oblique line latitude: </i><xsl:value-of select="."/></div>
  </xsl:for-each>
  <xsl:for-each select="obqllong">
    <div style="margin-left:20"><i>Oblique line longitude: </i><xsl:value-of select="."/></div>
  </xsl:for-each>
</xsl:template>

<xsl:template match="svlong">
  <div><i>Straight vertical longitude from pole: </i><xsl:value-of select="."/></div>
</xsl:template>

<xsl:template match="sfprjorg">
  <div><i>Scale factor at projection origin: </i><xsl:value-of select="."/></div>
</xsl:template>

<xsl:template match="landsat">
  <div><i>Landsat number: </i><xsl:value-of select="."/></div>
</xsl:template>

<xsl:template match="pathnum">
  <div><i>Path number: </i><xsl:value-of select="."/></div>
</xsl:template>

<xsl:template match="sfctrmer">
  <div><i>Scale factor at central meridian: </i><xsl:value-of select="."/></div>
</xsl:template>

<xsl:template match="otherprj">
  <div><i>Other projection's definition: </i></div>
  <div style="margin-left:40"><xsl:value-of select="."/></div>
</xsl:template>


</xsl:stylesheet>
