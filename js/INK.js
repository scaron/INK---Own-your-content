var ink = function(){
	var url_to_share;
	
	var settings = {
		copied_content_layout: '"{copied_content}"\n\rRead more about {title} on:\r\n{page_url}',
		google_analytics : {
			utm_source:'website',
			utm_medium:'share',
			utm_campaign:'copy'
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
		
		// IE doesn't support indexOf...so...yeah
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
			// Create a fragment, I need to do this because what htmlText is a string and I need to be able to parse the node tree
			var frag = document.createElement('div');
			frag.style.display = 'none';
			frag.setAttribute('id','pc_frag');
			frag.innerHTML = cached_selected_content.range.htmlText;
			document.body.appendChild(frag); // Append to retrieve the node tree
			children_nodes = document.getElementById('pc_frag'); // Cache the element
			document.getElementById('pc_frag').removeNode(true); // Don't need it anymore
			parent_node = cached_selected_content.range.parentElement();
		}else{
			children_nodes = cached_selected_content.range.cloneContents();
			parent_node = cached_selected_content.selection.anchorNode.parentNode;
		}

		if(!_validate_content(children_nodes,parent_node,'down')) return;
		
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
			}else{ // The others
				var currSelection = window.getSelection();
				currSelection.removeAllRanges();
				currSelection.addRange(cached_selected_content.range)
			}
		},1);
	};
	
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
	
	function _track_google_analytic_event(shared_content){
		if(typeof _gaq != 'undefined'){ // Make sure GA is installed
			_gaq.push(['_trackEvent', 'Share', 'Copy', location.href, shared_content]);
		}
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
	
	
	return {
		init : init,
		copy : copy
	}
}();
ink.init();