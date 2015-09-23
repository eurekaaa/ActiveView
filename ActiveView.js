var naver_corp_da = naver_corp_da || {};

naver_corp_da.getDateString = function(){
	var curDate = new Date();
	var year = curDate.getFullYear();
	var month = ((curDate.getMonth() + 1) < 10) ? "0" + (curDate.getMonth() + 1) : curDate.getMonth() + 1; 
	var day = (curDate.getDate() < 10) ? "0" + curDate.getDate() : curDate.getDate();
	var hour = (curDate.getHours() < 10) ? "0" + curDate.getHours() : curDate.getHours();
	var minute = (curDate.getMinutes() < 10) ? "0" + curDate.getMinutes() : curDate.getMinutes();
	var second = (curDate.getSeconds() < 10) ? "0" + curDate.getSeconds() : curDate.getSeconds();

	return year + "" + month + "" + day + "" + hour + "" + minute + "" + second;
}

naver_corp_da.ActiveView = function(info){
	if(!info.adDiv) return;

	this.adDiv = info.adDiv;
	this.acEndDate = info.acEndDate || "20991231235959";
	this.adEndDate = info.adEndDate || "20991231235959";
	this.scrollTarget = info.scrollTarget || window;
	this.activeViewTime = info.activeViewTime || 0;
	this.activeViewPercentage = info.activeViewPercentage || 1.0;
	this.orientationChangeTime = info.orientationChangeTime || 500;
	this.callback = info.callback || null;
	this.callbackForInValid = info.callbackForInValid || null;

	this.viewPortIn = false;
	this.timeout = null;
	this.isValid = true;
	this.isCalledCallbackForInValid = false;

	this.scrollEventHandler = function (e) {
		var _this = this;
		var curDate = naver_corp_da.getDateString();
		this.isValid = (curDate <= this.adEndDate);

		var flagIn = this.beIntoViewPortWithRatio(this.adDiv, this.activeViewPercentage);
		var flagOut = !this.beIntoViewPortWithRatio(this.adDiv, 0.01);

		if(!this.isValid && !this.isCalledCallbackForInValid && this.callbackForInValid){ // endDate 이후, 광고 처리
			var flagInValid = this.beIntoViewPortWithRatio(this.adDiv, -6.0); // 광고 영역의 위치가 -600% 일 경우
			if(flagInValid){
				this.callbackForInValid();
				this.isCalledCallbackForInValid = true;	
			}
		}

		if(flagIn) { // viewport 안에 있을 경우
			this.viewPortIn = true; 

			if(this.timeout) return;

			this.timeout = setTimeout(function(){
				if(!_this.viewPortIn) return;

				if(_this.callback) _this.callback();

				_this.removeEventListener();
			}, this.activeViewTime);
		} 

		if(flagOut) { // viewport 밖에 있을 경우			
			this.viewPortIn = false;

			if(!this.timeout) return;

			clearTimeout(this.timeout);
			this.timeout = null;
		}
	}

	this.orientationChangeEventHandler = function (e){
		var _this = this;
		setTimeout(function(){
			_this.scrollEventHandler();
		}, this.orientationChangeTime);
	}

	this.checkActiveView = function (){
		var _this = this;
		if(AgentDetect.IS_IOS) {
			setTimeout(function(){
				_this.scrollEventHandler();	
			}, 500);
		} else {
			this.scrollEventHandler();	
		}
		
		this.addEventListener();
	}

	this.clearActiveView = function (){
		this.removeEventListener();
		clearTimeout(this.timeout);
		this.timeout = null;
	}

	this.getIsValid = function(){
		return this.isValid;
	}
};

naver_corp_da.ActiveView.prototype = {
	beIntoViewPort : function (elem){
		if(!elem) return false;

		var eH = parseInt(elem.style.height || elem.getBoundingClientRect().height || elem.offsetHeight);
		var viewportTop = window.pageYOffset;
		var viewportBottom = window.pageYOffset + window.innerHeight;
		var elemTopMargin = this.offset(elem).top - viewportTop;
		var elemBottomMargin = viewportBottom - (this.offset(elem).top + eH);
		
		var f1 = (elemTopMargin >= 0);
		var f2 = (elemBottomMargin >= 0);

		return (f1 && f2);
	},

	beIntoViewPortWithRatio : function (elem, ratio){
		if(!elem) return false;

		var ratio = (ratio) ? ratio : 1.0;
		var eH = parseInt(elem.style.height || elem.getBoundingClientRect().height || elem.offsetHeight, 10);
		var viewportTop = window.pageYOffset;
		var viewportBottom = window.pageYOffset + window.innerHeight;

		var f1 = (viewportTop <= (this.offset(elem).top + (eH*(1.0-ratio))));
		var f2 = (viewportBottom >= this.offset(elem).top + (eH*ratio));

		return (f1 && f2);
	},

	offset : function (elem){
		var docElem, win,
			box = {top: 0, left: 0},
			doc = elem && elem.ownerDocument;

		if(!doc) {
			return;
		}

		docElem = doc.documentElement;

		if(typeof elem.getBoundingClientRect !== typeof undefined){
			box = elem.getBoundingClientRect();
		}
		
		win = this.getWindow(doc);

		return {
			top: box.top + (win.pageYOffset || docElem.scrollTop) - (docElem.clientTop || 0),
			left: box.left + (win.pageXOffset || docElem.scrollLeft) - (docElem.clientLeft || 0)
		};
	},

	getWindow : function (elem){
		return (elem && (elem === elem.window)) ? elem : elem.nodeType === 9 && elem.defaultView;
	},

	removeEventListener : function (){
		if(this.scrollTarget.removeEventListener) {
			this.scrollTarget.removeEventListener('scroll', this, false);
		} else {
			this.scrollTarget.detachEvent('scroll', this, false);	
		}

		window.removeEventListener('orientationchange', this, false);
	},

	addEventListener : function (){
		if(this.scrollTarget.addEventListener) {
			this.scrollTarget.addEventListener('scroll', this, false);
		} else {
			this.scrollTarget.attachEvent('scroll', this, false);
		}

		window.addEventListener('orientationchange', this, false);
	},

	handleEvent : function (e) {
		switch (e.type) {
			case 'scroll': this.scrollEventHandler(e); break;
			case 'orientationchange': this.orientationChangeEventHandler(e); break;
		}
	}
};

naver_corp_da.activeViews = naver_corp_da.activeViews || {};

naver_corp_da.clearActiveViews = function(){
	var target = naver_corp_da.activeViews;
	for(var i in target){
		if(target.hasOwnProperty(i) && !!target[i]){
			target[i].clearActiveView();
			target[i] = null;
		}
	}
};