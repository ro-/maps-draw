define(
    ['jquery', './io', 'dialogform', 'jcookie', 'tinypubsub', 'imagedropdown'],
    function ($, io, dialogform) {

        var render = {};
        var _controlsContainer = null;
        var _browserFullscreen = false; //enables browser specific full screen in expanded mode
        var _enableEditMode = false;
        var _enableExpandMapMode = false;
        
        //lists
        var farmList = $("<select id='farmList'></select>");
        var farmSection = $("<div class='section'></div>");
        var paddockList = $("<select id='paddockList'></select>");
        var paddockSection = $("<div class='section'></div>");
        var yearList = $("<select id='yearList'></select>");
        var yearSection = $("<div class='section'></div>");
        var seasonList = $("<select id='seasonList'></select>");
        var seasonSection = $("<div class='section'></div>");
            
        //buttons
        var mapsContainer = $("<div class='maps-container'></div>");
        var mapsHeader = $("<div class='maps-header'></div>");
        var collapseBtn = $("<a class='collapse'></a>");
        var mapsWrapper = $("<div class='maps-wrapper'></div>");
        var editSection = $("<div class='maps-editor'></div>");
        var canvas = $("<div id='map_canvas'></div>");
        
        dialogform.init();
        
        render.Init = function (container, enableEditMode, enableExpandMapMode) {
            _controlsContainer = $(container);
            _enableEditMode = enableEditMode;
            _enableExpandMapMode = enableEditMode || enableExpandMapMode; //if edit enabled then expand is allowed
            
            $.subscribe("/paddock/selected", paddockSelected);
            $.subscribe("/storage/selected", storageSelected);
            $.subscribe("/editor/modeChanged", editorModeChanged);
            $.subscribe("/editor/shapeCompleted", editorShapeCompleted);
            
            return render.Controls();
        };
        
        render.Controls = function () {
            
            //init layout
            if (_enableExpandMapMode) expandMapControls();
            if (_enableEditMode) editingControls();
            minimisedView();

            mapsWrapper.append(canvas);

            //normal map view
            mapsContainer.append(mapsHeader);
            mapsContainer.append(mapsWrapper);
            _controlsContainer.append(mapsContainer);


            //lists
            farmSection.append("<h1>Farm</h1>");
            farmSection.append(farmList);
            paddockSection.append("<h1>Paddock</h1>");
            paddockSection.append(paddockList);
            yearSection.append("<h1>Production Year</h1>");
            yearSection.append(yearList);
            seasonSection.append("<h1>Season</h1>");
            seasonSection.append(seasonList);

            mapsHeader.append(farmSection);
            mapsHeader.append(paddockSection);
            mapsHeader.append(yearSection);
            mapsHeader.append(seasonSection);

            //set config
            bindChangeEvents();

            return canvas;
        };

        render.FarmList = function (model) {
            farmList.empty();

            if (model == null || model.length == 0) {
                //no farms so hide controls
                farmList.parent().hide();
            } else {

                $.each(model, function () {

                    var option = $("<option />").val(this.FarmId).text(this.Name);
                    var staticUrl = "http://maps.googleapis.com/maps/api/staticmap?path=color:0x66b9ffff|weight:1|fillcolor:0x66b9ff40|";
                    var otherInfo = "";
                    var i;

                    var points = new Array();

                    if (this.Boundary != null) {
                        for (i = 0; i < this.Boundary.length; i++) {
                            points.push([parseFloat(this.Boundary[i].Latitude).toFixed(4), parseFloat(this.Boundary[i].Longitude).toFixed(4)]);
                        }
                    }

                    staticUrl += "enc:" + createEncodings(points);
                    staticUrl += "&size=80x80&sensor=false&maptype=satellite";

                    if (this.ReportsUnfinished > 0) {
                        otherInfo += "<b>New Reports:</b> " + this.ReportsUnfinished + "<br/>";
                    }

                    otherInfo += "Arable Area: " + roundValue(this.ArableArea, 1) + " ha<br/>";
                    otherInfo += "Paddocks: " + this.PaddocksCount + "</br>";
                    otherInfo += "Storages: " + this.StorageCount + "</br>";

                    //extra parameters for image list
                    option.attr("data-img", staticUrl);
                    option.attr("data-info", otherInfo);

                    if (this.Selected == true) {
                        option.attr('selected', 'selected');
                    }
                    
                    farmList.append(option);
                    
                    //if (module.ShowFarmsNoBoundary == true || this.PaddocksCount > 0) {
                        
                    //}
                });

                //enhance the list
                if (jQuery().imagedropdownlist) farmList.imagedropdownlist();
                farmList.parent().show();
                
                $.publish("/farm/selected", [farmList.val()]);
            }
        };
        
        render.PaddockList = function (model) {
            
            paddockList.empty();

            if (model == null || model.length == 0) {
                //no paddocks so hide controls
                paddockList.parent().hide();
            } else {

                $.each(model, function () {

                    var option = $("<option />").val(this.PaddockId).text(this.Name);
                    var staticUrl = "http://maps.googleapis.com/maps/api/staticmap?path=color:0xd1ff31ff|weight:1|fillcolor:0xd1ff3140|";
                    var otherInfo = "";
                    var i;
                    var points = new Array();

                    if (this.Boundary != null) {
                        for (i = 0; i < this.Boundary.length; i++) {
                            points.push([parseFloat(this.Boundary[i].Latitude).toFixed(4), parseFloat(this.Boundary[i].Longitude).toFixed(4)]);
                        }
                    }
                    staticUrl += "enc:" + createEncodings(points);
                    staticUrl += "&size=60x60&sensor=false&maptype=satellite";
                    otherInfo += "Arable Area: " + roundValue(this.ArableArea, 1) + " ha<br/>";

                    //extra parameters for image list
                    option.attr("data-img", staticUrl);
                    option.attr("data-info", otherInfo);

                    if (this.Selected == true) {
                        option.attr('selected', 'selected');
                    }

                    paddockList.append(option);
                });

                //enhance the list
                if (jQuery().imagedropdownlist) paddockList.imagedropdownlist();
                paddockList.parent().show();

                $.publish("/paddock/selected", [farmList.val(), paddockList.val()]);
            }
        };
        
        render.YearList = function (model) {
            yearList.empty();

            if (model == null || model.length == 0) {
                yearList.parent().hide();
                
            } else {

                $.each(model, function () {
                    var option = $("<option />").val(this.Value).text(this.Text);
                    yearList.append(option);

                    //var url = "http://chart.googleapis.com/chart?cht=bhs&chs=150x30&chd=t:50&chds=0,100&chbh=a&chxt=x&chf=b0,lg,0,66b9ff,0,0063a7,1|bg,s,00000000&chxs=0N**%,666666,10";
                    //option.attr("data-img", url);
                    //option.attr("data-img-pos", "right"); //put image on right side

                    if (this.Selected == true) {
                        yearList.children("option[value=" + this.Value + "]").attr('selected', 'selected');
                    }
                });

                //enhance the list
                if (jQuery().imagedropdownlist) yearList.imagedropdownlist(true);
                yearList.parent().show();

                $.publish("/year/selected", [yearList.val()]);
            }
        };

        render.SeasonList = function (model) {
            seasonList.empty();

            if (model == null || model.length == 0) {
                seasonList.parent().hide();
                
            } else {

                $.each(model, function () {
                    seasonList.append($("<option />").val(this.Value).text(this.Text));

                    if (this.Selected == true) {
                        seasonList.children("option[value=" + this.Value + "]").attr('selected', 'selected');
                    }
                });
                
                //enhance the list
                if (jQuery().imagedropdownlist) seasonList.imagedropdownlist(true);
                seasonList.parent().show();
                var selectedSeasonText = seasonList.children('option:selected').text();
                $.publish("/season/selected", [seasonList.val(), selectedSeasonText]);
            }
        };
        
        render.AccountArea = function(result) {
            if (result.UnrestrictedArea) {
                $("#account_area_status").html("");
            } else {
                $("#account_area_status").html("Account area used: " + roundValue(result.AreaUsed, 0) + " / " + roundValue(result.AreaTotal, 0) + "ha");
            }
        };
        
        function minimisedView() {
            //minimised map view
            mapsHeader.append(collapseBtn);

            collapseBtn.append("<div class='icon-collapse'></div>");

            collapseBtn.click(function () {
                if (collapseBtn.hasClass("collapsed")) {
                    collapseBtn.removeClass("collapsed");
                    mapsWrapper.slideDown(function () {
                        $.publish("/usercontrols/mapResized");
                    });
                    $.cookie('controls_minimised', 'false', { expires: 3650, path: '/' });


                } else {
                    collapseBtn.addClass("collapsed");
                    mapsWrapper.slideUp();
                    $.cookie('controls_minimised', 'true', { expires: 3650, path: '/' });
                }
            });

            //check if minimised set in cookie at init
            if ($.cookie('controls_minimised') != null && $.cookie('controls_minimised') == "true") {
                collapseBtn.addClass("collapsed");
                mapsWrapper.hide();
            }
        }

        function bindChangeEvents() {
            farmList.parent().hide();
            paddockList.parent().hide();
            yearList.parent().hide();
            seasonList.parent().hide();

            farmList.change(function () {
                $.publish("/farm/selected", [farmList.val()]);
            });

            paddockList.change(function () {
                $.publish("/paddock/selected", [farmList.val(), paddockList.val()]);
            });

            yearList.change(function () {
                $.publish("/year/selected", [yearList.val()]);
            });

            seasonList.change(function () {
                $.publish("/season/selected", [seasonList.val()]);
            });
        }
        
        function expandMapControls() {
            
            var expandButton = $("<div class='maps-expand' title='View Full Screen'></div>");
            mapsWrapper.append(expandButton);

            expandButton.click(function () {
                if (!expandButton.hasClass("expanded")) {
                    expandButton.addClass("expanded");
                    
                    //move container
                    $("body").css({ overflow: "hidden" }).append(mapsContainer);
                    mapsContainer.toggleClass("fullscreen");
                    mapsWrapper.css({
                        height: $(window).height() - mapsHeader.outerHeight()
                    });

                    //show edit controls
                    if (_enableEditMode) {
                        $.publish("/editor/start");
                        editSection.show();
                    }
                    collapseBtn.hide();

                    $(window).bind("resize.controls", function () {
                        mapsWrapper.height($(window).height() - mapsHeader.outerHeight());
                        //resize legend
                        resizeLegend(true);
                    });

                    //resize legend
                    resizeLegend(true);

                    //html5 fullscreen 
                    if (_browserFullscreen) runPrefixMethod($("body")[0], "RequestFullScreen");

                    //bind escape
                    $(document).one("keydown.controls", function (e) {
                        if (e.which == 27 && mapsWrapper.hasClass("fullscreen")) {
                            expandButton.click();
                        }
                    });

                    $(".dom-feedback-button").hide();

                    $.publish("/usercontrols/mapResized");
                }
                else {
                    expandButton.removeClass("expanded");
                    
                    //move container
                    $("body").css({ overflow: "", position: "" });
                    _controlsContainer.append(mapsContainer);
                    mapsContainer.toggleClass("fullscreen");
                    mapsWrapper.css({ height: "" });
                    
                    //show edit controls
                    if (_enableEditMode) {
                        $.publish("/editor/stop");
                        editSection.hide();
                    }
                    collapseBtn.show();
                    
                    $(window).unbind("resize.controls");
                    $(window).unbind("keydown.controls");
                    

                    //resize legend
                    resizeLegend(false);

                    //html5 fullscreen 
                    if (_browserFullscreen) runPrefixMethod(document, "CancelFullScreen");

                    $(".dom-feedback-button").show();
                    
                    $.publish("/usercontrols/mapResized");
                }
            });

            $("#btnExitFullscreen").click(function () { expandButton.click(); });

            /*$(document).bind("fullscreenchange mozfullscreenchange webkitfullscreenchange", function () {
                var isFullScreen = runPrefixMethod(document, "FullScreen") || runPrefixMethod(document, "IsFullScreen");
                if (!isFullScreen) {
                    if (mw.hasClass("fullscreen")) {
                        mapSizer.click();
                    }
                } else {

        }
            });*/
        }
        
        function editingControls() {

            var farmDetails = $('<a id="btnFarmDetails" class="dialogLink SelectLinkButton" data-dialog-title="Farm Details" href="/Farm/Details">Details</a>');
            var farmEdit = $('<a id="btnFarmEdit" class="EditLinkButton">Edit</a>');
            var farmDelete = $('<a id="btnFarmDelete" class="DeleteLinkButton">Delete</a>');
            var farmAdd = $('<a id="btnFarmAdd" class="AddLinkButton">New Farm</a>');

            editSection.append(farmDetails);
            editSection.append(farmEdit);
            editSection.append(farmDelete);
            editSection.append(farmAdd);
            editSection.hide();
            mapsHeader.append(editSection);

            shapeControls();
        }
       
        //var areaLabel = $('<h5><span id="account_area_status"></span></h5>');
            
        var drawControls = $('<div class="map-draw-controls map-editor-row"></div>');
        var btnBrowse = $('<a id="draw-browse" class="map-btn icon hand"></a>');
        var btnPaddock = $('<a id="draw-paddock" class="map-btn icon polygon keyline-left" title="Draw Paddock">Paddock</a>');
        var btnStorage = $('<a id="draw-storage" class="map-btn icon circle keyline-left" title="Draw Storage Facility">Storage</a>');
        var btnOther = $('<a id="draw-other" class="map-btn icon polyline keyline-left" title="Draw Other Features">Other</a>');
        var btnMenu = $('<a id="draw-menu" class="map-btn icon menu keyline-left"></a>');
        var btnSearch = $('<a id="draw-search" class="map-btn icon search keyline-left" title="Search"></a>');
        var btnHome = $('<a id="draw-home" class="map-btn icon home keyline-left" title="Home"></a>');
        
        var searchRow = $('<div class="map-draw-search map-editor-row"></div>');
        var inputSearch = $('<input id="search" class="single" type="text" placeholder="123 Fake St, MyCity" title="Search" />');
        var btnRunSearch = $('<a id="search" class="map-btn pin-right loud icon search" title="Search">Search</a>');

        var layersRow = $('<div class="map-draw-layers map-editor-row"></div>');
        var layersText = $('<span class="icon info">Toggle visibility of layers.</span>');
        var btnPaddockToggle = $('<a class="map-btn icon polygon active" >Toggle Paddock Layer</a>');
        var btnStorageToggle = $('<a class="map-btn icon circle active" >Toggle Storage Layer</a>');
        
        var help = $('<div class="map-draw-help map-editor-row"></div>');
        var helpText = $('<span class="icon info">Click last point to finish the line.</span>');
        var btnCancel = $('<a id="cancel-tip" class="map-btn pin-right quiet icon close" title="Cancel">Cancel</a>');

        var saveRow = $('<div class="map-draw-save map-editor-row big"></div>');
        var dataForm = $('<div id="draw-data-form" class="map-draw-form"></div>');
        var saveButtons = $('<div class="pin-right"></div>');
        var btnSave = $('<a id="draw-save" class="map-btn loud icon save" title="Save">Save</a>');
        var btnDelete = $('<a id="draw-delete" class="map-btn quiet icon trash" title="Delete"></a>');
        
        
        function shapeControls() {
            
            editSection.children().hide();
            
            drawControls.append(btnBrowse);
            drawControls.append(btnPaddock);
            drawControls.append(btnStorage);
            drawControls.append(btnOther);
            drawControls.append(btnSearch);
            drawControls.append(btnHome);
            drawControls.append(btnMenu);
            editSection.append(drawControls);
            
            //search
            searchRow.append(inputSearch);
            searchRow.append(btnRunSearch);
            searchRow.hide();
            editSection.append(searchRow);
            
            //layers
            layersRow.append(layersText);
            layersRow.append(btnPaddockToggle);
            layersRow.append(btnStorageToggle);
            layersRow.hide();
            editSection.append(layersRow);
            
            //help
            help.append(helpText).append(btnCancel);
            help.hide();
            editSection.append(help);

            //save
            saveButtons.append(btnSave);
            saveButtons.append(btnDelete);
            saveRow.append(dataForm);
            saveRow.append(saveButtons);
            saveRow.hide();
            editSection.append(saveRow);
            
            /*btnSave.click(function () {
                $.publish("/shape/save");
            });*/
                        
            btnBrowse.click(function () {
                $.publish("/shape/cancel");
            });
            
            btnCancel.click(function () {
                $.publish("/shape/cancel");
            });
            
            btnDelete.click(function () {
                $.publish("/shape/delete");
            });
            
            btnPaddock.click(function () {
                $.publish("/shape/addPaddock");
            });
            
            btnStorage.click(function () {
                $.publish("/shape/addStorage");
            });

            btnSearch.click(function() {
                //show search
                btnSearch.toggleClass("dark");
                searchRow.animate({ opacity: 'toggle', height: 'toggle' }, 200);
                inputSearch.focus();
            });
            
            var runSearchEvent = function() {
                //run search
                $.publish("/usercontrols/search", [inputSearch.val(),
                    function (results, status) {
                        btnSearch.removeClass("dark");
                        searchRow.animate({ opacity: 'hide', height: 'hide' }, 200);
                        inputSearch.val("");
                    },
                    function(results, status) {
                        alert("Geocode was not successful for the following reason: " + status);
                    }]);
            };
            
            inputSearch.keypress(function (event) {
                if (event.which == 13) {
                    runSearchEvent();
                }
            });
            
            btnRunSearch.click(function () {
                runSearchEvent();
            });
            
            btnMenu.click(function () {
                //show search
                btnMenu.toggleClass("dark");
                layersRow.animate({ opacity: 'toggle', height: 'toggle' }, 200);
            });
            
            btnPaddockToggle.click(function () {
                //show search
                btnPaddockToggle.toggleClass("active");
                $.publish("/usercontrols/togglecategory", ["Paddock"]);
            });
            
            btnStorageToggle.click(function () {
                //show search
                btnStorageToggle.toggleClass("active");
                $.publish("/usercontrols/togglecategory", ["Storage"]);
            });
            
            
            btnHome.click(function () {
                //show search
                $.publish("/usercontrols/viewhome");
            });
        }
        
        function paddockSelected(e, farmId, paddockId) {
            paddockList.val(paddockId);
        }
        
        function storageSelected(e, storageId) {
            //alert("storage selected: " + storageId);
        }
        
        function editorModeChanged(e, view, shape) {
            var opts = shape ? shape.GetOptions(): null;
            
            console.log("editorModeChanged: " + view + " category:" + (opts ? opts.category : " null"));

            switch (view) {
            case "ready":
                btnBrowse.addClass("active");
                btnPaddock.removeClass("active");
                btnStorage.removeClass("active");
                btnOther.removeClass("active");
                help.animate({ opacity: 'hide', height: 'hide' }, 200);
                saveRow.animate({ opacity: 'hide', height: 'hide' }, 200);
                break;
            case "select":
                break;
            case "edit":
                btnBrowse.removeClass("active");
                
                if (opts.category == "Paddock") {
                    btnPaddock.addClass("active");
                    helpText.text("Click the first point to complete paddock.");
                } else if (opts.category == "Storage") {
                    btnStorage.addClass("active");
                    helpText.text("Click on the map to place a storage facility.");
                } else {
                    btnOther.addClass("active");
                }

                if (opts.reference) {
                    io.GetPaddockDetails(opts.reference, function (result) {
                        help.animate({ opacity: 'hide', height: 'hide' }, 200);
                        editorShowForm(result, shape);
                    });

                } else {
                    help.animate({ opacity: 'show', height: 'show' }, 200);
                    saveRow.animate({ opacity: 'hide', height: 'hide' }, 200);
                }
                break;
            }

            //editSection.children().hide();
            //editSection.children(".maps-edit-" + view).show();
        }

        function editorShapeCompleted(e, shape) {
            io.GetPaddockDetails(shape.GetOptions().reference, function (result) {
                help.animate({ opacity: 'hide', height: 'hide' }, 200);
                editorShowForm(result, shape);
            });
        }

        function _convertGoogleGeometryToInternal(_shape) {
            if (_shape.IsCompleted()) {
               
                var paddockBoundary = new Array();
                var path = _shape.shape.getPath();

                if (path.getLength() > 0) {
                    for (var i = 0; i < path.getLength() ; i++) {
                        paddockBoundary.push({ Latitude: path.getAt(i).lat(), Longitude: path.getAt(i).lng() });
                    }
                    paddockBoundary.push({ Latitude: path.getAt(0).lat(), Longitude: path.getAt(0).lng() });
                    return paddockBoundary;
                }
            }
            return null;
        }
        
        function wireUpForm(_formContainer, _html, _saveBtn, _shape) {
            //load html
            _formContainer.html(_html);
            $.validator.unobtrusive.parse(_formContainer);
            
            //wire up save
            var _form = $('form', _formContainer);
            _saveBtn.click(function () {
                console.log("submitting form");
                _form.submit();
            });
            
            _form.submit(function () {

                if (!$(this).valid()) {
                    return false;
                }

                //injects other values into form values collection for submission to server
                var _extendModel = {
                    FarmId: _shape.GetOptions().groupReference,
                    Boundary : _convertGoogleGeometryToInternal(_shape)
                };

                io.SubmitForm(this, _extendModel,
                    function (result) {
                        // Check whether the post was successful
                        if (result.success) {
                            //unwireform
                            _saveBtn.off("click");
                            _shape.SetOptions({ name: result.name, reference: result.id });
                            $.publish("/shape/save");
                        } else {
                            //wire it up again
                            wireUpForm(_formContainer, result, _saveBtn, _shape);
                        }
                    },
                    function (result) {
                        return false;
                    }
                );

                return false;
            });

        }
        
        function editorShowForm(html, shape) {
            //show
            saveRow.animate({ opacity: 'show', height: 'show' }, 200);
            wireUpForm(dataForm, html, btnSave, shape);
        }
        
        var pfx = ["webkit", "moz", "ms", "o", ""];
        function runPrefixMethod(obj, method) {
            var p = 0, m = 0, t;
            while (p < pfx.length && !obj[m]) {
                m = method;
                if (pfx[p] == "") {
                    m = m.substr(0, 1).toLowerCase() + m.substr(1);
                }
                m = pfx[p] + m;
                t = typeof obj[m];
                if (t != "undefined") {
                    pfx = [pfx[p]];
                    return (t == "function" ? obj[m](Element.ALLOW_KEYBOARD_INPUT) : obj[m]);
                }
                p++;
            }
            return null;
        };
        
        function resizeLegend (isFullscreen) {
            //check if exists
            if ($("#map_lut").length > 0 && module.CurrentLut != null) {

                if (isFullscreen) {
                    var height = mapsWrapper.height() - 400;
                    if (height < 100) height = 100;
                    if (height > 400) height = 400;
                    module.DrawLegend(module.CurrentLut, height);
                } else {
                    module.DrawLegend(module.CurrentLut);
                }

            }
        };
        
        function createEncodings(coords) {
            var i = 0;

            var plat = 0;
            var plng = 0;

            var encoded_points = "";

            for (i = 0; i < coords.length; ++i) {
                var lat = coords[i][0];
                var lng = coords[i][1];

                encoded_points += encodePoint(plat, plng, lat, lng);

                plat = lat;
                plng = lng;
            }

            // close polyline
            if (coords.length > 1) {
                encoded_points += encodePoint(plat, plng, coords[0][0], coords[0][1]);
            }

            return encoded_points;
        }

        function encodePoint(plat, plng, lat, lng) {
            var late5 = Math.round(lat * 1e5);
            var plate5 = Math.round(plat * 1e5);

            var lnge5 = Math.round(lng * 1e5);
            var plnge5 = Math.round(plng * 1e5);

            var dlng = lnge5 - plnge5;
            var dlat = late5 - plate5;

            return encodeSignedNumber(dlat) + encodeSignedNumber(dlng);
        }

        function encodeSignedNumber(num) {
            var sgn_num = num << 1;

            if (num < 0) {
                sgn_num = ~(sgn_num);
            }

            return (encodeNumber(sgn_num));
        }

        function encodeNumber(num) {
            var encodeString = "";

            while (num >= 0x20) {
                encodeString += (String.fromCharCode((0x20 | (num & 0x1f)) + 63));
                num >>= 5;
            }

            encodeString += (String.fromCharCode(num + 63));
            return encodeString;
        }
        
        function roundValue(value, dp, addCommas) {

            if (value == null) {
                return 0;

            } else {

                if (isNaN(value)) {
                    return "N/a";
                } else {
                    value = parseFloat(value);
                }

                if (dp === undefined) {
                    dp = 1;
                }

                //check for -0
                if (result == -0) {
                    result = result * -1;
                }

                var result = value.toFixed(dp);

                if (addCommas) {
                    result = AddCommas(result);
                }

                return result;
            }
        }
        
        return render;
    }
);