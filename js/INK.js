/* ------------------------------------------------------------------------
	INK - Own your content plugin.
	Version: 1.2.3
	Description: INK add credits back to your site everytime a user copy/paste content.
	Website: http://www.no-margin-for-errors.com/projects/ink-own-your-content/
	Copyright: Stephane Caron 2011 - All rights reserved
------------------------------------------------------------------------- */

var ink = function(){
	var url_to_share, enabled=true, hide_timeout, ads_enabled=true, children_nodes, parent_node, content_type, content_html;
	
	var settings = {
		copied_content_text_layout: '“{copied_content}”<br /><br />Read more about {title} on:<br />{page_url}',
		copied_content_media_layout: '{copied_content}<p>Found on: <a href="{page_url}">{title}</a></p>',
		notice_content_markup: ' \
		<a href="http://www.no-margin-for-errors.com/projects/ink-own-your-content/?utm_source=INK&utm_medium=notice" target="_blank" style="float: left; margin: 0 5px 5px 0;"><img src="http://ink.nmfe.co/images/ink_small_logo.gif" /></a> \
		<a href="#" onclick="ink.hide_notice(); return false;" style="color: #999;position: absolute; right: 10px; top: 5px; font-size: 10px;">Close</a> \
		<p style="color: #999; margin: 0 0 10px 0; font-size: 12px;"> \
			<a href="http://www.no-margin-for-errors.com/projects/ink-own-your-content/?utm_source=INK&utm_medium=notice" target="_blank" style="color: #999;">INK</a> has been applied to the content you copied.<br /> \
			<a href="http://www.no-margin-for-errors.com/projects/ink-own-your-content/?utm_source=INK&utm_medium=notice" target="_blank" style="color: #999; font-size: 10px;">What is INK?</a> | <a href="http://ink.nmfe.co/set-status.php?status=off&utm_source=INK&utm_medium=notice" target="_blank" style="color: #999; font-size: 10px;">Disable INK</a> \
		</p>',
		notice_content_media: ' \
		<a href="http://www.no-margin-for-errors.com/projects/ink-own-your-content/?utm_source=INK&utm_medium=notice" target="_blank" style="float: left; margin: 0 5px 5px 0;"><img src="http://ink.nmfe.co/images/ink_small_logo.gif" /></a> \
		<a href="#" onclick="ink.hide_notice(); return false;" style="color: #999;position: absolute; right: 10px; top: 5px; font-size: 10px;">Close</a> \
		<p style="color: #999; margin: 0 0 10px 0; font-size: 12px;"> \
			<a href="http://www.no-margin-for-errors.com/projects/ink-own-your-content/?utm_source=INK&utm_medium=notice" target="_blank" style="color: #999;">INK</a> has detected that you copied a {content_type}.<br /> \
			<a href="http://www.no-margin-for-errors.com/projects/ink-own-your-content/?utm_source=INK&utm_medium=notice" target="_blank" style="color: #999; font-size: 10px;">What is INK?</a> | <a href="http://ink.nmfe.co/set-status.php?status=off&utm_source=INK&utm_medium=notice" target="_blank" style="color: #999; font-size: 10px;">Disable INK</a> \
			<br style="clear:left;" />Please give credit to the content owner by using the following HTML for your blog or site.<br /><textarea style="width:330px;height:70px;margin-top:5px;font-size:10px;font-family:arial" onclick="this.select();">{currated_content}</textarea> \
		</p>',
		share_your_copy_label: 'Share your copy:',
		styling: {
			border_radius: 10
		},
		google_analytics : { // Custom Google Analytics tracking code. Feel free to change this to suit your needs.
			utm_source:'INK',
			utm_medium:'copy',
			utm_campaign:'share'
		},
		sharing : true, // Set to false if you don't want the users to be able to share
		twitter : { // If a user shares content from INK, this is the username that should be credited for the tweet (... via @username)
			username : false
		},
		onBeforeCopy: function(){},
		onAfterCopy: function(){},
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
		dom_nodes_excluded: ['img','object','embed','video','pre','iframe','textarea'], // These are the nodeTypes that you don't want to be in inked when copied.
		class_excluded: ['no-ink']
	};
	
	function init(custom_settings){
		// Extend the settings.
		for(var key in custom_settings){
			settings[key] = custom_settings[key];
		};
		
		// Create the what will contain the edited content to be copied
		copy_holder = document.createElement('div');
		copy_holder.setAttribute('id','copy_holder');
		copy_holder.style.position = 'fixed';
		copy_holder.style.left = '-5000px';
		copy_holder.style.top = '0';
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
			
			for(var key in settings.google_analytics) url_to_share += key + '=' + settings.google_analytics[key] + '&';
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
		aObj = new JSONscriptRequest(request,true);
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
		var cached_selected_content = _getSelectedContent();
			
		content_type = 'text';
		if(window.getSelection){
			children_nodes = cached_selected_content.range.cloneContents();
			parent_node = cached_selected_content.selection.anchorNode.parentNode;
		}else if (document.selection) { // IE
			// Create a fragment, I need to do this because what htmlText is a string and I need to be able to parse the node tree
			var frag = document.createElement('div');
			frag.style.display = 'none';
			frag.setAttribute('id','ink_frag');
			frag.innerHTML = cached_selected_content.range.htmlText;
			document.body.appendChild(frag); // Append to retrieve the node tree
			children_nodes = document.getElementById('ink_frag'); // Cache the element
			document.getElementById('ink_frag').removeNode(true); // Don't need it anymore
			parent_node = cached_selected_content.range.parentElement();
		};

		if(settings.google_analytics)
			_track_google_analytic_event(cached_selected_content.selection);
		if(!enabled){
			return;
		}else if(!_validate_content(children_nodes,parent_node,'down')){
			if(content_type == 'picture' || content_type == 'video')
				_display_notice(cached_selected_content.selection);
			return;
		}else{	
			// Copy the user's selected content to the holder and select it to have it copied
			content_to_share = settings.copied_content_text_layout;
			content_to_share = content_to_share.replace(/{copied_content}/g,cached_selected_content.selection)
												.replace(/{title}/g,document.title)
												.replace(/{page_url}/g,url_to_share);
						
			document.getElementById('copy_holder').innerHTML = content_to_share;
			
			if(document.selection){
				var range = document.body.createTextRange();
		        range.moveToElementText(copy_holder);
		        range.select();
			}else{
				var selection = window.getSelection();
		        var range = document.createRange();
		        range.selectNodeContents(copy_holder);
		        selection.removeAllRanges();
		        selection.addRange(range);
			};

			// Re-select the content the user selected to maintain a good ux.
			setTimeout(function(){
				if(window.getSelection){
					var currSelection = window.getSelection();
					currSelection.removeAllRanges();
					currSelection.addRange(cached_selected_content.range);
				}else if(document.selection){ // IE
					cached_selected_content.range.select();
				};
			
				_display_notice(cached_selected_content.selection);
			},1);
		};
	};
	
	function _display_notice(selected_content){
		if(typeof notice != 'undefined') hide_notice();
			
		notice = document.createElement('div');
		notice.className = "no-ink";
		
		if(content_type == 'text'){
			notice.innerHTML =  settings.notice_content_markup;
		}else{
			currated_content = settings.copied_content_media_layout;
			currated_content = currated_content.replace(/{copied_content}/g,content_html)
												.replace(/{page_url}/g,url_to_share)
												.replace(/{title}/g,document.title);
			
			notice.innerHTML =  settings.notice_content_media;
			notice.innerHTML = notice.innerHTML.replace(/{content_type}/g,content_type)
												.replace(/{currated_content}/g,currated_content);
		};
		
		if(ads_enabled) // Inject the ad code
			 notice.innerHTML += '<div id="bsap_1258551" class="bsarocks bsap_d49a0984d0f377271ccbf01a33f2b6d6" style="color: #999; width: 340px; clear: left;"></div>';
			
		if(settings.sharing) { // Inject the sharing tools
			if(settings.twitter.username){
				notice.innerHTML += '<div style="margin:10px 0; background: #333; margin: 0 -10px 0 -10px; padding: 5px 0 5px 10px; border-bottom-left-radius:'+settings.styling.border_radius+'px;-moz-border-radius-bottomleft:'+settings.styling.border_radius+'px;-webkit-border-bottom-left-radius:'+settings.styling.border_radius+'px;border-bottom-right-radius:'+settings.styling.border_radius+'px;-moz-border-radius-bottomright:'+settings.styling.border_radius+'px;-webkit-border-bottom-right-radius:'+settings.styling.border_radius+'px;border-top:1px #000 solid;width:360px;float:left;"><div style="margin-right:5px;float:left;"><span style="float: left;line-height:21px;color: #fff;">'+settings.share_your_copy_label+'</span>&nbsp;&nbsp;<a href="http://twitter.com/share" class="twitter-share-button" data-text="'+selected_content+'" data-count="none" data-via="'+settings.twitter.username+'">Tweet</a></div><iframe src="http://www.facebook.com/plugins/like.php?href&amp;layout=button_count&amp;show_faces=false&amp;width=60&amp;action=like&amp;font=arial&amp;colorscheme=light&amp;height=21" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:60px; height:21px;" allowTransparency="true"></iframe></div>';
			}else{
				notice.innerHTML += '<div style="margin:10px 0; background: #333; margin: 0 -10px 0 -10px; padding: 5px 0 5px 10px; border-bottom-left-radius:'+settings.styling.border_radius+'px;-moz-border-radius-bottomleft:'+settings.styling.border_radius+'px;-webkit-border-bottom-left-radius:'+settings.styling.border_radius+'px;border-bottom-right-radius:'+settings.styling.border_radius+'px;-moz-border-radius-bottomright:'+settings.styling.border_radius+'px;-webkit-border-bottom-right-radius:'+settings.styling.border_radius+'px;border-top:1px #000 solid;width:360px;float:left;"><div style="margin-right:5px;float:left;"><span style="float: left;line-height:21px;color: #fff;">'+settings.share_your_copy_label+'</span>&nbsp;&nbsp;<a href="http://twitter.com/share" class="twitter-share-button" data-text="'+selected_content+'" data-count="none">Tweet</a></div><iframe src="http://www.facebook.com/plugins/like.php?href&amp;layout=button_count&amp;show_faces=false&amp;width=60&amp;action=like&amp;font=arial&amp;colorscheme=light&amp;height=21" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:60px; height:21px;" allowTransparency="true"></iframe></div>';
			};

			twitter_script = 'http://platform.twitter.com/widgets.js';
			twitter_share = new JSONscriptRequest(twitter_script,false);
			twitter_share.buildScriptTag();
			twitter_share.addScriptTag();
		};
		
		// Style everything
		notice.setAttribute('style','background-image: -webkit-gradient(linear,left bottom,left top,color-stop(0.49, rgb(238,238,238)),color-stop(1, rgb(255,255,255))); background-image: -moz-linear-gradient(center bottom,rgb(238,238,238) 49%,rgb(255,255,255) 100%); position: absolute; border-radius: '+settings.styling.border_radius+'px; -moz-border-radius: '+settings.styling.border_radius+'px; -webkit-border-radius: '+settings.styling.border_radius+'px; -moz-box-shadow: 0px 0px 5px rgba(0,0,0,0.7); -webkit-box-shadow: 0px 0px 5px rgba(0,0,0,0.7); box-shadow: 0px 0px 5px rgba(0,0,0,0.7);');
		if(document.selection) notice.style.backgroundColor = '#fff';
		notice.style.fontSize = "12px";
		notice.style.paddingTop = "20px";
		notice.style.paddingRight = "10px";
		notice.style.paddingBottom = "0";
		notice.style.paddingLeft = "10px";
		notice.style.position = "absolute";
		notice.style.textAlign = 'left';
		notice.style.top = (_get_scroll() + 25) + 'px';
		notice.style.right = '25px';
		notice.style.width = '350px';
		notice.style.zIndex = 10000;
		notice.setAttribute('id','ink_notice');
		document.body.appendChild(notice);
		
		if(ads_enabled) _bsap.exec();
	
		document.getElementById('ink_notice').onmouseover = function(){
			clearTimeout(hide_timeout);
		};
	
		hide_timeout = window.setTimeout(function(){
			hide_notice();
		},1000 * 10);
	};
	
	function hide_notice(){
		clearTimeout(hide_timeout);
		document.body.removeChild(notice);
		delete notice;
	};
	
	function _validate_content(children_nodes,parent_node,direction){
		var node_class, node_name;

		if(direction == 'down'){
			for (var i=0; i < children_nodes.childNodes.length; i++) {
				node_class = children_nodes.childNodes[i].className;
				node_name = children_nodes.childNodes[i].nodeName;
				node_name = node_name.toLowerCase();

				// Recursivelly loop through all the children
				if(children_nodes.childNodes[i].childNodes.length > 1 && children_nodes.childNodes[i].nodeType != 3){ return _validate_content(children_nodes.childNodes[i],null,'down'); };

				if(settings.dom_nodes_excluded.indexOf(node_name) > -1 || settings.class_excluded.indexOf(node_class) > -1){
					_content_type(children_nodes.childNodes[i]);
					return false;
				};
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
		
		content_type = 'text';
		return true;
	}
	
	// Sets the copied content content type. This is later used in the notice to contextualize it.
	function _content_type(copied_node){
		var node_name = copied_node.nodeName;
			node_name = node_name.toLowerCase();

		// Define the content type
		switch(node_name) {
			case 'img':
				content_type = 'picture';
				break;
			case 'object':
				content_type = 'video';
				break;
			case 'embed':
				content_type = 'video';
				break;
			case 'video':
				content_type = 'video';
				break;
			case 'iframe':
				content_type = 'video';
				break;
		};
		
		// Clean the image node
		if(content_type == 'picture'){
			copied_node.src = copied_node.src;
			copied_node.setAttribute('style','');
		};
		
		// I need to get the HTML node as a string.
		var tmp = document.createElement("div");
		tmp.appendChild(copied_node);
		content_html = tmp.innerHTML;
	};
	
	function _getSelectedContent() {
		if (window.getSelection){
			return {
				selection: window.getSelection(),
				range: window.getSelection().getRangeAt(0)
			};
		} else if (document.getSelection) {
			return {
				selection: document.getSelection(),
				range: document.getSelection().getRangeAt(0)
			};
		} else if (document.selection) {
			return {
				selection: document.selection.createRange().text,
				range: document.selection.createRange()
			};
		} else {
			return false;
		};
	};
	
	// If Google Analytics is installed, INK will automatically track content.
	function _track_google_analytic_event(shared_content){
		if(typeof _gaq != 'undefined'){ // Make sure GA is installed
			_gaq.push(['_trackEvent', 'INK', 'Copy', shared_content]);
		};
	};
	
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
			};
			(document.getElementsByTagName('head')[0]||document.getElementsByTagName('body')[0]).appendChild(style);
		};
	};
	
	function JSONscriptRequest(fullUrl,cache) {
	    // REST request path
	    this.fullUrl = fullUrl; 
	    // Keep IE from caching requests
		this.noCacheIE = (cache) ? '&noCacheIE=' + (new Date()).getTime() : '';
	    // Get the DOM location to put the script tag
	    this.headLoc = document.getElementsByTagName("head").item(0);
	    // Generate a unique script tag id
	    this.scriptId = 'JscriptId' + JSONscriptRequest.scriptCounter++;
	};

	// Static script ID counter
	JSONscriptRequest.scriptCounter = 1;

	// buildScriptTag method
	JSONscriptRequest.prototype.buildScriptTag = function () {

	    // Create the script tag
	    this.scriptObj = document.createElement("script");

	    // Add script object attributes
	    this.scriptObj.setAttribute("type", "text/javascript");
	    this.scriptObj.setAttribute("charset", "utf-8");
	    this.scriptObj.setAttribute("src", this.fullUrl + this.noCacheIE);
	    this.scriptObj.setAttribute("id", this.scriptId);
	};

	// removeScriptTag method
	JSONscriptRequest.prototype.removeScriptTag = function () {
	    // Destroy the script tag
	    this.headLoc.removeChild(this.scriptObj);  
	};

	// addScriptTag method
	JSONscriptRequest.prototype.addScriptTag = function () {
	    // Create the script tag
	    this.headLoc.appendChild(this.scriptObj);
	};
	
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