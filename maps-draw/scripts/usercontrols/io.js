define(
    ['jquery'],
    function($) {
        var module = {};
        
        function _get(url, data, cache, success, error) {
            $.ajax({
                url: url,
                type: "GET",
                cache: cache,
                data: data,
                success: function (result) {
                    if (success) success(result);
                },
                error: function (result) {
                    console.log("Failed to load.");
                    if (error) error(result);
                }
            });
        }
        
        function _post(url, data, success, error) {
            $.ajax({
                url: url,
                type: "POST",
                data: JSON.stringify(data),
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                success: function (result) {
                    if (success) success(result);
                },
                error: function (result) {
                    console.log("Failed to load.");
                    if(error) error(result);
                }
            });
        }
        
        module.LoadFarmSpatial = function (id, success) {
            _post($.url("Digitise/LoadProperty"), { farmId: id }, success);
        };
        
        module.LoadFarms = function (ignoreEmpty, success) {
            _post($.url("Digitise/GetPropertyList"), {ignoreEmpty: ignoreEmpty}, success);
        };
        
        module.LoadPaddocks = function (success) {
            _post($.url("Digitise/GetPaddockList"), null, success);
        };
        
        module.LoadYears = function (includeFuture, success) {
            _post($.url("Digitise/GetYearList"), {includeFutureYear: includeFuture}, success);
        };
        
        module.LoadSeasons = function (success) {
            _post($.url("Digitise/GetSeasonList"), null, success);
        };
        
        module.SelectFarm = function (id, success) {
            _post($.url("Digitise/SelectProperty"), {farmId: id}, success);
        };
        
        module.SelectPaddock = function (farmId, paddockId, success) {
            _post($.url("Digitise/SelectPaddock"), {farmId:farmId, paddockId:paddockId}, success);
        };

        module.SelectYear = function (year, success) {
            _post($.url("Digitise/SelectYear"), {year:year, allowFutureYear:true}, success);
        };
        
        module.SelectSeason = function (season, success) {
            _post($.url("Digitise/SelectSeason"), {season:season}, success);
        };

        module.GetAccountArea = function (success) {
            _post($.url("Digitise/UpdateAccountArea"), null, success);
        };
        
        module.RefreshMenu = function (success) {
            _get($.url("User/RefreshMenu"), null, false, success);
        };

        /*
         *  IO for editing user spatial data
         *
         */
        module.SaveProperty = function (property, success) {
            _post($.url("Digitise/SaveProperty"), { model: property }, success);
        };
        
        module.SavePaddock = function (paddock, success) {
            _post($.url("Digitise/SavePaddock"), { model: paddock.viewmodel }, success);
        };
        
        module.SaveStorage = function (storage, success) {
            _post($.url("Digitise/SaveStorage"), { model: storage.viewmodel }, success);
        };
        
        module.DeleteFarm = function (farmId, success) {
            _post($.url("Digitise/DeleteProperty"), {propertyid:farmId}, success);
        };
        
        module.DeletePaddock = function (paddockId, success) {
            _post($.url("Digitise/DeletePaddock"), {paddockid:paddockId}, success);
        };
        
        module.DeleteStorage = function (storageId, success) {
            _post($.url("Digitise/DeleteStorage"), {storageid:storageId}, success);
        };
        
        module.IsCoordValid = function (coOrd, farmid, category, success) {
            _post($.url("Digitise/IsCoordValid"), { coOrd: coOrd, farmid: farmid, objCategory: category }, success);
        };
        
        module.GetNearestSoils = function (boundary, success) {
            _post($.url("Digitise/GetNearestApsimSoils"), { boundary: boundary }, success);
        };
        
        module.CalculatePaddockArea = function (boundary, success) {
            _post($.url("Digitise/CalculatePaddockArea"), { boundary: boundary }, success);
        };
        
        module.GetPaddockDetails = function (paddockId, success) {
            _get($.url("Farm/PaddockDetails"), {paddockid: paddockId}, false, success);
        };
        
        module.SavePaddockDetails = function (details, success) {
            _post($.url("Farm/PaddockDetails"), { model: details }, success);
        };

        module.SubmitForm = function (form, extend, success, error) {
            form = $(form);
            
            //serialize form values into json array
            var model = {};
            var a = form.serializeArray();
            $.each(a, function () {
                if (model[this.name] !== undefined) {
                    if (!model[this.name].push) {
                        model[this.name] = [model[this.name]];
                    }
                    model[this.name].push(this.value || '');
                } else {
                    model[this.name] = this.value || '';
                }
            });
            //extend model with values
            $.extend(model, extend);
            
            $.ajax({
                url: form.attr("action"),
                type: form.attr("method"),
                data: JSON.stringify({ model: model }),
                contentType: "application/json; charset=utf-8",
                success: function (result) {
                    if (success) success(result);
                },
                error: function (result) {
                    console.log("Error submitting form.");
                    if (error) error(result);
                }
            });
        };

        return module;
    }
);