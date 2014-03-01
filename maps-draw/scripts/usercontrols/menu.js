define(
    ['jquery', 'usercontrols/io', 'tinypubsub'],
    function ($, io) {

        //configure events
        $.subscribe("/farm/updated", refreshMenu);
        //$.subscribe("/paddock/selected", refreshMenu);
        $.subscribe("/year/updated", refreshMenu);
        $.subscribe("/season/updated", refreshMenu);
        
        function refreshMenu() {
            
            io.RefreshMenu(function (model) {
                if (model != null) {

                    if (model.RecommendationCount > 0) {

                        var recommendationCount = $("#diarylink .count");

                        if (recommendationCount.length == 0) {
                            $("#diarylink").append('<span class="count">' + model.RecommendationCount + '</span>');
                        } else {
                            recommendationCount.text(model.RecommendationCount);
                        }
                    } else {
                        $("#diarylink .count").remove();
                    }


                    if (model.ReportCount > 0) {

                        var reportCount = $("#reportlink .count");

                        if (reportCount.length == 0) {
                            $("#reportlink").append('<span class="count">' + model.ReportCount + '</span>');
                        } else {
                            reportCount.text(model.ReportCount);
                        }
                    } else {
                        $("#reportlink .count").remove();
                    }

                    if (model.MessageCount > 0) {

                        var messageCount = $("#messagelink .count");

                        if (messageCount.length == 0) {
                            $("#messagelink").append('<span class="count">' + model.MessageCount + '</span>');
                        } else {
                            messageCount.text(model.MessageCount);
                        }
                    } else {
                        $("#messagelink .count").remove();
                    }
                }
            });
        }
    }
);