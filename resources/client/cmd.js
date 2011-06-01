function CDFMobile(jq){

  var jQuery = jq.noConflict(true),
    $ = jQuery;
  var myself = this;
  window["$m"] = $;
  //var _scrollController = new iScroll('cmdContent');
  //var _filterScrollerController = new iScroll('filtersScroller');

  var _dashboard = {};
  var _carousels = [];

  var _title = $("#title"),
    _scriptHolder = $("#scriptHolder"),
    _staging = $("#placeholder"),
    _content = $('#cmdContent'),
    _dashboard = $("#dashboard"),
    _toolbar = $("#toolbar"),
    _filters = $("#filtersPanel"),
    _filtersContent = $("#filtersContent"),
    _innerFilters = $("#innerFilters"),
    _filterToolbar = $("#filtersActions");

  var _jqmTheme = 'a';

  function commonHeaders() {
    var headers = "<script type='text/javascript' src='lib/componentOverrides.js'></script>";
    return headers;
  }
  function handleRequest(data){
    _dashboard.meta = data.metadata;
    _dashboard.headers = data.headers;
    _dashboard.content = data.content;
    redrawDashboard();
  };

  function redrawDashboard() {
    _title.text(_dashboard.meta.title);
    _scriptHolder.html(_dashboard.headers + commonHeaders());
    _staging.html(_dashboard.content);
    _innerFilters.empty().append($(_dashboard.meta.filters));
    _dashboard.empty().append(_staging.children());
    reloadCarousels();
  };

  function captureClick(callback) {
    return function(ev) {
      callback.call(myself);
      ev.stopPropagation();
    };
  }

  function handleClick(callback) {
    return function(ev) {
      callback.call(myself);
    };
  }
  
  this.loadDashboard = function(solution,path,file) {
    if (arguments.length > 0) {
      _dashboard.location = {};
      _dashboard.location.solution = solution;
      _dashboard.location.path = path;
      _dashboard.location.file = file;
    }
    $.get("/pentaho/content/pentaho-cdf-dd/Render", {solution: _dashboard.location.solution, path: _dashboard.location.path, file: _dashboard.location.file, absolute: true}, handleRequest,"json");
  };

  this.redrawToolbar = function(buttons) {
    redrawNavBar(buttons,_toolbar);
  };

  this.redrawFiltersToolbar = function(buttons) {
    redrawNavBar(buttons,_filterToolbar);
  }

  function redrawNavBar(buttons,loc) {
    if (buttons.length) {
      var toolbar = $("<ul></ul>"),
        buttonWidth = Math.round(10000 / buttons.length) / 100;
      for(b in buttons) if (buttons.hasOwnProperty(b)) {
        var bdata = buttons[b];
        var button = $("<li>").appendTo(toolbar);
        var link = $("<a></a>").appendTo(button);
        link.attr("data-icon",bdata.icon);
        if(bdata.location){
          link.attr("href", bdata.location);
          link.click(handleClick(bdata.callback));
        } else if(bdata.rel){
          link.attr("data-rel", bdata.rel);
          link.click(handleClick(bdata.callback));
        } else {
          link.click(captureClick(bdata.callback));
        }
        if(bdata.transition){
          link.attr("data-transition", bdata.transition);
        }

        link.text(bdata.label);
      }
      $("<div data-role='navbar'></div>").append(toolbar).appendTo(loc.empty());
    }
  };

  function recalculateHeight(content,title,toolbar) {
    var padding = parseInt(content.parent().css('padding-top').match(/[0-9]+/)[0],10) +
      parseInt(content.parent().css('padding-bottom').match(/[0-9]+/)[0],10);
    var height = window.innerHeight - (padding + title.parent().outerHeight() + toolbar.outerHeight());
    content.height(height);
  };

  function showFilters() {
    
  };

  function reloadCarousels() {
    _carousels.length = 0;
    $('.cdfCarouselHolder').each(function(i,e){
      _carousels.push(createCarousel(e));
    });
  };

  function createCarousel(element) {
    var $element =  $(element),
      $container =$("<div class='cdfCarouselContainer'></div>").insertBefore($element),
      contentWidth = _content.innerWidth();
      contentHeight = 0;
      totalWidth = 0,
      count = 0;
    
    $(element).find("li.cdfCarouselItem").each(function(i,e){
      count += 1;
      var $e = $(e);
      $e.width(contentWidth);
      totalWidth+=$e.outerWidth(true);
      //contentHeight =  $e.height() > contentHeight ? $e.height() : contentHeight;
    });
    $element.appendTo($container);
    $element.width(totalWidth);
    $element.find("ul.cdfCarousel").width(totalWidth);
    var scroller = new iScroll($container[0], {
      snap: true,
      momentum: false,
      hScrollbar: false,
      onScrollEnd: function () {
        $container.find('div.status div.active').removeClass('active');
        $container.find('div.status div:nth-child(' + (this.currPageX+1) + ')').addClass('active');
      }
    });
    createCarouselStatus($container,count,scroller);
    return scroller;
  }

  function createCarouselStatus($placeholder,count,scroller){
    var $status = $("<div class='outerStatus'>");

    for (var i = 0; i < count;i++){
      $status.append("<div class='statusBullet" + (i === 0 ? " active" : "") + "'>&nbsp</li>");
    }
    $status.wrapInner("<div class='status'>");
    $placeholder.append($status);
    $("<div class='nav prev'>&nbsp</div>").prependTo($status).click(function(){
      scroller.scrollToPage('prev', 0);
      return false;
    });
    $("<div class='nav next'>&nbsp</div>").appendTo($status).click(function(){
      scroller.scrollToPage('next', 0);
      return false;
    });
  };

  this.refresh = function() {
    console.log("Refreshing");
    this.loadDashboard();
  };

  this.favorites = function() {
    console.log("Adding to favorites");
  };

  this.filters = function() {
  };

  this.settings = function() {
    console.log("Customizing settings");
  };

  this.filtersOk = function() {
    console.log(jQuery.mobile);
    console.log("Accepting Filters");
    history.back();
  };

  this.filtersCancel = function() {
    console.log("Rejecting Filters");
    history.back();
  };
  this.refreshSelector = function(component) {
    $("#" + component.htmlObject + " select").attr('data-theme',_jqmTheme).selectmenu();
  }
}
$(function(){
  var parameters = {};
  $.each(location.search.slice(1).split('&').map(function(e){return e.split('=')}),function(i,e){parameters[e[0]] = e[1]}); 
  window.cdfmobile = new CDFMobile(jQuery);
  cdfmobile.redrawToolbar([
    {
      label: "Favorites",
      icon: "star",
      callback: cdfmobile.favorites
    },
    {
      label: "Settings",
      icon: "gear",
      callback: cdfmobile.settings
    },
    {
      label: "Filters",
      icon: "search",
      location: "#filtersPanel",
      transition: "flip",
      callback: cdfmobile.filters
    },
    {
      label: "Refresh",
      icon: "refresh",
      callback: cdfmobile.refresh
    }
  ]);
  cdfmobile.redrawFiltersToolbar([
    {
      label: "Cancel",
      icon: "delete",
      callback: cdfmobile.filtersCancel,
    },
    {
      label: "Ok",
      icon: "check",
      callback: cdfmobile.filtersOk,
    }
  ]);
  setTimeout(function(){cdfmobile.loadDashboard(parameters.solution,parameters.path,parameters.file);},20);
});
