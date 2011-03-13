/* ------------------------------------------------------------------------
	INK - Own your content plugin.
	Version: 1.0.2
	Description: INK add credits back to your site everytime a user copy/paste content.
	Website: http://www.no-margin-for-errors.com/projects/ink-own-your-content/
------------------------------------------------------------------------- */

var ink = function(){
	var url_to_share, enabled, hide_timeout, ads_enabled;
	
	var settings = {
		copied_content_layout: '"{copied_content}"\n\rRead more about {title} on:\r\n{page_url}',
		notice_content: ' \
		<a href="#" onclick="ink.hide_notice(); return false;" style="color: #fff;position: absolute; right: 10px; top: 5px; font-size: 10px;">Close</a> \
		<p style="color: #fff; margin: 0;"> \
			<a href="http://www.no-margin-for-errors.com/projects/ink-own-your-content/?utm_source=INK&utm_medium=notice" target="_blank" style="color: #fff;">INK</a> has been applied to the content you\'ve just copied<br /> \
			<a href="http://www.no-margin-for-errors.com/projects/ink-own-your-content/?utm_source=INK&utm_medium=notice" target="_blank" style="color: #fff;">What is INK?</a> | <a href="http://ink.nmfe.co/set-status.php?status=off&utm_source=INK&utm_medium=notice" target="_blank" style="color: #fff;">Disable INK</a> \
		</p>',
		google_analytics : {
			utm_source:'INK',
			utm_medium:'copy',
			utm_campaign:'share'
		},
		onBeforeCopy: function(){
			
		},
		onAfterCopy: function(){
			
		},
		urlshortener : {
			/*
				To get started you'll need a free bit.ly user account and API key - sign up at:
			    http://bit.ly/account/register?rd=/ 
				Quickly access your private API key once you are signed in at:
			    http://bit.ly/account/your_api_key
			*/
			bitly : {
				'active' : false
			}
		},
		dom_nodes_excluded: ['img','object','video','pre'], // These are the nodeTypes that you don't want to be in inked when copied.
		class_excluded: ['no-ink']
	};
	
	function init(custom_settings){
		// Extend the settings.
		for(var key in custom_settings){
			settings[key] = custom_settings[key];
		};
		
		// Create the what will contain the edited content to be copied
		copy_holder = document.createElement('textarea');
		copy_holder.setAttribute('id','copy_holder');
		copy_holder.style.width = '400px';
		copy_holder.style.height = '200px';
		copy_holder.style.position = 'absolute';
		copy_holder.style.left = '-100000px';
		document.body.appendChild(copy_holder);
		
		// Bind the copy events.
		document.body.oncopy = function(){
			settings.onBeforeCopy();
			copy();
			settings.onAfterCopy();
		};
		
		// Build the url to share
		url_to_share = location.href;
		if(settings.google_analytics){
			(url_to_share.indexOf('?') == -1) ? url_to_share+="?" : url_to_share+="&";
			
			for(var key in settings.google_analytics)
				url_to_share += key + '=' + settings.google_analytics[key] + '&';
		};
		
		if (settings.urlshortener.bitly.active) {
			if (window.BitlyCB) {
				BitlyCB.myShortenCallback = function(data) {
					var result;
					for (var r in data.results) {
						result = data.results[r];
						result['longUrl'] = r;
						break;
					};
					url_to_share = result.shortUrl; // update the url variable
				};

				BitlyClient.shorten(url_to_share, 'BitlyCB.myShortenCallback'); // Overwrite the link with the shortened one
			}else{
				alert('INK: There has been an error generating your bit.ly link. Make sure you\'ve included the bit.ly javascript API on your page.')
			};
		};
		
		if(typeof ink_license == 'undefined') ink_license = false;
		
		// Call home to make sure users allow INK to run
		request = 'http://ink.nmfe.co/read-status.php?callback=ink.status&license='+ink_license;
		aObj = new JSONscriptRequest(request);
		aObj.buildScriptTag();
		aObj.addScriptTag();
		
		// Make sure indexOf exists
		if(!Array.indexOf){
			Array.prototype.indexOf = function(obj){
				for(var i=0; i<this.length; i++){
					if(this[i]==obj){
						return i;
					};
				};
				return -1;
			};
		};
	};
	
	function copy(){
		// Cache the current selected text and the range
		var cached_selected_content = _getSelectedContent(),
			children_nodes,
			parent_node;
		
		if (document.selection) {
			scroll_cache = _get_scroll();
			
			// Create a fragment, I need to do this because what htmlText is a string and I need to be able to parse the node tree
			var frag = document.createElement('div');
			frag.style.display = 'none';
			frag.setAttribute('id','ink_frag');
			frag.innerHTML = cached_selected_content.range.htmlText;
			document.body.appendChild(frag); // Append to retrieve the node tree
			children_nodes = document.getElementById('ink_frag'); // Cache the element
			document.getElementById('ink_frag').removeNode(true); // Don't need it anymore
			parent_node = cached_selected_content.range.parentElement();
		}else{
			children_nodes = cached_selected_content.range.cloneContents();
			parent_node = cached_selected_content.selection.anchorNode.parentNode;
		}

		if(!_validate_content(children_nodes,parent_node,'down') || !enabled) return;
		
		if(settings.google_analytics)
			_track_google_analytic_event(cached_selected_content.selection);
		
		// Copy the user's selected content to the holder and select it to have it copied
		content_to_share = settings.copied_content_layout;
		content_to_share = content_to_share.replace(/{copied_content}/g,cached_selected_content.selection)
											.replace(/{title}/g,document.title)
											.replace(/{page_url}/g,url_to_share);
						
		document.getElementById('copy_holder').value = content_to_share;
		document.getElementById('copy_holder').select();

		// Re-select the content the user selected to maintain a good ux.
		setTimeout(function(){
			if(document.selection){ // IE
				cached_selected_content.range.select();
				document.documentElement.scrollTop = scroll_cache;
			}else{ // The others
				var currSelection = window.getSelection();
				currSelection.removeAllRanges();
				currSelection.addRange(cached_selected_content.range)
			}
			
			_display_notice();
		},1);
	};
	
	function _display_notice(){
		if(typeof notice == 'undefined') {
			notice = document.createElement('div');
			notice.innerHTML = settings.notice_content
			
			if(ads_enabled)
				 notice.innerHTML += '<div id="bsap_1258551" class="bsarocks bsap_d49a0984d0f377271ccbf01a33f2b6d6" style="color: #fff; width: 340px; margin-top: 10px;"></div>';
			
			notice.setAttribute('style','background: rgba(0,0,0,0.7); position: absolute; border-radius: 10px; -moz-border-radius: 10px; -webkit-border-radius: 10px; -moz-box-shadow: 0px 0px 10px rgba(0,0,0,0.8); -webkit-box-shadow: 0px 0px 10px rgba(0,0,0,0.8); box-shadow: 0px 0px 10px rgba(0,0,0,0.8);')
			if(document.selection)
				notice.style.backgroundColor = '#000';
			notice.style.fontSize = "12px";
			notice.style.paddingTop = "20px";
			notice.style.paddingRight = "10px";
			notice.style.paddingBottom = "15px";
			notice.style.paddingLeft = "10px";
			notice.style.position = "absolute";
			notice.style.textAlign = 'left';
			notice.style.top = (_get_scroll() + 25) + 'px';
			notice.style.right = '25px';
			notice.style.zIndex = 10000;
			notice.setAttribute('id','ink_notice');
			document.body.appendChild(notice);
			
			if(ads_enabled)
				_bsap.exec();
			
		
			hide_timeout = window.setTimeout(function(){
				hide_notice();
			},1000 * 10);
		}else{
			notice.style.top = (_get_scroll() + 25) + 'px';
		}
	}
	
	function hide_notice(){
		clearTimeout(hide_timeout);
		document.body.removeChild(notice);
		delete notice;
	}
	
	function _validate_content(children_nodes,parent_node,direction){
		var node_class, node_name;

		if(direction == 'down'){
			for (var i=0; i < children_nodes.childNodes.length; i++) {
				node_class = children_nodes.childNodes[i].className;
				node_name = children_nodes.childNodes[i].nodeName;
				node_name = node_name.toLowerCase();

				// Recursivelly loop through all the children
				if(children_nodes.childNodes[i].childNodes.length > 1 && children_nodes.childNodes[i].nodeType != 3){ return _validate_content(children_nodes.childNodes[i],null,'down') }

				if(settings.dom_nodes_excluded.indexOf(node_name) > -1 || settings.class_excluded.indexOf(node_class) > -1)
					return false;
			};
		};

		if(parent_node) {
			node_class = parent_node.className;
			node_name = parent_node.nodeName;
			node_name = node_name.toLowerCase();

			if(settings.dom_nodes_excluded.indexOf(node_name) > -1 || settings.class_excluded.indexOf(node_class) > -1)
				return false;
			
			// Recursivelly loop through all the children
			return _validate_content(parent_node.parentNode);
		};
		
		return true;
	}
	
	function _getSelectedContent() {
		if (window.getSelection){
			return {
				selection: window.getSelection(),
				range: window.getSelection().getRangeAt(0)
			}
		} else if (document.getSelection) {
			return {
				selection: document.getSelection(),
				range: document.getSelection().getRangeAt(0)
			}
		} else if (document.selection) {
			return {
				selection: document.selection.createRange().text,
				range: document.selection.createRange()
			}
		} else {
			return false;
		}
	}
	
	// If Google Analytics is installed, INK will automatically track content.
	function _track_google_analytic_event(shared_content){
		if(typeof _gaq != 'undefined'){ // Make sure GA is installed
			_gaq.push(['_trackEvent', 'INK', 'Copy', shared_content]);
		}
	}
	
	// Callback function on the INK status check.
	function status(jsonData) {
		enabled = (jsonData.status == 'on' || jsonData.status == null) ? true : false;
		ads_enabled = (jsonData.ads_status == true || jsonData.ads_status == null) ? true : false;
		
		// Inject BSA if it's not installed and if INK is unlicensed
		if(typeof _bsap == 'undefined' && ads_enabled){
			(function(){
				var bsa = document.createElement('script');
					bsa.type = 'text/javascript';
					bsa.async = true;
					bsa.src = '//s3.buysellads.com/ac/bsa.js';
					(document.getElementsByTagName('head')[0]||document.getElementsByTagName('body')[0]).appendChild(bsa);
			})();
		}
		
		if(ads_enabled){ // Inject BSA styling
			var cssStr = "#bsap_1258551 em.bd,#bsap_1258551 em.bt { color: #ccc !important; font-size: 11px; } #bsap_1258551 a,#bsap_1258551 a:hover { background: none !important; } #bsap_1258551 a:hover .bwr { background: #666 !important; } #bsap_1258551 ul.bsa_ads li,#bsap_1258551 div.bsa_idb, #bsap_1258551 div.bsa_idb .bsa_idl, #bsap_1258551 div.bsa_idb a { background: none !important; width: 325px;  margin-top: 5px; display: block; }";
			var style = document.createElement("style");
			style.setAttribute("type", "text/css");
			if(style.styleSheet){ // IE
				style.styleSheet.cssText = cssStr;
			} else { // w3c
				var cssText = document.createTextNode(cssStr);
				style.appendChild(cssText);
			}
			(document.getElementsByTagName('head')[0]||document.getElementsByTagName('body')[0]).appendChild(style)
		}
	}
	
	function JSONscriptRequest(fullUrl) {
	    // REST request path
	    this.fullUrl = fullUrl; 
	    // Keep IE from caching requests
	    this.noCacheIE = '&noCacheIE=' + (new Date()).getTime();
	    // Get the DOM location to put the script tag
	    this.headLoc = document.getElementsByTagName("head").item(0);
	    // Generate a unique script tag id
	    this.scriptId = 'JscriptId' + JSONscriptRequest.scriptCounter++;
	}

	// Static script ID counter
	JSONscriptRequest.scriptCounter = 1;

	// buildScriptTag method
	//
	JSONscriptRequest.prototype.buildScriptTag = function () {

	    // Create the script tag
	    this.scriptObj = document.createElement("script");

	    // Add script object attributes
	    this.scriptObj.setAttribute("type", "text/javascript");
	    this.scriptObj.setAttribute("charset", "utf-8");
	    this.scriptObj.setAttribute("src", this.fullUrl + this.noCacheIE);
	    this.scriptObj.setAttribute("id", this.scriptId);
	}

	// removeScriptTag method
	// 
	JSONscriptRequest.prototype.removeScriptTag = function () {
	    // Destroy the script tag
	    this.headLoc.removeChild(this.scriptObj);  
	}

	// addScriptTag method
	//
	JSONscriptRequest.prototype.addScriptTag = function () {
	    // Create the script tag
	    this.headLoc.appendChild(this.scriptObj);
	}
	
	function _get_scroll(){
		if (self.pageYOffset) {
			return self.pageYOffset;
		} else if (document.documentElement && document.documentElement.scrollTop) { // Explorer 6 Strict
			return document.documentElement.scrollTop;
		} else if (document.body) {// all other Explorers
			return document.body.scrollTop;
		};
	};
	
	init(); // BOOM
	
	return {
		init : init,
		status: status,
		hide_notice: hide_notice,
		copy : copy
	}
}();