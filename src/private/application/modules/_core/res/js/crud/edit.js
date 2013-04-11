;
if (typeof AC ==="undefined") {AC = function(){}};
if (typeof AC.Crud ==="undefined") {AC.Crud = function(){}};

AC.Crud.Edit = function() {
	
	var infoHandler		= AC.Core.Alert.show;
	var warningHandler	= AC.Core.Alert.warning;
	var errorHandler	= AC.Core.Alert.error;
	
	var isIframe = false;
    var isDirty = false;
	
	return {
		
		init: function() {
			var self = this;
			
			isIframe = (window.location != window.parent.location);
			
			if (isIframe) {
				$('form.ACCrudEdit button.apply').hide();
			}
			
			$('form.ACCrudEdit a.cancel').click(AC.Crud.Edit.cancelHandler);
			$('form.ACCrudEdit button.save').click(AC.Crud.Edit.saveHandler);
			$('form.ACCrudEdit button.apply').click(function(e) {
				var self = this;
				AC.Crud.Edit.saveHandler.call(self, e, 'edit');
			});
			
			AC.Shortcut.add('Ctrl+S', AC.Crud.Edit.saveHandler);
			        
            // Dirty handler for form input elements
            $('form.ACCrudEdit :input').on('change', AC.Crud.Edit.setDirty);
		},
            
        setDirty: function(e) {
            $(this).parents('form.ACCrudEdit').find('.btn.cancel')
                    .text('Delete changes')
                    .addClass('btn-danger');
            isDirty = true;
            $(window).on("beforeunload", function(e) {
                if (isDirty) {
                    return 'You have unsaved changes, are you sure you want to navigate away from this page?';
                }
            });            
        },
		
		equalizeForm: function() {
			// Deprecated
		},
		
		cancelHandler: function() {
			if (isIframe) {
				parent.$.fancybox.close();
			} else {
                $(window).off("beforeunload");
				window.location.href = window.location.pathname;
			}
		},
		
		saveHandler: function(e, returnTo) {
			returnTo = typeof(returnTo) === 'undefined' ? 'list' : returnTo;
			var form = $(this).parents('form.ACCrudEdit');
			var disableOnSave = 'button.save, button.apply, button.cancel';
			
			if (!form.length) {
				form = $('form.ACCrudEdit:eq(0)');
			}
			
			// TODO: HTML5 validation, should be deprecated?
			if (form[0].checkValidity) {
				if (form[0].checkValidity() === false) {
					errorHandler(i18n.formError);
					return false;
				};
			}
			
			var options = {
				operation	: 'save',
				fromIframe	: (isIframe ? '1' : '0'),
				crudId		: form.attr('id')					
			};
			
			var url = $(form).attr('action') + "?" + $.param(options);
			var data = $(form).serialize();
			
			// clean up errors
			form.find(':input').parent().removeClass('validation_error');
			form.find('div.validation_message').remove();
			AC.Crud.Edit.equalizeForm();
			
			// Set loading state and disable submit button
			$('body').addClass('loading');
			form.find(disableOnSave).attr('disabled', 'disabled');
			
			if (typeof $(form[0]).data('onBeforeSubmit') === 'function') {
				var fn = $(form[0]).data('onBeforeSubmit');
				fn();
			}
			$.post(url, data, function(data) {		
								
				if (data.success === false) {
					
					$('body').removeClass('loading');
					form.find(disableOnSave).attr('disabled', null);
				
					if (data.errors) {
						if (typeof $(form[0]).data('onError') === 'function') {
							var fn = $(form[0]).data('onError');
							fn();
						}
						for(var i in data.errors) {
                            $input = $(':input[name=' + i + ']');
							$parent = $input.parents('.control-group');
							if (!$parent.length) {
								errorHandler('Field \'' + i + '\' has errors but is hidden');
							}
							$parent.addClass('error');
							firstError = data.errors[i][0];
							$parent.data('message', firstError);
//							$message = $('<span class="help-inline"></span>').html(firstError).hide();
//							$input.after($message.fadeIn());
							AC.Crud.Edit.equalizeForm();
						}
						$.scrollTo($('.control-group.error:first'), 800, { axis: 'y', offset: -70 });
					} else {
						errorHandler(i18n.applicationError);
					}
				} else {
                    			isDirty = false;
					if (typeof $(form[0]).data('onSave') === 'function') {
						var fn = $(form[0]).data('onSave');
						if (fn(data) === false) {
							
							$('body').removeClass('loading');
							form.find(disableOnSave).attr('disabled', null);
							
							return;
						}
					}					
					if (isIframe) {
						if (data.operation === 'save') {
							parent.AC.Crud.Edit.Multiple.editSaved(data.id, data.displayField);
						} else {
							parent.AC.Crud.Edit.Multiple.newSaved(data.id, data.displayField);
						}
					} else {
                        if (returnTo) {
                            window.location.href = window.location.pathname + '?' + returnTo + '=' + data.id;
                        } else {
                            $('body').removeClass('loading');
                            form.find(disableOnSave).attr('disabled', null);
                            AC.Core.Alert.flash('Record saved');
                        }
					}
				}
			}, 'json').error(function(jqXHR, message, exception) {
				
				$('body').removeClass('loading');
				form.find(disableOnSave).attr('disabled', null);
				
				if (typeof $(form[0]).data('onError') === 'function') {
					var fn = $(form[0]).data('onError');
					fn();
				}
				if (exception == 'Unauthorized' || exception == 'Forbidden') {
					warningHandler(i18n.forbiddenWarning);
				} else {
					errorHandler(i18n.requestError + ' (' + exception + ')');
				}
			});
			
			return false;
		}
	};
}();

$(document).ready(function() {
	AC.Crud.Edit.init();
});

/**
 * jQuery.ScrollTo - Easy element scrolling using jQuery.
 * Copyright (c) 2007-2009 Ariel Flesler - aflesler(at)gmail(dot)com | http://flesler.blogspot.com
 * Dual licensed under MIT and GPL.
 * Date: 5/25/2009
 * @author Ariel Flesler
 * @version 1.4.2
 *
 * http://flesler.blogspot.com/2007/10/jqueryscrollto.html
 */
;(function(d){var k=d.scrollTo=function(a,i,e){d(window).scrollTo(a,i,e)};k.defaults={axis:'xy',duration:parseFloat(d.fn.jquery)>=1.3?0:1};k.window=function(a){return d(window)._scrollable()};d.fn._scrollable=function(){return this.map(function(){var a=this,i=!a.nodeName||d.inArray(a.nodeName.toLowerCase(),['iframe','#document','html','body'])!=-1;if(!i)return a;var e=(a.contentWindow||a).document||a.ownerDocument||a;return d.browser.safari||e.compatMode=='BackCompat'?e.body:e.documentElement})};d.fn.scrollTo=function(n,j,b){if(typeof j=='object'){b=j;j=0}if(typeof b=='function')b={onAfter:b};if(n=='max')n=9e9;b=d.extend({},k.defaults,b);j=j||b.speed||b.duration;b.queue=b.queue&&b.axis.length>1;if(b.queue)j/=2;b.offset=p(b.offset);b.over=p(b.over);return this._scrollable().each(function(){var q=this,r=d(q),f=n,s,g={},u=r.is('html,body');switch(typeof f){case'number':case'string':if(/^([+-]=)?\d+(\.\d+)?(px|%)?$/.test(f)){f=p(f);break}f=d(f,this);case'object':if(f.is||f.style)s=(f=d(f)).offset()}d.each(b.axis.split(''),function(a,i){var e=i=='x'?'Left':'Top',h=e.toLowerCase(),c='scroll'+e,l=q[c],m=k.max(q,i);if(s){g[c]=s[h]+(u?0:l-r.offset()[h]);if(b.margin){g[c]-=parseInt(f.css('margin'+e))||0;g[c]-=parseInt(f.css('border'+e+'Width'))||0}g[c]+=b.offset[h]||0;if(b.over[h])g[c]+=f[i=='x'?'width':'height']()*b.over[h]}else{var o=f[h];g[c]=o.slice&&o.slice(-1)=='%'?parseFloat(o)/100*m:o}if(/^\d+$/.test(g[c]))g[c]=g[c]<=0?0:Math.min(g[c],m);if(!a&&b.queue){if(l!=g[c])t(b.onAfterFirst);delete g[c]}});t(b.onAfter);function t(a){r.animate(g,j,b.easing,a&&function(){a.call(this,n,b)})}}).end()};k.max=function(a,i){var e=i=='x'?'Width':'Height',h='scroll'+e;if(!d(a).is('html,body'))return a[h]-d(a)[e.toLowerCase()]();var c='client'+e,l=a.ownerDocument.documentElement,m=a.ownerDocument.body;return Math.max(l[h],m[h])-Math.min(l[c],m[c])};function p(a){return typeof a=='object'?a:{top:a,left:a}}})(jQuery);