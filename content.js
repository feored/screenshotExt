var canvas = null;
var ctx = null;
var s = null;
var elementsFixed = [];
var checkButton = new Image();
var crossButton = new Image();
checkButton.addEventListener("load", function(){
}, false);
crossButton.addEventListener("load", function(){
}, false);
checkButton.src = chrome.extension.getURL('images/check.png');
crossButton.src = chrome.extension.getURL('images/cross.png');

function contains(x, y, w, h, mx, my){
	return (x<=mx) && (x + w >= mx) && 
			(y <= my) && (y + h >= my);
}


chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
	if(message.type == "1"){
		window.scrollTo(0,0);
		var body = document.body;
	    var html = document.documentElement;
		var height = Math.max( body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight );
		var h = window.innerHeight;
		var w = window.innerWidth;
		console.log("This is h: " + h);
		console.log("This is height: " + height);
		var all = document.getElementsByTagName("*");
		for (var i=0, max=all.length; i < max; i++) {
		     if (getComputedStyle(all[i]).position=="fixed"){
		     	elementsFixed.push(all[i]);
		     	all[i].style.position = "absolute";
		     }
		}

		sendResponse({
			"windowHeight":h,
			"pageHeight":height,
			"windowWidth":w
		});
	}
	if (message.type == "2"){
		window.scrollBy(0,window.innerHeight);
		sendResponse({});
	}
	if (message.type == "3"){
		for (var i=0, max = elementsFixed.length; i < max; i++){
			elementsFixed[i].style.position = "fixed";
		}
	}
	if (message.type == "4"){
		if (canvas == null && ctx == null){
			canvas = document.createElement("canvas");
			ctx = canvas.getContext("2d");
			document.body.insertBefore(canvas, document.body.firstChild);
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			canvas.style.position = 'fixed';
			canvas.style.zIndex = 2147483646;
			canvas.style.display = "block";
		}
		 else {
		 	ctx.clearRect(0,0, canvas.width, canvas.height);
		 	document.body.insertBefore(canvas, document.body.firstChild);
		}
		var s = new CanvasState(canvas);
	  	s.setShape(new Shape(((window.innerWidth/2)-320),((window.innerHeight/2)-180),600,300));
	  	s.selecting = true;
	}
});

function Box(x,y,s){
	this.x = x||0;
	this.y = y||0;
	this.s = s||0;
}

Box.prototype.draw = function(ctx){
	ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
	ctx.fillRect(this.x, this.y, this.s, this.s);
}

function swap(l,i,j){
	var inter = new Box(l[j].x,l[j].y,l[j].s);
	l[j] = l[i];
	l[i] = inter;
}

function Shape(x,y,w,h){
	this.x = x||0;
	this.y = y||0;
	this.w = w||0;
	this.h = h||0;
	this.boxes = [];
	var s = Math.min(Math.max(0.1*this.w, 0.1*this.h),10);
	var rightX = this.x + this.w - s;
	var midX = this.x + this.w/2 - s/2;
	var midY = this.y + this.h/2 - s/2;
	var downY = this.y + this.h - s;
	this.boxes.push(new Box(this.x, this.y, s, s));
	this.boxes.push(new Box(midX, this.y, s, s));
	this.boxes.push(new Box(rightX, this.y, s,s));
	this.boxes.push(new Box(rightX, midY, s, s));
	this.boxes.push(new Box(rightX, downY, s, s));
	this.boxes.push(new Box(midX, downY, s, s));
	this.boxes.push(new Box(this.x, downY, s, s));
	this.boxes.push(new Box(this.x, midY, s, s));
}

Shape.prototype.setPosition = function(nx, ny){
	var tx = this.x - nx;
	var ty = this.y - ny;
	this.x = nx;
	this.y = ny;
	var l = this.boxes.length;
	for (var i = 0; i<l; i++){
		this.boxes[i].x = this.boxes[i].x - tx;
		this.boxes[i].y = this.boxes[i].y - ty;
	}
}

Shape.prototype.adjustBoxes = function(){
	// 0 1 2
	// 7   3
	// 6 5 4
	var newS = Math.min(Math.max(0.1*this.w, 0.1*this.h),10);
	var rightX = this.x + this.w - newS;
	var midX = this.x + this.w/2 - newS/2;
	var midY = this.y + this.h/2 - newS/2;
	var downY = this.y + this.h - newS;
	var l = this.boxes.length;
	for (var i=0; i<l; i++){
		this.boxes[i].s = newS;
	}
	this.boxes[0].x = this.x;
	this.boxes[0].y = this.y;
	this.boxes[1].x = midX;
	this.boxes[1].y = this.y;
	this.boxes[2].x = rightX;
	this.boxes[2].y = this.y;
	this.boxes[3].x = rightX;
	this.boxes[3].y = midY;
	this.boxes[4].x = rightX;
	this.boxes[4].y = downY;
	this.boxes[5].x = midX;
	this.boxes[5].y = downY;
	this.boxes[6].x = this.x;
	this.boxes[6].y = downY;
	this.boxes[7].x = this.x;
	this.boxes[7].y = midY;
}

Shape.prototype.horiSymm = function(){
	swap(this.boxes,0,2);
	swap(this.boxes,7,3);
	swap(this.boxes,6,4);
}

Shape.prototype.vertiSymm = function(){
	swap(this.boxes,0,6);
	swap(this.boxes,1,5);
	swap(this.boxes,2,4);
}

Shape.prototype.resize = function(i,mx,my){ //i : box being dragged
	var oldx = this.x;
	var oldy = this.y;
	var oldh = this.h;
	var oldw = this.w;
	var newI = i;
	// 0 1 2
	// 7   3
	// 6 5 4
	switch(i){
		case 0:
			if(mx <= oldx+oldw && my <= oldy+oldh){
				this.x = mx;
				this.y = my;
				this.w += oldx-mx;
				this.h += oldy-my;
			}else{
				if(mx >= oldx + oldw){
					this.x = oldx+oldw;
					this.w = mx - this.x;
					this.horiSymm();
					newI = 2;
				}
				if(my >= oldy + oldh){
					this.y = oldy + oldh;
					this.h = my - this.y;
					this.vertiSymm();
					newI=6;
				}
			}
			break;
		case 1:
			if(my < oldy+oldh){
				this.y = my;
				this.h += oldy-my;
			}else{
				this.y = oldy+oldh;
				this.h = my - this.y;
				this.vertiSymm();
				newI = 5;
			}
			break;
		case 2:
			if(mx > oldx && my < oldy+oldh){
				this.y = my;
				this.h += oldy-my;
				this.w = mx-oldx;
			}else{
				if(mx < oldx){
					this.x = mx;
					this.w = oldx - mx;
					this.horiSymm();
					newI = 0;
				}
				if(my > oldy+oldh){
					this.y = oldy + oldh;
					this.h = my - this.y;
					this.vertiSymm();
					newI = 4;
				}
			}
			break;
		case 3:
			if(mx > oldx)
				this.w = mx - oldx;
			else{
				this.x = mx;
				this.w = oldx - mx;
				this.horiSymm();
				newI=7;
			}
			break;
		case 4:
			if(mx > oldx && my > oldy){
				this.w = mx-oldx;
				this.h = my-oldy;
			}else{
				if(mx < oldx){
					this.x = mx;
					this.w = oldx - mx;
					this.horiSymm();
					newI=6;
				}
				if(my < oldy){
					this.y = my;
					this.h = oldy - my;
					this.vertiSymm();
					newI=2;
				}
			}
			break;
		case 5:
			if(my > oldy)
				this.h = my-oldy;
			else{
				this.y = my;
				this.h = oldy - my;
				this.vertiSymm();
				newI = 1;
			}
			break;
		case 6:
			if(mx < oldx+oldw && my > oldy){
				this.x = mx;
				this.w += oldx-mx;
				this.h = my-oldy;
			}else{
				if(mx > oldx+oldw){
					this.x = oldx+oldw;
					this.w = mx - this.x;
					this.horiSymm();
					newI=4;
				}
				if(my < oldy){
					this.y = my;
					this.h = oldy - my;
					this.vertiSymm();
					newI=0;
				}
			}
			break;
		case 7:
			if(mx < oldx+oldw){
				this.x = mx;
				this.w += oldx-mx;
			}else{
				this.x = oldx+oldw;
				this.w = mx - this.x;
				this.horiSymm();
				newI=3;
			}
			break;
		default:
			console.log("unexpected switch in resize function");
  	}
  	this.adjustBoxes();
  	return newI;
}

Shape.prototype.draw = function(ctx){
	ctx.fillStyle="rgba(36, 166, 209, 1)";
	ctx.fillRect(this.x-2, this.y-2, this.w+4, this.h+4);
	ctx.clearRect(this.x, this.y, this.w, this.h);
	var l = this.boxes.length;
	for (var i = 0; i<l; i++){
		this.boxes[i].draw(ctx);
	}
	ctx.clearRect(this.x + this.w - 2 * checkButton.width, this.y+2+this.h, 2*checkButton.width, checkButton.height);
	ctx.drawImage(checkButton, this.x + this.w - 2 * checkButton.width, this.y + 2 + this.h, checkButton.width, checkButton.height);
	ctx.drawImage(crossButton, this.x + this.w - checkButton.width, this.y + 2 + this.h, crossButton.width, crossButton.height);
}

Box.prototype.contains = function(mx,my){
	var value = (this.x<=mx) && (this.x + this.s >= mx) && 
			(this.y <= my) && (this.y + this.s >= my);
	return value;
}

Shape.prototype.contains = function(mx,my){
	return (this.x<=mx) && (this.x + this.w >= mx) && 
			(this.y <= my) && (this.y + this.h >= my);
}

function CanvasState(canvas){
	this.canvas = canvas;
	this.width = canvas.width;
	this.height = canvas.height;
	this.ctx = canvas.getContext('2d');
	var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;
  	if (document.defaultView && document.defaultView.getComputedStyle) {
    	this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10)      || 0;
   	 	this.stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10)       || 0;
    	this.styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10)  || 0;
    	this.styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10)   || 0;
  	}
  	var html = document.body.parentNode;
  	this.htmlTop = html.offsetTop;
  	this.htmlLeft = html.offsetLeft;

  	this.valid = false;
  	this.shape = null;
  	this.dragging = false;
  	this.isResizeDrag = false;
  	this.dragoffx = 0;
  	this.dragoffy = 0;
  	this.boxResizing = 0;

  	myState = this;
  	window.onresize = function(){
		myState.canvas.width = window.innerWidth;
		myState.width = window.innerWidth;
		myState.canvas.height = window.innerHeight;
		myState.height = window.innerHeight;
		if(myState.shape.x > window.innerWidth){
			myState.shape.setPosition(window.innerWidth - myState.shape.w, myState.shape.y);
		}
		if(myState.shape.y > window.innerHeight){
			myState.shape.setPosition(myState.shape.x, window.innerHeight - myState.shape.h);
		}
		myState.valid = false;
	}
  	canvas.addEventListener('selectstart', function(e) { e.preventDefault(); return false; }, false);
  	canvas.addEventListener('mousedown', function(e){
  		var mouse = myState.getMouse(e);
  		var mx = mouse.x;
  		var my = mouse.y;
  		var shape = myState.shape;
  		if(shape!= null){
  			if(shape.contains(mx,my)){
  				var l = shape.boxes.length;
  				for (var i = 0; i<l; i++){
  					if (shape.boxes[i].contains(mx,my)){
  						myState.dragoffx = mx - shape.x;
						myState.dragoffy = my - shape.y;
						myState.selecting = true;
						myState.valid = false;
  						myState.isResizeDrag = true;
  						myState.boxResizing = i;
  						myState.setMouse(i);
  						return;
  					}
  				}
  				if (!myState.isResizeDrag){
  					myState.canvas.style.cursor = '-webkit-grabbing';
  				}
  				myState.dragoffx = mx - shape.x;
  				myState.dragoffy = my - shape.y;
  				myState.dragging = true;
  				myState.selecting = true;
  				myState.valid = false;
  				return;
  			}else if (contains(shape.x + shape.w - 2 * checkButton.width, 
  								shape.y + 2 + shape.h,
								checkButton.width, 
								checkButton.height, 
								mx, my)){
			    ctx.clearRect(0,0, myState.canvas.width, myState.canvas.height);
			    document.body.removeChild(canvas);
		    	chrome.extension.sendRequest({
		    		"msg":"custom_take",
		    		"x":myState.shape.x,
					"y":myState.shape.y,
					"width":myState.shape.w,
					"height":myState.shape.h
		    	});
		    	return;
  			}else if (contains(shape.x + shape.w - checkButton.width, 
  								shape.y + 2 + shape.h,
  								crossButton.width, 
  								crossButton.height, mx, my)){
  				ctx.clearRect(0,0, myState.canvas.width, myState.canvas.height);
			    document.body.removeChild(canvas);
			    return;
  			}
  		}

  		if(myState.selecting){
  			myState.selecting = false;
  			myState.valid = false; //redraw for selection border
  		}
  	}, true);
  	canvas.addEventListener('mousemove', function(e){
  		var mouse = myState.getMouse(e);
  		var mx = mouse.x;
  		var my = mouse.y;
  		if(myState.dragging){
  			myState.shape.setPosition(mx - myState.dragoffx, my - myState.dragoffy);
  			myState.valid = false;
  		}else if(myState.isResizeDrag){
  			var newResizeBox = myState.shape.resize(myState.boxResizing, mx, my);
  			myState.boxResizing = newResizeBox;
  			myState.setMouse(myState.boxResizing);
  			myState.valid = false;
  		}else{
  			var mouse = myState.getMouse(e);
	  		var mx = mouse.x;
	  		var my = mouse.y;
	  		var shape = myState.shape;
	  		if(shape!= null){
	  			if(shape.contains(mx,my)){
	  				var l = shape.boxes.length;
	  				var hoverDrag = false;
	  				for (var i = 0; i<l; i++){
	  					if (shape.boxes[i].contains(mx,my)){
	  						hoverDrag = true;
	  						myState.setMouse(i);
	  					}
	  				}
	  				if(!hoverDrag)
	  					myState.canvas.style.cursor = '-webkit-grab';
	  			}else{
  					myState.canvas.style.cursor = 'default';
  				}
  			}
  		}
  	},	true);
  	canvas.addEventListener('mouseup', function(e){
  		myState.dragging=false;
  		myState.isResizeDrag = false;
  		myState.canvas.style.cursor = 'default';
  	},	true);
  	canvas.addEventListener('dblclick', function(e) {
	    var mouse = myState.getMouse(e);
	    var mx = mouse.x;
	    var my = mouse.y;
	    if(!myState.shape.contains(mx,my)){
	    	ctx.clearRect(0,0, myState.canvas.width, myState.canvas.height);
		    document.body.removeChild(canvas);
		    }
	  }, true);
  	this.selectionColor = '#24A6D1';
 	this.selectionWidth = 2;  
  	this.interval = 16;
  	setInterval(function() { myState.draw(); }, myState.interval);
}

CanvasState.prototype.setShape = function(newShape) {
  	this.shape = newShape;
  	this.valid = false;
}

CanvasState.prototype.clear = function() {
	this.ctx.clearRect(0,0,this.width,this.height);
	this.ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
	this.ctx.fillRect(0,0, this.width, this.height);
}

CanvasState.prototype.draw = function() {
  	if (!this.valid) {
    	var ctx = this.ctx;
    	var shape = this.shape;
    	this.clear();

    	if (!(shape.x > this.width || shape.y > this.height ||
        	shape.x + shape.w < 0 || shape.y + shape.h < 0))
      	shape.draw(ctx);
       	this.valid = true;
  }
}

CanvasState.prototype.getMouse = function(e) {
  	var element = this.canvas, offsetX = 0, offsetY = 0, mx, my;
  
  	if (element.offsetParent !== undefined) {
    	do {
    		offsetX += element.offsetLeft;
      		offsetY += element.offsetTop;
    	} while ((element = element.offsetParent));
  	}

  	offsetX += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft;
  	offsetY += this.stylePaddingTop + this.styleBorderTop + this.htmlTop;

  	mx = e.clientX - offsetX;
  	my = e.clientY - offsetY;
  
  	return {x: mx, y: my};
}

CanvasState.prototype.setMouse = function(i){
	// 0 1 2
	// 7   3
	// 6 5 4
	switch (i){
		case 0 :
			this.canvas.style.cursor = 'nw-resize';
			break;
		case 1 :
			this.canvas.style.cursor = 'n-resize';
			break;
		case 2 :
			this.canvas.style.cursor = 'ne-resize';
			break;
		case 3 :
			this.canvas.style.cursor = 'e-resize';
			break;
		case 4 :
			this.canvas.style.cursor = 'se-resize';
			break;
		case 5 :
			this.canvas.style.cursor = 's-resize';
			break;
		case 6 :
			this.canvas.style.cursor = 'sw-resize';
			break;
		case 7 :
			this.canvas.style.cursor = 'w-resize';
			break;
		default:
			console.log("Stahp");
	}
}

function init() {
  	s = new CanvasState(document.getElementById('canvas1'));
  	s.setShape(new Shape(((window.innerWidth/2)-320),((window.innerHeight/2)-180),400,400));
  	s.selecting = true;
}