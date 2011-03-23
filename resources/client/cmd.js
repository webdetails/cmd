function CDFMobile(jq){

  var jQuery = jq.noConflict(true),
    $ = jQuery;
  var myself = this;
  var _scrollController = new iScroll('cdfmContent');

  var _dashboard = {};

  var _title = $("#title"),
    _scriptHolder = $("#scriptHolder"),
    _content = $("#cdfmContent"),
    _staging = $("#placeholder"),
    _scroller = $("#scroller"),
    _toolbar = $("#toolbar");


    document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);

  function handleRequest(data){
    _dashboard.title = data.meta.title;
    _dashboard.headers = data.headers;
    _dashboard.content = data.content;
    redrawDashboard();
  };

  function redrawDashboard() {
    _title.text(_dashboard.title);
    _scriptHolder.html(_dashboard.headers);
    _staging.html(_dashboard.content);
    _scroller.empty().append(_staging.children());
    _scrollController.refresh();
  };

  function handleClick(callback) {
    return function(ev) {
      callback.call(myself);
      ev.stopPropagation();
    };
  }
  this.loadDashboard = function(solution,path,file) {
    _dashboard.location = {};
    _dashboard.location.solution = solution;
    _dashboard.location.path = path;
    _dashboard.location.file = file;
    $.get("dashboard.json", {solution: solution, path: path, file: file, absolute: true}, handleRequest,"json");
  }

  this.redrawToolbar = function(buttons) {
    if (buttons.length) {
      var toolbar = $("<ul></ul>"),
        buttonWidth = Math.round(10000 / buttons.length) / 100;
      for(b in buttons) if (buttons.hasOwnProperty(b)) {
        var bdata = buttons[b];
        var button = $("<li>").appendTo(toolbar);
        var link = $("<a></a>").appendTo(button);
        link.attr("data-icon",bdata.icon);
        link.text(bdata.label);
        link.click(handleClick(bdata.callback));
      }
      toolbar.appendTo($("<div data-role='navbar'></div>").appendTo(_toolbar.empty()));
     recalculateContentHeight();
      _scrollController.refresh();
    }
  };

  function recalculateContentHeight() {
    var padding = parseInt(_content.parent().css('padding-top').match(/[0-9]+/)[0],10) +
      parseInt(_content.parent().css('padding-bottom').match(/[0-9]+/)[0],10);
    var height = window.innerHeight - (padding + _title.parent().outerHeight() + _toolbar.outerHeight());
    _content.height(height);
  };

  this.refresh = function() {
    console.log("Refreshing");
    this.loadDashboard();
  };

  this.favorites = function() {
    console.log("Adding to favorites");
  };

  this.filters = function() {
    console.log("Showing filters");
  };

  this.settings = function() {
    console.log("Customizing settings");
  }
}

$(function(){
  window.cdfmobile = new CDFMobile(jQuery);
  cdfmobile.loadDashboard("Eco","","ccc-test.wcdf");
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
      icon: "gear",
      callback: cdfmobile.filters
    },
    {
      label: "Refresh",
      icon: "refresh",
      callback: cdfmobile.refresh
    }
  ]);
});
