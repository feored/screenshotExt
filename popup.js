//document.addEventListener('DOMContentLoaded', function() {
	document.getElementById('current').addEventListener('click', function(){
		chrome.extension.sendRequest({msg:'current'});
	});
	document.getElementById('full').addEventListener('click', function(){
		chrome.extension.sendRequest({msg:'full'});
	});
	document.getElementById('custom').addEventListener('click', function(){
		chrome.extension.sendRequest({msg:'custom'});
	});
//  }, false);