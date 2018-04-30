takeScreenshots = function(tab,currentScrn, maxScrn, imageTable, windowHeight, pageHeight, windowWidth){
	console.log(currentScrn + ", " + maxScrn);
	if (currentScrn < maxScrn){
		chrome.tabs.captureVisibleTab({"format":"png"}, function(dataUrl) {
			var img = new Image;
			img.src = dataUrl;
	    	imageTable.push(img);
	    	chrome.tabs.sendMessage(tab.id, {"type":"2"}, function(response) {
	    		window.setTimeout(function() {
	    			takeScreenshots(tab,currentScrn+1, maxScrn, imageTable, windowHeight, pageHeight, windowWidth);
	    		}, 200);
			});
	    	
		});
	}else{
		var canvas = document.createElement("canvas");
		var ctx = canvas.getContext("2d");
		canvas.width = windowWidth;
		canvas.height = pageHeight;
		var actualHeight = 0;
		for (var i = 0; i < maxScrn-1 ; i++) {
	    	ctx.drawImage(imageTable[i], 0, actualHeight);
	    	actualHeight += windowHeight;
		}
    	ctx.drawImage(imageTable[maxScrn-1], 0, pageHeight - windowHeight);
    	var url = canvas.toDataURL();
    	chrome.tabs.sendMessage(tab.id, {"type":"3"}, function(response) {});
    	chrome.downloads.download({url:url, filename:'' + Date.now() + '.png', saveAs:true});
	}
}


fullPageScreenshot = function(){
	var windowHeight;
	var pageHeight;
	var windowWidth;
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  		chrome.tabs.sendMessage(tabs[0].id, {"type":"1"}, function(response) {
	  		windowHeight = response.windowHeight;
			pageHeight = response.pageHeight;
			windowWidth = response.windowWidth;
			var k = Math.floor(pageHeight/windowHeight);
			var imageTable = [];
	    	window.setTimeout(function() {
	    	takeScreenshots(tabs[0], 0, k+2, imageTable, windowHeight, pageHeight, windowWidth);
	    	}, 200);
		});
	});
}

chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse){
        switch(request.msg){
        	case "current":
        		//take screenshot of current tab
        		console.log('Taking current view screenshot');
        		chrome.tabs.captureVisibleTab({"format":"png"}, function(dataUrl) {
        			chrome.downloads.download({url:dataUrl, filename: '' + Date.now() + '.png', saveAs:true});
        		});
        		break;
        	case "full":
        		console.log('Taking full page screenshot');
        		fullPageScreenshot();
        		break;
        	case "custom":
        		console.log('Taking custom screenshot');
        		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
					chrome.tabs.sendMessage(tabs[0].id, {"type":"4"}, function(response){});
				});
        		break;
        	case "custom_take":
        		chrome.tabs.captureVisibleTab({"format":"png"}, function(dataUrl){
					var canvas = document.createElement("canvas");
					var ctx = canvas.getContext("2d");
					canvas.width = request.width;
					canvas.height = request.height;
					var img = new Image;
					img.src = dataUrl;
					window.setTimeout(function() {
						ctx.drawImage(img, -request.x,-request.y);
						var imageURL = canvas.toDataURL();
						chrome.downloads.download({url:imageURL, filename:'' + Date.now() + '.png', saveAs:true});
					}, 500);
				});
        	default:
        		console.log("Background script received an unexpected request");
        }
    }
);