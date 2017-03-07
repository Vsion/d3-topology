/**
* @name jquery.hhdata.dialog.js
* @author gpx
* @version 1.1.1
* @lastUpdate 2016-04-16
* @copyright hhdata
**/
(function($){
	var ICON_MAP = {
		"failure": 5, //(失败)
		"success": 9, //(成功)
		"warning": 7, //(警示)
		"enquire": 4, //(询问)
		"error": 5, //(错误)
		"": -1 //无
	};
	var _return = function(layerIdx){
	    return {
	        close : function(){//关闭弹窗
	            layer.close(layerIdx);
	        },
	        setZindex : function(zIdx){//设置弹窗层级 add by hbf 2016/04/16
	            layer.setZindex(layerIdx,zIdx);
	        }
	    }
	}

	$.extend({
		dialog:{
			/*模态弹出框，弹出内容为文本,非异步传输内容*/
			basicsDialog:function(option){
				var setting = { //默认参数
						offset: ["auto", "auto"],
						area: ["auto","auto"],
						title: "",
						content: "",
						icon: "",
						shade: true,
						shadeClose: false,
						maxmin: true,
						closeBtn: true,
						btn: [{text: "确定", type: "yes", close: true, validation: false, fn:function(){}}],  //{text: "", type:"yes/no", close:false, fn:function(dialogDom){} }

						onloaded: function(dialogDom){},//---------------success
						onclosed:function(dialogDom){},
						onmoveEnd: function(dialogDom){},

						min: function(dialogDom){},
						full: function(dialogDom){},
						restore: function(dialogDom){}
				}

				var opt = $.extend(setting,option);

				var optHelper = {
					getHtmlParam: function() { //拼对话框的html结构
						var iconStr = "";
						if(ICON_MAP[opt.icon] !== -1){
							htmlStr = '<span class="xubox_msg xulayer_png32 xubox_msgico xubox_msgtype'
													+ ICON_MAP[opt.icon]
												+'" style="top: 11px"></span>'
											+ '<span class="xubox_msg xubox_text" style="padding-top: 10px;">'
												+	opt.content
											+ "</span>"
						}else{
							htmlStr = '<span class="xubox_msg xubox_text" style="padding-top: 10px; padding-left: 10px">'
												+	opt.content
											+ "</span>"
						}

						return htmlStr;
					},
					getBtnParam: function() {
						var defaultBtn = {text: "确定", type: "yes",validation:false, close: true, fn:function(){}};

						for(var i = 0; i < opt.btn.length; i++){
							opt.btn[i] = $.extend({}, defaultBtn, opt.btn[i]);
						}

						return opt.btn;
					}
				}

				var param = { //最终参数
					type: 1,
					offset: [opt.offset[1] === "auto" ? "": opt.offset[1].toString()+ "px",
									 opt.offset[0] === "auto" ? "": opt.offset[0].toString()+ "px"],
					area: [opt.area[0] === "auto" ? "auto" : opt.area[0].toString() + "px",
								 opt.area[1] === "auto" ? "auto" : opt.area[1].toString() + "px"],
					title: opt.title || " ",
					page:{
						html: optHelper.getHtmlParam(),
					},
					maxWidth: $(window).width() * 0.9,
					maxmin: opt.maxmin,
					shade: opt.shade? [0.5, '#474747']: [0],
					shadeClose: opt.shadeClose,
					closeBtn: [0, opt.closeBtn],
					btn: optHelper.getBtnParam(),//{text: "", type:"yes/no", close:false, fn:function(dialogDom){} }
					success: function(dialogDom){
						opt.onloaded(dialogDom);
					},
					end: function(){
						opt.onclosed();
					},

					moveEnd: function(dialogDom){
						opt.onmoveEnd(dialogDom);
					},
					min: opt.min,
					full: opt.full,
					restore: opt.restore
				};
				var layerIdx = $.layer(param);
				return _return(layerIdx);
			},

			/*模态弹出框，弹出内容为页面($.post方式获取)*/
			pageDialog:function(option){
				var setting = { //默认参数
						offset: ["auto","auto"],
						area: [600, 500],
						title: "",
						url: "",
						shade: true,
						shadeClose: false,
						maxmin: true,
						closeBtn: true,
						isShowLoading:true,
						btn: [{text: "确定", type: "yes", close: true, validation: false, fn:function(){}}], //{text: "", type:"yes/no", close:false, fn:function(dialogDom){} }

						onloaded: function(dialogDom, xhrRes){},//---------------success
						onclosed:function(dialogDom){},
						onmoveEnd: function(dialogDom){},

						min: function(dialogDom){},
						full: function(dialogDom){},
						restore: function(dialogDom){}
				}

				var opt = $.extend({}, setting, option);

				var optHelper = {
					getBtnParam: function() {
						var defaultBtn = {text: "确定", type: "yes", validation: false, close: true, fn:function(dialogDom){}};
						for(var i = 0; i < opt.btn.length; i++){ //遍历按钮
							opt.btn[i] = $.extend({}, defaultBtn, opt.btn[i]);
						}
						return opt.btn;
					}
				};

				var param = { //最终参数
					type: 1,
					offset: [opt.offset[1] === "auto" ? "": opt.offset[1].toString()+ "px",
									 opt.offset[0] === "auto" ? "": opt.offset[0].toString()+ "px"],
					area: [opt.area[0] === "auto" ? setting.area[0] : opt.area[0].toString() + "px",
								opt.area[1] === "auto" ? setting.area[1] : opt.area[1].toString() + "px"],
					title: opt.title || " ",
					page:{
						url: opt.url,
						ok: function(dialogDom, xhrRes){
							opt.onloaded(dialogDom, xhrRes);
						}
					},
					maxmin: opt.maxmin,
					shade: opt.shade? [0.5, '#474747']: [0],
					shadeClose: opt.shadeClose,
					closeBtn: [0, opt.closeBtn],
					btn: optHelper.getBtnParam(), //{text: "", type:"yes/no", close:false, fn:function(dialogDom){} }

					end: function(){
						opt.onclosed();
					},

					moveEnd: function(dialogDom){
						opt.onmoveEnd(dialogDom);
					},
					min: opt.min,
					full: opt.full,
					restore: opt.restore
				};
				if(opt.isShowLoading){
					var Pace = window.Pace;
					!!Pace && Pace.restart({target:'.xubox_page'})
				}
				var layerIdx = $.layer(param);
				return _return(layerIdx);
			},

			/*文字弹出框，弹出提示信息*/
			msgDialog: function(option, option2, option3){
				var setting = { //默认参数
						msg: "",
						time: 2,
						icon: "",
						end: function(){console.log("aaaa")}
				};

				var opt = $.extend({}, setting, option);

				if(typeof option !== "object"){
					opt.msg = option;
					opt.time = typeof option2 === "number" && option2 || 2;
					opt.icon = typeof option3 === "string" && option3 || typeof option2 === "string" && option2 || "";
				}

				var layerIdx = layer.msg(opt.msg, opt.time, ICON_MAP[opt.icon], opt.end);
				return _return(layerIdx);
			}
		}
	});
})(jQuery)
