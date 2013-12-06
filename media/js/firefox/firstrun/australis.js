;(function($) {
    'use strict';

    var tourIsVisible = false;
    var tourHasStarted = false;
    var $tour = $('#ui-tour').detach();
    var $modal = $('#ui-tour-mask').detach().show();

    function updateControls () {
        var $current = $('.ui-tour-list li.current');
        var step = $('.ui-tour-list li.current').data('step');
        var $closeButton = $('button.close');

        if ($current.hasClass('last')) {
            $closeButton.off().one('click', closeTour);
            $closeButton.addClass('done').text(window.trans('done'));
        } else {
            $closeButton.off().one('click', compactTour);
            $closeButton.removeClass('done').text(window.trans('close'));
        }

        if ($current.hasClass('first')) {
            $('button.prev').attr('disabled', 'disabled');
        } else if ($current.hasClass('last')) {
            $('button.next').attr('disabled', 'disabled');
        } else {
            $('button.step').removeAttr('disabled');
        }
    }

    function onTourStep (e) {
        if (e.originalEvent.propertyName === 'transform') {
            var step = $('.ui-tour-list li.current').data('step');
            Mozilla.UITour.hideInfo();
            Mozilla.UITour.hideHighlight();
            // Mozilla.UITour.removePinnedTab();
            $('.ui-tour-list li.current .step-target').delay(100).trigger('tour-step');
            $('.progress-step .step').text(step);
            $('.progress-step .progress').attr('data-val', step);

            // hide menu panel when not needed as it's now sticky.
            if (!$('.ui-tour-list li.current').hasClass('app-menu')) {
                Mozilla.UITour.hideMenu('appmenu');
            }
        }
    }

    function goToNextTourStep (e) {
        e.preventDefault();
        if ($(this).hasClass('up')) {
            return;
        }
        var step = $(this).hasClass('prev') ? 'prev' : 'next';
        var $current = $('.ui-tour-list li.current');
        if (step === 'prev') {
            $current.removeClass('current next-out').addClass('prev-out');
            $current.prev().addClass('current');
        } else if (step === 'next') {
            $current.removeClass('current prev-out').addClass('next-out');
            $current.next().addClass('current');
        }
        updateControls();
    }

    function goToStep(step) {
        $('.ui-tour-list .tour-step.current').removeClass('current');
        $('.ui-tour-list .tour-step[data-step="' + step + '"]').addClass('current');
        $('.ui-tour-list .tour-step:gt(' + step + ')').addClass('prev-out');
        $('.ui-tour-list .tour-step:lt(' + step + ')').addClass('next-out');
        updateControls();
    }

    function closeTour() {
        Mozilla.UITour.hideHighlight();
        $tour.removeClass('in');
        $modal.fadeOut(function () {
            $('body').removeClass('noscroll');
            tourIsVisible = false;
            $(document).off('.ui-tour').focus();
        });
    }

    function compactTour() {
        var title = $('.ui-tour-list .tour-step.current h2').text();
        tourIsVisible = false;
        Mozilla.UITour.hideHighlight();
        Mozilla.UITour.hideMenu('appmenu');
        $tour.removeClass('in').addClass('compact');
        $tour.attr('aria-expanded', false);
        $('.ui-tour-list').fadeOut('fast');
        $('.progress-step').fadeOut('fast');
        $('.ui-tour-controls .prev').fadeOut();
        $('.ui-tour-controls .close').fadeOut();
        $('.ui-tour-controls .next').addClass('up').text(window.trans('open')).focus();
        $('button.up').one('click', expandTour);
        $modal.fadeOut('slow', function () {
            $('body').removeClass('noscroll');
            $('.compact-title').html('<h2>' + title + '</h2>').fadeIn();
            $('.progress-step').addClass('compact').fadeIn();
        });
    }

    function expandTour() {
        tourIsVisible = true;
        $tour.removeClass('compact').addClass('in').focus();
        $tour.attr('aria-expanded', true);
        $('.compact-title').fadeOut('fast');
        $('.progress-step').fadeOut('fast');
        $('.ui-tour-controls .prev').fadeIn();
        $('.ui-tour-controls .close').fadeIn();
        $('.ui-tour-controls .up').removeClass('up').text(window.trans('next'));
        $('button.close').one('click', compactTour).focus();
        $modal.fadeIn('slow', function () {
            $('body').addClass('noscroll');
            $('.ui-tour-list li.current .step-target').trigger('tour-step');
            $('.ui-tour-list').fadeIn();
            $('.progress-step').removeClass('compact').fadeIn();
        });

    }

    function startTour() {
        tourIsVisible = true;

        $('button.close').one('click', compactTour);

        $('button.step').removeAttr('disabled');
        updateControls();

        $modal.fadeIn('fast', function () {
            $tour.addClass('in').focus();
            $tour.attr('aria-expanded', true);
            tourIsVisible = true;
            tourHasStarted = true;
        });

        $('.mask-inner').addClass('out');

        Mozilla.UITour.hideInfo();
        $('.ui-tour-list li.current .step-target').trigger('tour-step');

        // close with escape key
        $(document).on('keyup.ui-tour', function(e) {
          if (e.keyCode === 27 && tourIsVisible) {
            compactTour();
          }
        });

        // prevent focusing out of modal while open
        $(document).on('focus.ui-tour', 'body', function(e) {
          // .contains must be called on the underlying HTML element, not the jQuery object
          if (tourIsVisible && !$tour[0].contains(e.target)) {
            e.stopPropagation();
            $tour.focus();
          }
        });
    }

    function handleVisibilityChange () {
        if (document.hidden) {
            Mozilla.UITour.hideHighlight();
            Mozilla.UITour.hideInfo();
            Mozilla.UITour.hideMenu('appmenu');
        } else {
            if (tourIsVisible) {
                var step = $('.ui-tour-list li.current').data('step');
                $('.ui-tour-list li.current .step-target').delay(100).trigger('tour-step');
                $('.progress-step .step').text(step);
                $('.progress-step .progress').data('val', step);
            } else if (!tourHasStarted) {
                $('.tour-init').trigger('tour-step');
            }
        }
    }

    function init () {
        var $doc = $(document);
        //window.scrollTo(0,0);
        $('body').append($modal).append($tour).addClass('noscroll');

        $('.tour-highlight').on('tour-step', function () {
            Mozilla.UITour.showHighlight(this.dataset.target, this.dataset.effect);
        });

        $('.tour-info').on('tour-step', function () {
            Mozilla.UITour.showInfo(this.dataset.target, this.dataset.title, this.dataset.text);
        });

        $('.tour-menu').on('tour-step', function () {
            Mozilla.UITour.showMenu(this.dataset.target);
        });

        $modal.on('click', startTour);
        $doc.on('transitionend', '.ui-tour-list li.current', onTourStep);
        $doc.on('visibilitychange', handleVisibilityChange);
        $('.tour-init').trigger('tour-step');
        $('button.step').on('click', goToNextTourStep);
    }

    init();

})(window.jQuery);
