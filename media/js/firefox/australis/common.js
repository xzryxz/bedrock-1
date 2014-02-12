;(function($, Mozilla) {
    'use strict';

    var $window = $(window);
    var $survey = $('#survey-link');
    var pageId = $('body').prop('id');

    // Update surver link for visitors who complete the tour
    window.updateTourSurveyLink = function () {
        $survey.attr('href', 'https://www.surveygizmo.com/s3/1578504/Firefox-Beta-29-Tour-Survey');
    }

    // Open survey link in new window and track click
    function openSurvey (e) {
        e.preventDefault();
        window.open(this.href, '_blank');
        gaTrack(['_trackEvent', pageId + ' Page Interactions - New Firefox Tour', 'survey link', this.href]);
    }

    // scroll to top of window for mask overlay
    if ($window.scrollTop() > 0) {
        $window.scrollTop(0);
    }

    // show sync in the menu when user clicks cta
    $('.sync .button').on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        Mozilla.UITour.showHighlight('accountStatus');

        // hide app menu when user clicks anywhere on the page
        $(document.body).one('click', function () {
            Mozilla.UITour.hideHighlight();
        });

        gaTrack(['_trackEvent', pageId + ' Page Interactions - New Firefox Tour', 'button click', 'Get Started with Sync']);
    });

    // show sync animation when user scrolls down past header
    $('main > header h1').waypoint(function(direction) {
        if (direction === 'down') {
            syncAnimation();
        }
    }, {
        triggerOnce: true,
        offset: -150
    });

    function syncAnimation () {
        var $syncAnim = $('.sync-anim');
        var $laptop = $syncAnim.find('.laptop');
        var $tablet = $syncAnim.find('.tablet');
        var $cloud = $syncAnim.find('.cloud');
        var $phone = $syncAnim.find('.phone');
        var $arrows = $cloud.find('.sync-arrows');
        var $checkmark = $cloud.find('.checkmark');

        $laptop.addClass('on');

        $laptop.one('animationend', '.passwords', function () {
            $syncAnim.addClass('devices-in');
        });

        $phone.one('animationend', function () {
            $cloud.addClass('up');
        });

        $arrows.one('animationend', function () {
            $tablet.addClass('on');
        });

        $tablet.one('animationend', '.passwords', function () {
            $phone.addClass('on');
        });

        $phone.one('animationend', '.passwords', function () {
            $cloud.addClass('complete');
        });

        $checkmark.one('animationend', function () {
            $syncAnim.addClass('complete');
        });
    }

    $('.learn-more a').on('click', function (e) {
        e.preventDefault();
        var url = this.href;
        window.open(url, '_blank');
        gaTrack(['_trackEvent', pageId + ' Page Interactions - New Firefox Tour', 'link click', url]);
    });

    // track survey link on click
    $survey.on('click', openSurvey);

})(window.jQuery, window.Mozilla);
