;(function($, Mozilla) {
    'use strict';

    //Only run the tour if user is on Firefox 29 for desktop.
    if (window.isFirefox() && !window.isFirefoxMobile() && window.getFirefoxMasterVersion() >= 29) {

        // add a callback when user finishes tour to update the cta
        // id is used for Telemetry
        var tour = new Mozilla.BrowserTour({
            id: 'australis-tour-whatsnew-29.0a2',
            onTourComplete: window.updateTourSurveyLink
        });

        tour.init();

        // show the sync button
        $('.sync .button').css('display', 'block');
    }

})(window.jQuery, window.Mozilla);
