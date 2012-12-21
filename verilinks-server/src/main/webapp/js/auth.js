var OAUTHURL = 'https://accounts.google.com/o/oauth2/auth?';
var VALIDURL = 'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=';
var SCOPE = 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';
var CLIENTID = '23285137063-h9ddnqshh1924a3808n78sgkdvfskjme.apps.googleusercontent.com';
var REDIRECT = 'http://127.0.0.1:8020/verilinks-server/oauth.html';
var LOGOUT = 'http://accounts.google.com/Logout';
var TYPE = 'token';
var _url = OAUTHURL + 'scope=' + SCOPE + '&client_id=' + CLIENTID + '&redirect_uri=' + REDIRECT + '&response_type=' + TYPE;
var acToken;
var tokenType;
var expiresIn;
var user;
var loggedIn = false;

function login() {
	var win = window.open(_url, "windowname1", 'width=800, height=600');

	var pollTimer = window.setInterval(function() {
		try{
		console.log(win);
		console.log(win.document);
		console.log(win.document.URL);
		if (win.document.URL.indexOf(REDIRECT) != -1) {
			window.clearInterval(pollTimer);
			var url = win.document.URL;
			acToken = gup(url, 'access_token');
			tokenType = gup(url, 'token_type');
			expiresIn = gup(url, 'expires_in');
			win.close();

			validateToken(acToken);
		}
		} catch(ex){}
	}, 500);
}

function validateToken(token) {
	$.ajax({
		url : VALIDURL + token,
		data : null,
		success : function(responseText) {
			getUserInfo();
			loggedIn = true;
			$('#loginText').hide();
			$('#logoutText').show();
			showAdmin();
		},
		dataType : "jsonp"
	});
}

function getUserInfo() {
	$.ajax({
		url : 'https://www.googleapis.com/oauth2/v1/userinfo?access_token=' + acToken,
		data : null,
		success : function(resp) {
			user = resp;
			console.log(user);
			$('#uName').text('Welcome ' + user.name);
			$('#imgHolder').attr('src', user.picture);
		},
		dataType : "jsonp"
	});
}

//credits: http://www.netlobo.com/url_query_string_javascript.html
function gup(url, name) {
	name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
	var regexS = "[\\#&]" + name + "=([^&#]*)";
	var regex = new RegExp(regexS);
	var results = regex.exec(url);
	if (results == null)
		return "";
	else
		return results[1];
}

function startLogoutPolling() {
	$('#loginText').show();
	$('#logoutText').hide();
	loggedIn = false;
	$('#uName').text('Welcome ');
	$('#imgHolder').attr('src', 'none.jpg');
}

function showAdmin(){
	
}