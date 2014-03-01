/******
Options:
container: the selecter of the page object to insert controls into
farmOn: boolean indicating if farm selector is used
yearOn: boolean indicating if year is used
seasonOn: boolean indicating if season is used
paddockOn: boolean indicating if paddock selector is used
*******/
define(
	['jquery', 'gmaps', 'usercontrols/render', 'usercontrols/io', 'digitise/base', 'mathutilities', 'usercontrols/menu', 'tinypubsub'],
	function ($, gmaps, render, io, digitise, math) {

	    var module = {},
	        canvas = null;
	    

	    //Options
	    var config = {
	        container: "#controls_placeholder",
	        farmOn: false,
	        yearOn: false,
	        futureYearOn: false,
	        seasonOn: false,
	        paddockOn: false,
	        showPaddockList: false,
	        enableEdit: false,
	        enableExpandMapMode: false
	    };
    
        module.init = function (options) {            
            for(var prop in options) {
                if(options.hasOwnProperty(prop)){
                    config[prop] = options[prop];
                }
            }

            canvas = render.Init(config.container, config.enableEdit, config.enableExpandMapMode);
            
            //load lists
            if (config.farmOn) loadFarms();
            if (config.yearOn) loadYears();
            if (config.seasonOn) loadSeasons();

            digitise.Init(canvas[0]);
            
            //configure events
            $.subscribe("/farm/selected", farmSelectedHandler);
            $.subscribe("/paddock/selected", paddockSelectedHandler);
            $.subscribe("/year/selected", yearSelectedHandler);
            $.subscribe("/season/selected", seasonSelectedHandler);
            $.subscribe("/grossmargin/showmapmask", showMapMaskHandler);
            $.subscribe("/grossmargin/hidemapmask", hideMapMaskHandler);
        };
	          

        function farmSelectedHandler(e, farmId) {
            io.LoadFarmSpatial(farmId, function(result) {
                digitise.RenderFarm(result);                
                if (config.paddockOn) loadPaddocks();
                $.publish("/farm/updated", [farmId]);
            });
        }
	    
        function paddockSelectedHandler(e, farmId, paddockId) {
            io.SelectPaddock(farmId, paddockId, function () {
                $.publish("/paddock/updated", [farmId, paddockId]);
            });
        }
	    
        function yearSelectedHandler(e, year) {                        
            io.SelectYear(year, function() {                
                $.publish("/year/updated", [year]);
            });
        }
	    
        function seasonSelectedHandler(e, seasonValue, seasonText) {
            io.SelectSeason(seasonValue, function () {
                //after selection
                $.publish("/season/updated", [seasonValue, seasonText]);
            });
        }
	    
	    //data should be array of PaddockDataLayerObj
	    //value label is the name of the value
	    //value prefix allows a unit to be applied before value such as $
        function showMapMaskHandler(e, data, r1, g1, b1, r2, g2, b2, breaks, valueLabel, valuePrefix) {            
            if (typeof digitise != "undefined" && digitise.farm) {

                //work out high and low
                var high = 1;
                var low = -1;
                var i;

                for (i = 0; i < data.length; i++) {
                    if (data[i].Value > high) {
                        high = data[i].Value + 1;
                    }
                    if (data[i].Value < low) {
                        low = data[i].Value - 1;
                    }
                }

                var lut = module.CreateLut(r1, g1, b1, r2, g2, b2, breaks, high, low);
                module.DrawLegend(lut);


                //classify data
                for (i = 0; i < data.length; i++) {
                    var id = data[i].Id;
                    var colour = module.ApplyLutToValue(data[i].Value, lut);

                    for (var p = 0; p < digitise.farm.paddocks.length; p++) {

                        if (digitise.farm.paddocks[p].id == id) {
                            digitise.farm.paddocks[p].ApplyMask(colour, valueLabel + ": " + valuePrefix + math.RoundValue(data[i].Value, 2, true));
                            break;
                        }
                    }
                }
            }
        };

        function hideMapMaskHandler(e) {            
            if (typeof digitise != "undefined" && digitise.farm) {
                for (var p = 0; p < digitise.farm.paddocks.length; p++) {
                    digitise.farm.paddocks[p].RemoveMask();
                }
            }
            //remove legend
            $("#map_lut").remove();
            module.CurrentLut = null;
        };
    
	    /*function checkListLoadFinished () {
            
            //wire up events
            digitise.SelectionChanged = function () {

                if (config.paddockOn) {

                    var paddockList = $("#paddockList");

                    if (digitise.farm.paddockIndex != paddockList.prop("selectedIndex")) {
                        if (module.PaddockChanged || digitise.farm.paddockIndex < 0 || digitise.farm.paddockIndex >= paddockList.children().length) {
                            //update map to match list
                            module.PaddockChanged = false;
                            digitise.ZoomToPaddock($("#paddockList").val());
                        } else {
                            //update list to match map                            
                            paddockList.prop("selectedIndex", digitise.farm.paddockIndex);
                            paddockList.change();
                        }
                    }
                }

                module.SelectionChanged();
            };*/
            /*digitise.PropertyChanged = module.MapUpdated;
            digitise.ReloadFarms = function ()
                                   {
                                            loadFarms();
                                            module.SelectionChanged();
                                   };*/
            
            /*digitise.ReloadMap = reloadMap;
            digitise.UpdateAccountArea = module.UpdateAccountArea;*/

            //if (!config.paddockOn) digitise.allowselect = false;

            /*digitise.AfterLoad = function () {
                if (config.paddockOn) {

                    var paddockList = $("#paddockList");

                    if (digitise.farm.paddockIndex != paddockList.prop("selectedIndex")) {
                        if (module.PaddockChanged || digitise.farm.paddockIndex < 0 || digitise.farm.paddockIndex >= paddockList.children().length) {
                            //update map to match list
                            module.PaddockChanged = false;
                            digitise.ZoomToPaddock($("#paddockList").val());
                        } else {
                            //update list to match map                            
                            paddockList.prop("selectedIndex", digitise.farm.paddockIndex);
                            paddockList.change();
                        }
                    }
                }
            };
        };*/
        
        function loadFarms () {
            var ignoreEmpty = !config.enableEdit; //if editing dont ignore empty
            
            io.LoadFarms(ignoreEmpty, function (result) {                
                render.FarmList(result);
	        });
	    };

        function loadPaddocks () {
	        io.LoadPaddocks(function(result) {
	            render.PaddockList(result);
	        });
	    };

        function loadYears () {
            io.LoadYears(config.futureYearOn, function (result) {                                
	            render.YearList(result);
	        });
	    };

        function loadSeasons () {
	        io.LoadSeasons(function (result) {
	            render.SeasonList(result);
	        });
	    };

        module.JumpToFarm = function () {
            digitise.ZoomToFarm();
        };

        module.GeocodeAddress = function (addressId) {
            var addressObj = $("#" + addressId);
            var address = addressObj.val();

            digitise.GeocodeAddress(address, function() {
                addressObj.val("");
            });
        };

        module.UpdateAccountArea = function () {
            io.GetAccountArea(function (result) {
                render.AccountArea(result);
            });
        };

        module.GetCurrentFarm = function () {
            var farm = $("#farmList option:selected").text();
            return farm;
        };

        module.GetCurrentYear = function () {
            var year = $("#yearList option:selected").text();
            return year;

        };

        module.GetCurrentSeason = function () {
            var season = $("#seasonList option:selected").text();
            return season;
        };

        module.GetCurrentPaddock = function () {
            var paddock = $("#paddockList option:selected").text();
            return paddock;
        };

        module.CurrentFarm = function () {
            var farm = $("#farmList option:selected");
            return farm;
        };

        module.CurrentPaddock = function () {
            var paddock = $("#paddockList option:selected");
            return paddock;
        };
        
        module.SetPaddockOn = function (on) {
            config.showPaddockList = on;

            if (on) {
                //show paddock list
                $("#paddockList").parent().show();

                //select paddock
                digitise.ZoomToPaddock($("#paddockList").val());
            } else {
                //hide paddock list
                $("#paddockList").parent().hide();

                //zoom to farm
                digitise.ZoomToFarm();
            }
        };

        module.PaddockDataLayerObj = function (id, value) {
            this.Id = id;
            this.Value = value;
        };

       

        module.ApplyLutToValue = function (value, lut) {
            for (var j = 0; j < lut.length; j++) {
                if (value < lut[j].Value) {
                    return lut[j].Colour;
                }
            }
            return lut[lut.length - 1].Colour; //highest colour
        };
        
        module.CurrentLut = null;

        module.DrawLegend = function (lut, height) {
            module.CurrentLut = lut;

            var lutDiv = $("<div id='map_lut' ></div>");

            $("#map_lut").remove(); //remove existing
            $(".maps-wrapper").append(lutDiv);

            var maxHeight = (height == null) ? 100 : height;
            var cellHeight = Math.round(maxHeight / lut.length);

            var lutCell = $("<div />");
            lutCell.css({
                "float": "left"
            });
            var i;
            for (i = lut.length - 1; i >= 0; i--) {

                var cLeft = $("<div />");

                cLeft.css({
                    "width": "16px",
                    "height": cellHeight + "px",
                    "background-color": lut[i].Colour
                });

                lutCell.append(cLeft);
            }

            lutDiv.append(lutCell);

            //if too many classes dont show value
            if (cellHeight > 12) {
                var lutCell2 = $("<div />");
                lutCell2.css({
                    "float": "left",
                    "padding-top": (Math.ceil(cellHeight / 2) + 1) + "px"
                });

                for (i = lut.length - 1; i > 0; i--) {
                    var cRight = $("<div />");

                    cRight.css({
                        "height": cellHeight + "px",
                        "line-height": cellHeight + "px",
                        "padding-left": "5px",
                        "color": "#000",
                        "font-size": "0.85em"
                    });

                    cRight.html("$" + math.RoundValue(lut[i - 1].Value, 0, true));
                    lutCell2.append(cRight);
                }
                lutDiv.append(lutCell2);
            }

            lutDiv.css({
                "-webkit-border-radius": "5px",
                "-moz-border-radius": "5px",
                "border-radius": "5px",
                "background-color": "#FFF",
                "padding": "5px 5px 5px 5px",
                "border": "1px solid #555",
                "position": "absolute",
                "left": "7px",
                "bottom": "35px",
                //"cursor": "pointer",
                "height": maxHeight + "px"
            });

        };

        module.CreateLut = function (r1, g1, b1, r2, g2, b2, breaks, high, low) {

            var ri = Math.round((r2 - r1) / (breaks - 1));
            var gi = Math.round((g2 - g1) / (breaks - 1));
            var bi = Math.round((b2 - b1) / (breaks - 1));

            var lut = new Array();

            for (var i = 0; i < breaks; i++) {
                var r = r1 + (ri * i);
                var g = g1 + (gi * i);
                var b = b1 + (bi * i);

                var colour = "rgb(" + r + "," + g + "," + b + ")";
                var value = Math.round(low + ((i + 1) * (Math.abs(high - low)) / breaks));

                lut.push({ Value: value, Colour: colour });
            }

            return lut;
        };

        // return module
        return module;
	}
);










