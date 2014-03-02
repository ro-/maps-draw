/***
maps-draw - a library for drawing spatial shapes on google maps api

Requires JQuery 1.6.x 
Requires Google Maps API V3.x

Author: Rowan Lewis
Updated: 26/10/2011
**/

define(
	['jquery', 'gmaps', './io', './maps-ui', 'maps-draw/maps-draw', 'tinypubsub'],
	function ($, gmaps, io, ui, mapsDraw) {
        var module = {};

        module._canvas = null;
        module._map = null;
        module._farmId = null;
        module._farmName = null;
        module._lastBounds = null;
        module._lastAdjustZoom = null;
        module._shapeManager = null;
        
	    var options = {
	        zoomLimit: 12
	    };
	    
        //module.allowselect = true;
	    
	    module.Init = function(canvas) {
	        module._canvas = canvas;
            
	        //events
	        $.subscribe("/usercontrols/mapResized", function() {
	            module._ResizeMap();
	        });
	        
	        $.subscribe("/usercontrols/search", function (e, address, onSuccess, onFail) {
	            module._GeocodeAddress(address, onSuccess, onFail);
	        });
	        
	        $.subscribe("/usercontrols/viewhome", function (e) {
	            module._ZoomToFarm();
	        });

	        $.subscribe("/usercontrols/togglecategory", function(e, category) {
	            module._shapeManager.ToggleCategoryVisible(category);
	        }); 	        

	        $.subscribe("/shape/cancel", function () {
	            var selected = module._shapeManager.GetSelected();

	            if (selected) {
	                //if current shape is completed then user must delete
	                if (selected.IsCompleted()) { // && selected.GetOptions().reference
	                    return;
	                }

	                module._shapeManager.FinishEditCurrent();
	                module._ZoomToFarm();	                                
	            }
	            
	        });

	        $.subscribe("/shape/save", function () {
	            var selected = module._shapeManager.GetSelected();

	            if (selected) {
	                if (selected.IsCompleted()) {
	                    module._SaveShape(selected);
	                    module._shapeManager.FinishEditCurrent();
	                    module._shapeManager.DeselectCurrent();
	                    module._ZoomToFarm();
	                }
	            }
	        });

	        $.subscribe("/shape/addPaddock", function (e) {	            
	            if (module._shapeManager.CanAddNewShape()) {
	                module._shapeManager.FinishEditCurrent();
	                module.NewPaddock();
	            }
	        });

	        $.subscribe("/shape/addStorage", function (e) {
	            if (module._shapeManager.CanAddNewShape()) {
	                module._shapeManager.FinishEditCurrent();
	                module.NewStorage();
	            }	            
	        });

	        $.subscribe("/shape/addOther", function (e, category) {
	            if (module._shapeManager.CanAddNewShape()) {
	                module._shapeManager.FinishEditCurrent();
	                module.NewOtherShape(category);
	            }
	        });

	        $.subscribe("/shape/delete", function () {
	            var selected = module._shapeManager.GetSelected();

	            if (selected) {
	                
	                var deleteFunc = function () {
	                    module._shapeManager.Remove(selected);
	                    module._ZoomToFarm();
	                };

                    //check for server reference
	                if (selected.GetOptions().reference) {
	                    if (confirm("Delete " + selected.name + " and all associated data and records? This cannot be undone.")) {
	                        module._DeleteShape(selected, deleteFunc);
	                    }
	                } else {
	                    if (confirm("Shape is not saved, are you sure you want to delete?")) {
	                        deleteFunc();
	                    }
	                }
	            }
	        });

	        $.subscribe("/editor/start", function () {
	            module._shapeManager.SetEditable(true);
	        });

	        $.subscribe("/editor/stop", function () {
	            module._shapeManager.SetEditable(false);
	        });
	        
	        $.subscribe("/paddock/selected", function(e, farmId, paddockId) {
	            module._shapeManager.SetSelected(paddockId, "Paddock");
	        });

	        module._InitMap();
	        module._InitShapeManager();
	        ui.Init(module._canvas); //init drawing controls

	        
	    };

        module._InitMap = function (centroid, bounds) {

            var myHomeCentroid = new gmaps.LatLng(-28, 135);

            if (centroid != null) myHomeCentroid = centroid;

            if (bounds != null) myHomeCentroid = bounds.getCenter();

            var myOptions = {
                zoom: 3,
                center: myHomeCentroid,
                mapTypeId: gmaps.MapTypeId.HYBRID,
                streetViewControl: false,
                disableDoubleClickZoom: true,
                scaleControl: true,
                disableDefaultUI: true,
                zoomControl: true,
                mapTypeControl: true,
                styles: [ { "featureType": "poi", "stylers": [ { "visibility": "off" } ] },{ } ]
            };
    
            gmaps.visualRefresh = true;
    
            module._map = new gmaps.Map(module._canvas, myOptions);            

            if (bounds != null) module._FitMapToBounds(bounds);

            $(window).resize(function () {
                module._ResizeMap();
            });

            //after map loaded
            gmaps.event.addListenerOnce(module._map, 'idle', function () {});
        };

        module._InitShapeManager = function () {
            //shape manager for map
            module._shapeManager = new mapsDraw.ShapeManager(module._map);
            module._shapeManager.SetEditable(true);

            module._shapeManager.addEventListener("modechange", function (mode, shape) {
                console.log("modechange: " + mode);

                var opts = shape ? shape.GetOptions() : null;

                switch (mode) {
                    case "ready":
                        ui.ChangeState(ui.States.Browse);
                        break;
                    case "select":
                        break;
                    case "create":
                        if (opts.category == "Paddock") {
                            ui.ChangeState(ui.States.PaddockCreate);
                        } else if (opts.category == "Storage") {
                            ui.ChangeState(ui.States.StorageCreate);
                        } else if (opts.category == "Polygon") {
                            ui.ChangeState(ui.States.OtherCreate);
                        } else if (opts.category == "Polyline") {
                            ui.ChangeState(ui.States.OtherCreate);
                        } else if (opts.category == "Circle") {
                            ui.ChangeState(ui.States.OtherCreate);
                        } else if (opts.category == "Rectangle") {
                            ui.ChangeState(ui.States.OtherCreate);
                        } else if (opts.category == "Marker") {
                            ui.ChangeState(ui.States.OtherCreate);
                        }
                        break;
                    case "edit":
                        if (opts.category == "Paddock") {
                            ui.ChangeState(ui.States.PaddockEdit);
                        } else if (opts.category == "Storage") {
                            ui.ChangeState(ui.States.StorageEdit);
                        } else if (opts.category == "Polygon") {
                            ui.ChangeState(ui.States.OtherEdit);
                        } else if (opts.category == "Polyline") {
                            ui.ChangeState(ui.States.OtherEdit);
                        } else if (opts.category == "Circle") {
                            ui.ChangeState(ui.States.OtherEdit);
                        } else if (opts.category == "Rectangle") {
                            ui.ChangeState(ui.States.OtherEdit);
                        } else if (opts.category == "Marker") {
                            ui.ChangeState(ui.States.OtherEdit);
                        }
                        break;
                }                
            });            
        };

        //zooms to the combined bounds of shapes in shapemanager
        module._ZoomToFarm = function () {
            var bounds = module._shapeManager.GetBounds();
            if(!bounds) return;
            module._FitMapToBounds(bounds, module._lastAdjustZoom);
        };
	    
        //reduces bounds checking for every resize
        module._ResizeMap = function () {
            if (module._map) {
                gmaps.event.trigger(module._map, 'resize');
                if (module._lastBounds != null) {
                    module._FitMapToBounds(module._lastBounds, module._lastAdjustZoom);
                } else {
                    module._ZoomToFarm();
                }
            }
        };

        //helper function to change map display to new bounds
        module._FitMapToBounds = function (bounds, adjustZoom) {
            module._lastBounds = bounds;
            module._lastAdjustZoom = adjustZoom;

            module._map.fitBounds(bounds);   // does the job asynchronously
           
            if (adjustZoom) {
                module._map.setZoom(module._map.getZoom() + adjustZoom);
            }    
        };
	    
        //helper function to move map display to coordinate
        module._PanMapToLocation = function(latlng) {
            module._map.panTo(latlng);
        };
	    
        //searches for an address and on success moves view
        module._GeocodeAddress = function (address, onSuccess, onFail) {
            
            if (address != null) {
                var geocoder = new gmaps.Geocoder();

                //region bias is set to Australia, which prioritises it over USA but will still return NZ or other country results if relevant 
                geocoder.geocode({ 'address': address, 'region': 'AU' }, function (results, status) {
                    if (status == gmaps.GeocoderStatus.OK) {
                        if (onSuccess) onSuccess(results, status);
                        
                        if (results[0].geometry.bounds != null) {
                            module._FitMapToBounds(results[0].geometry.bounds);
                        }
                        if (results[0].geometry.location != null) {
                            module._PanMapToLocation(results[0].geometry.location);
                        }

                    } else {
                        if (onFail) onFail(results, status);
                    }
                });
            }
        };
	    
        //save to server
        module._SaveProperty = function(farm) {
            if (farm != null) {
                var property = {
                    FarmId: farm.id,
                    Name: farm.name
                };

                io.SaveProperty(property, function(result) {
                    //update farm id
                    module._farmId = result;
                    $.publish("/farm/changed", []);
                });
            }
        };
        
	    //delete from server
        module._DeleteProperty = function () {
            if (module.farmIid != null) {
                io.DeleteFarm(module.farmIid, function () {
                    module._shapeManager.Clear();
                    $.publish("/farm/changed", []);
                });
            } 
        };
	    
        module._SaveShape = function (shape) {
            var opts = shape.GetOptions();
            
	        if (opts.category == "Paddock") {
	            //check size of paddock
	            module.CalculatePaddockArea(shape,
                    function (area) {
                        alert("Area:" + area);
                        //AddPaddockDetails(area);
                        //EditPaddockDetails(area, null);
                    }
                );
	        } else if (opts.category == "Storage") {
	            alert("save storage");
	            //AddStorageDetails();
	            //EditStorageDetails();
	        } else {
	            alert("Saving for shape category:" + opts.category + " not implemented.");
	        }
	    };

	    module._DeleteShape = function (shape, callback) {
	        var opts = shape.GetOptions();
	        
	        if (opts.category == "Paddock") {
	            io.DeletePaddock(opts.reference, callback);
	        } else if (opts.category == "Storage") {
	            io.DeleteStorage(opts.reference, callback);
	        } else {
	            alert("Delete for shape category:" + opts.category + " not implemented.");
	        }
	    };
	    
        module.SavePaddock = function(paddock) {

            if (paddock == null ||paddock.viewmodel == null) {
                return;
            }

            if (paddock.polygon) {

                var paddockBoundary = new Array();
                var path = paddock.polygon.getPath();

                if (path.getLength() > 0) {
                    for (var i = 0; i < path.getLength(); i++) {
                        paddockBoundary.push({ Latitude: path.getAt(i).lat(), Longitude: path.getAt(i).lng() });
                    }

                    paddockBoundary.push({ Latitude: path.getAt(0).lat(), Longitude: path.getAt(0).lng() });

                    paddock.viewmodel.PaddockId = paddock.id;
                    paddock.viewmodel.Boundary = paddockBoundary;
                    paddock.viewmodel.FarmId = module.farm.id;

                }
            }

            io.SavePaddock(paddock, function(model) {
                if (typeof model.Valid === "undefined" || model.Valid == true) {
                    paddock.SetEditable(false);
                    paddock.id = model.PaddockId;
                    paddock.viewmodel = model;
                    paddock.saved = true;
                    paddock.StoreCurrentPath();
                    paddock.SetName(model.Name);
                    module.farm.SelectPaddock(-1);
                    module.PropertyChanged();
                    module.UpdateAccountArea();
                } else {
                    alert(model.Errors[0]);
                }
            });
        };

        module.SaveStorage = function(storage) {

            if (storage == null || storage.viewmodel == null) {
                return;
            }

            if (storage.marker) {
                var coOrd = storage.marker.getCenter();
                storage.viewmodel.StorageId = storage.id;
                storage.viewmodel.Location = { Latitude: coOrd.lat(), Longitude: coOrd.lng() };
            }
            io.SaveStorage(storage, function(result) {
                storage.SetEditable(false);
                storage.id = result.StorageId;
                storage.viewmodel = result;
                storage.saved = true;
                storage.StoreCurrentLocation();
                storage.SetName(result.Name);
                module.farm.SelectStorage(-1);
                module.PropertyChanged();
            });
        };

	    //check point is valid
        module.CalculatePaddockArea = function(paddock, callback) {
            
            if (paddock && paddock.polygon) {

                var paddockBoundary = new Array();
                var path = paddock.polygon.getPath();

                if (path.getLength() > 0) {
                    for (var i = 0; i < path.getLength(); i++) {
                        paddockBoundary.push({ Latitude: path.getAt(i).lat(), Longitude: path.getAt(i).lng() });
                    }

                    paddockBoundary.push({ Latitude: path.getAt(0).lat(), Longitude: path.getAt(0).lng() });
                    io.CalculatePaddockArea(paddockBoundary, callback);
                } 
            }
        };

        module.GetNearestSoils = function (paddock, callback) {
    
            if (paddock && paddock.polygon) {

                var paddockBoundary = new Array();
                var path = paddock.polygon.getPath();

                if (path.getLength() > 0) {
                    for (var i = 0; i < path.getLength() ; i++) {
                        paddockBoundary.push({ Latitude: path.getAt(i).lat(), Longitude: path.getAt(i).lng() });
                    }

                    paddockBoundary.push({ Latitude: path.getAt(0).lat(), Longitude: path.getAt(0).lng() });
                    io.GetNearestSoils(paddockBoundary, callback);
                } 
            }
        };
	    
        function _shapeFactory(ShapeType, shapeOptions) {
            var _options = {
                reference: null, //extending shape to include a reference to id
                groupReference: module._farmId //extending shape to include a reference to group id
            };
            
            $.extend(_options, shapeOptions);

            var _shape = new ShapeType(_options);
            
            //all shapes use same vertex check
            _shape.AddVertexCreateHandler(_vertexCreateHandler);
            
            return _shape;
        }
	    
        module.NewPaddock = function (path, name, id) {
            var padddockOptions = {
                category: "Paddock",
                colour: "#d1ff31",
                selectedColour: "#ff8a00",
                name: name,
                geometry: path,
                reference: id
            };

            var myPaddock = _shapeFactory(mapsDraw.Polygon, padddockOptions);
            var isCreate = path == null;
            module._shapeManager.Add(myPaddock, isCreate);
        };

        module.NewStorage = function (pcoord, name, id) {
            var storageOptions = {
                category: "Storage",
                colour: "#64f6ff",
                selectedColour: "#ff8a00",
                name: name,
                radius: 100,
                geometry: pcoord,
                reference: id
            };
            
            var myStorage = _shapeFactory(mapsDraw.Circle, storageOptions);
            var isCreate = pcoord == null;
            module._shapeManager.Add(myStorage, isCreate);
        };

        module.NewOtherShape = function (category) {
            var options = {
                category: category,
                colour: "#770022",
                selectedColour: "#ff8a00"
            };

            var type = null;

            switch (category) {
                case "Polygon":
                    type = mapsDraw.Polygon;
                    break;
                case "Polyline":
                    type = mapsDraw.Polyline;
                    break;
                case "Circle":
                    type = mapsDraw.Circle;
                    break;
                case "Rectangle":
                    type = mapsDraw.Rectangle;
                    break;
                case "Marker":
                    type = mapsDraw.Marker;
                    break;
                default:
                    alert("error bad category for new shape, cannot continue");
                    return;
            }

            var myShape = _shapeFactory(type, options);
            var isCreate = true;
            module._shapeManager.Add(myShape, isCreate);
        };

        
	    
        function _vertexCreateHandler(shape, event, onSuccess) {
            //test if zoomed in enough
            if (module._map.getZoom() < options.zoomLimit) {
                alert("You are too zoomed out. Please zoom in further to maintain accuracy.");
                return;
            }

            onSuccess();

            /*var coOrd = { Latitude: event.latLng.lat(), Longitude: event.latLng.lng() };

            //coord valid check
            io.IsCoordValid(coOrd, module._farmId, shape.GetOptions().category, function (result) {
                if (result.Valid == true) {
                    //passed test
                    if (onSuccess) onSuccess();
                } else {
                    alert(result.Errors[0]);
                }
            });*/
        }

        module.GetBounds = function () {
            return module._shapeManager.GetBounds();
        };

        module.RenderFarm = function (model) {

            if (model != null) {
                //clear anything currently loaded
                module._shapeManager.Clear();

                var pcoord, pcoords, tll, i, p, s;

                if (model.FarmId != 0) {

                    module._farmId = model.FarmId;

                    if (model.Paddocks != null) {
                        for (p = 0; p < model.Paddocks.length; p++) {
                            pcoords = new gmaps.MVCArray;

                            for (i = 0; i < model.Paddocks[p].Boundary.length - 1; i++) {
                                tll = new gmaps.LatLng(model.Paddocks[p].Boundary[i].Latitude, model.Paddocks[p].Boundary[i].Longitude);
                                pcoords.push(tll);
                            }
                            //load paddock
                            module.NewPaddock(pcoords, model.Paddocks[p].Name, model.Paddocks[p].PaddockId);
                           
                            //info 
                            //paddock.viewmodel = property.Paddocks[p];
                        }
                    }

                    if (model.Storages != null) {
                        for (s = 0; s < model.Storages.length; s++) {

                            pcoord = new gmaps.LatLng(model.Storages[s].Location.Latitude, model.Storages[s].Location.Longitude);

                            //load storage
                            module.NewStorage(pcoord, model.Storages[s].Name, model.Storages[s].StorageId);
                            
                            //info 
                            //storage.viewmodel = property.Storages[s];
                        }
                    }
                }

                module._ZoomToFarm();

            } else {
                console.error("No model details loaded");
            }
        };
    
        return module;
	}
);




                

