VERILINKS = (function() {

	var lati = 0;
	var longi = 0;
	var isMap = false;

	// constants
	const TRUE = 1;
	const FALSE = 0;
	const UNSURE = -1;
	const EVAL_POSITIVE = 1;
	const EVAL_NEGATIVE = -1;
	const EVAL_UNSURE = 0;
	const EVAL_FIRST = -2;
	const EVAL_ERROR = -1111;
	const EVAL_THRESHOLD = 0.3;
	// const SERVER_URL = "http://localhost:8080/verilinks-server/";
	// const SERVER_URL = "/verilinks-server/server";
	const SERVER_URL = "http://verilinks.aksw.org/";
	var link = null;
	// template for displaying
	var template = null;
	// array of already verified links
	var verifiedLinks = [];
	var user = null;
	var linkset = null;
	// evaluation of user's verification
	var prevLinkEval = 1111;

	var locked = true;

	var startOfGame = true;
	var timeout;

	$(document).ready(function() {

		insertScript(init);
		// init();
	});

	function init() {
		login();
		templateRequest();
		linkRequest(generateURL(), function() {
			loadMap();
			VERILINKS.lock();
			startOfGame = false;
		});
	}

	function insertScript(callback) {
		// openlayers
		var headID = document.getElementsByTagName("head")[0];
		var mapScript = document.createElement('script');
		mapScript.src = 'http://www.openlayers.org/api/OpenLayers.js';
		mapScript.onload = function() {
			// jsrScript
			var jsrScript = document.createElement('script');
			jsrScript.type = 'text/x-jsrender';
			jsrScript.id = 'template';
			headID.appendChild(jsrScript);
			// jsr helper
			var helperScript = document.createElement('script');
			helperScript.type = 'text/javascript';
			headID.appendChild(helperScript);
			var code = "$.views.helpers({setLat : function(val) {VERILINKS.setLat(val);VERILINKS.setIsMap(true);},setLong : function(val) {VERILINKS.setLong(val);}});"
			helperScript.text = code;
			if (callback != undefined && typeof callback == 'function')
				callback();
		};
		headID.appendChild(mapScript);

	}

	// ajax call to get new link
	// draw link as callback
	function linkRequest(req, callback) {
		if (req == null) {
			alert("Can't request link!");
			return null;
		}

		xmlHttp = new XMLHttpRequest();
		xmlHttp.onreadystatechange = function() {
			if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
				if (xmlHttp.responseText == "Not found") {
					alert("Error: Receiving Link!");
				} else {
					var data = eval("(" + xmlHttp.responseText + ")");
					handleLink(data);
					if (callback != undefined && typeof callback == 'function')
						callback();
				}
			}
		}
		xmlHttp.open("GET", req, true);
		xmlHttp.send(null);

		// alert(req);
		// ERROR in Chrome ----------- fallback to native js
		// $.ajax({
		// url : req,
		// success : function(data) {
		// handleLink(data);
		// if (callback != undefined && typeof callback == 'function')
		// callback();
		// },
		// error : function(jqXHR, textStatus, errorThrown) {
		// alert("Error getting Link: " + textStatus.toString);
		// return null;
		// }
		// });
	}

	function handleLink(data) {
		link = new Link(data);
		render(data);
	}

	/** Objects **/
	function Link(json) {
		// var link = jQuery.parseJSON(json);
		var link = json;
		this.id = link.id;
		this.predicate = link.predicate;
		this.subject = new Instance(link.subject, "subject");
		this.object = new Instance(link.object, "object");

		prevLinkEval = link.prevLinkEval;
	}

	function Instance(instance, div) {
		this.uri = instance.uri;
		this.properties = instance.properties;
		this.long = null;
		this.lat = null;
		var prop;
		var value;
		var desc;
		var pic;
		for (var i = 0; i < this.properties.length; ++i) {
			prop = this.properties[i].property;
			value = this.properties[i].value;
			if (prop == '<http://www.w3.org/2003/01/geo/wgs84_pos#lat>' && value.length > 0)
				this.lat = value;
			if (prop == '<http://www.w3.org/2003/01/geo/wgs84_pos#long>' && value.length > 0)
				this.long = value;
		}
	}


	Instance.prototype.getProperty = function(search) {
		var prop;
		var value;
		for (var i = 0; i < this.properties.length; ++i) {
			prop = this.properties[i].property;
			value = this.properties[i].value;
			if (prop == search && value.length > 0)
				return value;
		}
		return null;
	};

	function Verification(linkId, linkVerification) {
		this.id = linkId;
		this.veri = linkVerification;
	}

	function Commit() {
		this.user = user;
		this.verification = verifiedLinks;
	}

	function User(userId, userName) {
		this.id = userId;
		this.name = userName;
	}

	/* END */

	function loadMap(callback) {
		if (!isMap)
			return;
		var div = 'object';
		var mapDiv = "map_" + div;
		if ($("#" + mapDiv).length == 0) {
			$("#" + div).append("<div id='" + mapDiv + "'></div>");
		} else {
			$("#" + mapDiv).html("");
		}
		var map = new OpenLayers.Map(mapDiv);
		var mapnik = new OpenLayers.Layer.OSM();
		var fromProjection = new OpenLayers.Projection("EPSG:4326");
		// Transform from WGS 1984
		var toProjection = new OpenLayers.Projection("EPSG:900913");
		// to Spherical Mercator Projection
		var position = new OpenLayers.LonLat(parseFloat(longi), parseFloat(lati)).transform(fromProjection, toProjection);
		var zoom = 5;

		map.addLayer(mapnik);

		markers = new OpenLayers.Layer.Markers("Cities");
		map.addLayer(markers);
		markers.clearMarkers();

		var size = new OpenLayers.Size(21, 25);
		var offset = new OpenLayers.Pixel(-(size.w / 2), -size.h);
		var icon = new OpenLayers.Icon('http://www.openlayers.org/dev/img/marker.png', size, offset);
		markers.addMarker(new OpenLayers.Marker(position, icon.clone()));

		map.setCenter(position, zoom);

		// callback
		if (callback != undefined && typeof callback == 'function') {
			callback();
		}
	}

	function htmlEntities(str) {
		return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	}

	// draw link
	function render(data) {
		$("#render").html($("#template").render(data));
		window.drawMsg(VERILINKS.getEval());
		VERILINKS.lock();
		timer();
	}

	function clear() {
		$("#subject").html("");
		$("#object").html("");
		$("#predicate").html("");
	}

	function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
		var words = text.split(' ');
		var line = '';
		for (var n = 0; n < words.length; n++) {
			var testLine = line + words[n] + ' ';
			var metrics = ctx.measureText(testLine);
			var testWidth = metrics.width;
			if (testWidth > maxWidth) {
				ctx.fillText(line, x, y);
				line = words[n] + ' ';
				y += lineHeight;
			} else {
				line = testLine;
			}
		}
		ctx.fillText(line, x, y);
	}

	function templateRequest(callback) {
		// var url = "http://localhost:8080/verilinks-server/server?service=getTemplate";
		// var url = SERVER_URL + "server?service=getTemplate";
		var url = SERVER_URL + "server?service=getTemplate&template=dbpedia-linkedgeodata";
		// $.ajax({
			// url : url,
			// success : function(data) {
				// // alert(data);
				// $('#template').html(data);
				// if (callback != undefined && typeof callback == 'function')
					// callback();
			// }
		// });
		$('#template').load(url);
	}

	function getTemplate(linksetId) {
		var t = templates.templates;
		for (var i = 0; i < t.length; i++) {
			if (t[i].id == linksetId) {
				var template = t[i];
				return template;
			}
		}
		return null;
	}

	/** Check request params and generate Request URL */
	function generateURL(verification) {
		var url = SERVER_URL + "server?service=getLink"
		if (user == null) {
			alert("user missing");
			return null;
		}
		if (user.name.length == 0) {
			alert("userName missing");
			return null;
		} else
			url += "&userName=" + user.name;
		if (user.id.length == 0) {
			alert("userId missing");
			return null;
		} else
			url += "&userId=" + user.id;
		if (link != null) {
			url += "&curLink=" + link.id;
		}
		if (linkset == null || linkset.length == 0)
			return null;
		else
			url += "&linkset=" + linkset;
		if (getVerifiedLinks() != null)
			url += "&verifiedLinks=" + getVerifiedLinks();
		url += "&nextLink=" + getNextLink();
		if (verification != null)
			url += "&verification=" + verification;
		// alert(url);
		return url;
	}

	function getNextLink() {
		var min = 4;
		var max = 6;
		var rnd = Math.floor((Math.random() * max) + min);
		if (verifiedLinks.length % rnd == rnd - 1) {
			nextLink = true;
		} else {
			nextLink = false;
		}

		return false;
	}

	function getVerifiedLinks() {
		if (verifiedLinks == null || verifiedLinks.length == 0)
			return null;
		var param = "";
		for (var i = 0; i < verifiedLinks.length; i++) {
			param += verifiedLinks[i].id;
			if (i != (verifiedLinks.length - 1))
				param += "+";
		}
		return param;
	}

	function login() {
		user = new User('FooID_ID', 'FooName')
		linkset = 'dbpedia-linkedgeodata';
	}

	// function Statistics(){
	// this.agree = 0;
	// this.agree=0;
	// this.disagree=0;
	// this.penalty=0;
	// this.unsure=0;
	// this.verification = new Array();
	// }

	function timer() {
		if (!startOfGame)
			timeout = setTimeout('VERILINKS.unlock()', 1300);
	}

	// JsRender Helper functions

	return {
		// Get evaluation of previous link-verification
		getEval : function() {
			var eval = "Game Message";
			if (prevLinkEval == EVAL_FIRST)
				eval = "first";
			else if (prevLinkEval == EVAL_NEGATIVE)
				eval = "penalty";
			else if (prevLinkEval == EVAL_UNSURE)
				eval = "unsure";
			else if (prevLinkEval == EVAL_POSITIVE || prevLinkEval > EVAL_THRESHOLD)
				eval = "agreement";
			else if (prevLinkEval <= EVAL_THRESHOLD)
				eval = "disagreement";
			// alert(eval);
			return eval;
		},
		// Verify link afterwards get new link and insert into verilinksComponent
		verify : function(verification) {
			if (locked)
				return;
			// add to verifiedLinks array
			var duplicate = false;
			// search for duplicates in array
			for (var i = 0; i < verifiedLinks.length; i++) {
				if (link.id == verifiedLinks[i]) {
					duplicate = true;
					break;
				}
			}
			if (!duplicate) {
				var veri = new Verification(link.id, verification);
				verifiedLinks.push(veri);
			}

			linkRequest(generateURL(verification), loadMap);
		},
		// Commit user's verification
		commit : function() {
			clearTimeout(timeout);
			var url = SERVER_URL + "server?service=commitVerifications";
			var obj = new Commit();
			var json = JSON.stringify(obj);
			// alert("data: " + json);
			$.ajax({
				type : 'POST',
				url : url,
				data : json,
				success : function(data) {
					alert("Post: " + data);
					verifiedLinks.length = 0;
				},
				dataType : 'application/json'
			});
		},
		lock : function() {
			locked = true;
			$(".lock").css({
				opacity : 0.3
			});
			// $("#start").removeAttr('disabled');
		},
		lockVerify : function() {
			locked = true;
			$(".lock").css({
				opacity : 0.3
			});
			$("#start").removeAttr('disabled');
		},
		unlock : function() {
			locked = false;
			$(".lock").css({
				opacity : 1
			});
			$("#start").attr('disabled', 'disabled');
		},
		TRUE : function() {
			return TRUE;
		},
		FALSE : function() {
			return FALSE;
		},
		UNSURE : function() {
			return UNSURE;
		},
		setLat : function(val) {
			lati = val;
		},
		setLong : function(val) {
			longi = val;
		},
		setIsMap : function(val) {
			isMap = val;
		}
	};

})();