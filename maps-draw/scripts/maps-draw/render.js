define(
    ['jquery'],
    function ($) {

        var editSection = $("<div class='maps-editor'></div>");

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

        
        var module = {};

        module.Init = function(canvas) {

            canvas = $(canvas);
            canvas.append(editSection);
            shapeControls();
        };

        function shapeControls() {
            
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

            btnSearch.click(function () {
                //show search
                btnSearch.toggleClass("dark");
                searchRow.animate({ opacity: 'toggle', height: 'toggle' }, 200);
                inputSearch.focus();
            });

            var runSearchEvent = function () {
                //run search
                $.publish("/usercontrols/search", [inputSearch.val(),
                    function (results, status) {
                        btnSearch.removeClass("dark");
                        searchRow.animate({ opacity: 'hide', height: 'hide' }, 200);
                        inputSearch.val("");
                    },
                    function (results, status) {
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
            var opts = shape ? shape.GetOptions() : null;

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
                    Boundary: _convertGoogleGeometryToInternal(_shape)
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

        return module;

    }
);