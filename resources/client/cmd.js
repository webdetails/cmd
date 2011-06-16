function CDFMobile(jq){

  var jQuery = jq.noConflict(true),
    $ = jQuery;
  var myself = this;
  // expose our local jquery with jquerymobile to the outside world
  window["$m"] = $;

  var _dashboard = {};
  var _carousels = [];

  var _title = $("#title"),
    _navSelector = $('#navSelector'),
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
    headers+= "<script>console.log('Binding to CDF');$(window).bind('cdfLoaded',function(){cdfmobile.cdfLoaded();});</script>";
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
    myself.resizeAll();
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
  function loadDashboardList(){
    $.get("dashboardList.json",processDashboardList);
  }
  function processDashboardList(d){
    
  }
  this.loadDashboard = function(solution,path,file) {
    if (arguments.length > 0) {
      _dashboard.location = {};
      _dashboard.location.solution = solution;
      _dashboard.location.path = path;
      _dashboard.location.file = file;
    }
    $.get("/pentaho/content/pentaho-cdf-dd/Render",
      {
        solution: _dashboard.location.solution,
        path: _dashboard.location.path,
        file: _dashboard.location.file,
        absolute: true
      },
      handleRequest,"json");
  };

  this.redrawToolbar = function(buttons) {
    redrawNavBar(buttons,_toolbar);
  };

  this.redrawFiltersToolbar = function(buttons) {
    redrawNavBar(buttons,_filterToolbar);
  };
  this.resizeAll = function() {
    resizeCharts();
    for(var i = 0; i < _carousels.length;i++) {
      var car = _carousels[i];
      resizeCarousel(car.scroller);
      car.refresh();
    }
  }

  function resizeCharts(){
    
    var headerFooterPadding = $m.mobile.activePage.find('[data-role=header]').height() +
      $m.mobile.activePage.find('[data-role=footer]').height();
    var widthMult, heightMult;

    var charts = Dashboards.components.filter(function(comp){return /^ccc/.test(comp.type);});
    $.each(charts,function(i,comp){
      /* First thing first: don't even try to resize charts that haven't
       * been initialized!
       */
      if (!comp.chart) {
        return;
      }

      var $e = $("#" + comp.htmlObject + " svg"),
        e = $e[0],
      /* Next step is measuring the available space for our charts. We always
       * have the full window width available to us, but that's not the case
       * with the height, so we trim out the space we know must be reserved.
       */
        windowWidth = window.innerWidth,
        windowHeight = window.innerHeight,
        availableWidth = windowWidth - 20,
        availableHeight = windowHeight - headerFooterPadding - 150,
      /* In the name of sanity, we'd rather calculate everything relative
       * to the original sizes, rather than the last calculated size, so
       * we'll store/retrieve the original values in a data attribute.
       */
        originalHeight = $e.attr('data-originalHeight') || $e.height(),
        originalWidth = $e.attr('data-originalWidth') || $e.width();
      $e.attr('data-originalHeight',originalHeight);
      $e.attr('data-originalWidth',originalWidth);

       /* Next we calculate the ratios between original and available space.
        * To keep the original proportions, we have to multiply both axes
        * by the same ratio, so we need to pick the smallest of the two so
        * we stay within the available space
        */
      var heightRatio = availableHeight / originalHeight,
        widthRatio = availableWidth / originalWidth,
        availableRatio = heightRatio < widthRatio ? heightRatio : widthRatio,
        targetWidth = originalWidth * availableRatio,
        targetHeight = originalHeight * availableRatio;
        
      /* Finally, set the width and height to our desired values for the chart
       * object, the component and the svg. We also need to give the svg a
       * viewBox, or the svg will think we just enlarged its canvas.
       */

      comp.chart.options.width = targetWidth;
      comp.chart.options.height = targetHeight;

      comp.chartDefinition.width = targetWidth;
      comp.chartDefinition.height = targetHeight;

      e.setAttribute('width', targetWidth);
      e.setAttribute('height', targetHeight);
      e.setAttribute('viewBox', '0 0 ' + originalWidth + ' ' + originalHeight);
    });
  };

  /* The navigation pull-down menu gets its data from the loaded
   * dashboard. We expect to find a mobileNav component with a
   * navList() method that provides a listing of the dashboards
   * you can navigate to from your present location. if such a
   * component isn't found, we assume that this is a dead-end
   * dashboard and hide the navigation pull-down instead.
   */
  function updateNavigation() {
    /* First we check for the existence of the mobileNav component.
     * We check for either the bare mobileNav name, or the the
     * CDE-style render_mobileNav name.
     * If it doesn't exist, we just hide the navigation pull-down.
     */
    var navComponent = window.mobileNav || window.render_mobileNav;
    if (!navComponent) {
      _navSelector.hide();
      return;
    }
    /* 
     */
    var dashboardList = navComponent.navList();
    
  };

   /*  
    */
  function navigationCallback(event) {

  };

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

  function resizeCarousel(element) {
    var $element = (element instanceof $ ? element : $(element)),
      contentWidth = _content.innerWidth();
      totalWidth = 0,
      count = 0;

    $(element).find("li.cdfCarouselItem").each(function(i,e){
      count += 1;
      var $e = $(e);
      $e.width(contentWidth);
      totalWidth+=$e.outerWidth(true);
      //contentHeight =  $e.height() > contentHeight ? $e.height() : contentHeight;
    });
    $element.width(totalWidth);
    $element.find("ul.cdfCarousel").width(totalWidth);

    return count;
  };

  function createCarousel(element) {
    var $element =  $(element),
      $container =$("<div class='cdfCarouselContainer'></div>").insertBefore($element),
      count = 0;
    
    count = resizeCarousel($element);
    $element.appendTo($container);
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

  this.cdfLoaded = function() {
    console.log('cdf-m caught cdf loading');
    this.resizeAll();
  }
}
$(function(){
  var parameters = {};
  $.each(location.search.slice(1).split('&').map(function(e){return e.split('=')}),function(i,e){parameters[e[0]] = e[1]}); 
  window.cdfmobile = new CDFMobile(jQuery);
  cdfmobile.redrawToolbar([
//    {
//      label: "Favorites",
//      icon: "star",
//      callback: cdfmobile.favorites
//    },
//    {
//      label: "Settings",
//      icon: "gear",
//      callback: cdfmobile.settings
//    },
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
//    {
//      label: "Cancel",
//      icon: "delete",
//      callback: cdfmobile.filtersCancel,
//    },
    {
//      label: "Ok",
      label: "Done", 
      icon: "check",
      callback: cdfmobile.filtersOk,
    }
  ]);
  $m(window).bind ('cdfLoaded',function(){console.log('cdf finished loading');cdfmobile.ResizeAll();});
  setTimeout(function(){cdfmobile.loadDashboard(parameters.solution,parameters.path,parameters.file);},20);
  $m(window).bind('resize', cdfmobile.resizeAll);
});
