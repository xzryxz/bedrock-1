;(function($) {
    'use strict';

    var Tour = (function () {

        var tourIsVisible = false;
        var tourHasStarted = false;
        var tourIsAnimating = false;
        var highlightTimer;
        var $body = $('body');
        var $doc = $(document);
        var $tour = $('#ui-tour').detach().show();
        var $mask = $('#ui-tour-mask').detach().show();
        var $prevButton;
        var $nextButton;
        var $closeButton;
        var $tourList;
        var $progress;
        var $compactTitle;

        return {

            /*
             * Create Mozilla.UITour event listeners and show the door hanger
             */
            init: function () {
                $body.append($mask).append($tour).addClass('noscroll');

                $('.tour-highlight').on('tour-step', function () {
                    Mozilla.UITour.showHighlight(this.dataset.target);
                });

                $('.tour-info').on('tour-step', function () {
                    Mozilla.UITour.showInfo(this.dataset.target, this.dataset.title, this.dataset.text);
                });

                $('.tour-menu').on('tour-step', function () {
                    Mozilla.UITour.showMenu(this.dataset.target);
                });

                $tourList = $('.ui-tour-list');
                $prevButton = $('button.prev');
                $nextButton = $('button.next');
                $closeButton = $('button.close');
                $progress = $('.progress-step');
                $compactTitle = $('.compact-title');

                // temporary click handler to start the tour until we get a button in the door hanger
                $mask.one('click', Tour.startTour);

                $doc.on('transitionend', '.ui-tour-list li.current', Tour.onTourStep);
                $doc.on('visibilitychange', Tour.handleVisibilityChange);
                $('.tour-init').trigger('tour-step');
                $('button.step').on('click', Tour.goToNextTourStep);
            },

            /*
             * Updates the tour UI controls buttons to reflect the current step
             */
            updateControls: function () {
                var $current = $tourList.find('li.current');

                if ($current.hasClass('last')) {
                    $closeButton.off().one('click', Tour.closeTour);
                    $closeButton.addClass('done').text(window.trans('done'));
                } else {
                    $closeButton.off().one('click', Tour.compactTour);
                    $closeButton.removeClass('done').text(window.trans('close'));
                }

                // update prev/next button states
                if ($current.hasClass('first')) {
                    $prevButton.attr('disabled', 'disabled');
                    $nextButton.removeAttr('disabled');
                } else if ($current.hasClass('last')) {
                    $nextButton.attr('disabled', 'disabled');
                    $prevButton.removeAttr('disabled');
                } else {
                    $('button.step').removeAttr('disabled');
                }
            },

            /*
             * Highlights a series of browser UI elements in rotation
             */
            rotateHighLights: function () {
                var targets = ['bookmarks', 'appMenu', 'selectedTabStart'];
                var i = 0;
                Mozilla.UITour.showHighlight('selectedTabStart');
                clearInterval(highlightTimer);
                highlightTimer = setInterval(function () {
                    Mozilla.UITour.showHighlight(targets[i]);
                    i = (targets.length === i) ? 0 : i + 1;
                }, 1000);
            },

            /*
             * Triggers the current step tour highlight / interaction
             * Called on `transitionend` event after carousel item animates
             */
            onTourStep: function (e) {
                if (e.originalEvent.propertyName === 'transform') {
                    var $current = $tourList.find('li.current');
                    var step = $current.data('step');
                    tourIsAnimating = false;
                    Mozilla.UITour.hideInfo();
                    Mozilla.UITour.hideHighlight();
                    $current.find('.step-target').delay(100).trigger('tour-step');
                    $progress.find('.step').text(step);
                    $progress.find('.progress').attr('aria-valuenow', step);

                    // hide menu panel when not needed as it's now sticky.
                    if (!$current.hasClass('app-menu')) {
                        Mozilla.UITour.hideMenu('appMenu');
                    }
                    // if we're on the last step, rotate the menu highlights
                    if ($current.hasClass('last')) {
                        Tour.rotateHighLights();
                        $nextButton.addClass('faded');
                    } else if ($current.hasClass('first')) {
                        $prevButton.addClass('faded');
                    } else {
                        clearInterval(highlightTimer);
                        $('button.step').removeClass('faded');
                    }
                    Tour.updateControls();
                }
            },

            /*
             * Transitions carousel animation to the next/prev step of the tour
             */
            goToNextTourStep: function (e) {
                e.preventDefault();
                if ($(this).hasClass('up')) {
                    return;
                }
                var step = $(this).hasClass('prev') ? 'prev' : 'next';
                var $current = $tourList.find('li.current');
                tourIsAnimating = true;
                $('button.step').attr('disabled', 'disabled');
                if (step === 'prev') {
                    $current.removeClass('current next-out').addClass('prev-out');
                    $current.prev().addClass('current');
                } else if (step === 'next') {
                    $current.removeClass('current prev-out').addClass('next-out');
                    $current.next().addClass('current');
                }
            },

            /*
             * Go directly to a specific step in the tour
             */
            goToStep: function (step) {
                $('.ui-tour-list .tour-step.current').removeClass('current');
                $('.ui-tour-list .tour-step[data-step="' + step + '"]').addClass('current');
                $('.ui-tour-list .tour-step:gt(' + step + ')').addClass('prev-out');
                $('.ui-tour-list .tour-step:lt(' + step + ')').addClass('next-out');
                Tour.updateControls();
            },

            /*
             * Closes the tour completely
             * Triggered on last step or if user presses esc key
             */
            closeTour: function () {
                clearInterval(highlightTimer);
                Mozilla.UITour.hideHighlight();
                $tour.removeClass('in');
                $mask.fadeOut(function () {
                    $body.removeClass('noscroll');
                    tourIsVisible = false;
                    $doc.off('.ui-tour').focus();
                });
            },

            /*
             * Minimize the tour to compact state
             * Called when pressing the close button mid-way through the tour
             */
            compactTour: function () {
                var title = $tourList.find('li.current h2').text();
                tourIsVisible = false;
                Mozilla.UITour.hideHighlight();
                Mozilla.UITour.hideMenu('appMenu');
                $tour.removeClass('in').addClass('compact');
                $tour.attr('aria-expanded', false);
                $tourList.fadeOut('fast');
                $progress.fadeOut('fast');
                $prevButton.fadeOut('fast');
                $closeButton.fadeOut('fast');
                $nextButton.addClass('up').text(window.trans('open')).focus();
                $('button.up').one('click', Tour.expandTour);
                $mask.fadeOut('slow', function () {
                    $body.removeClass('noscroll');
                    $compactTitle.html('<h2>' + title + '</h2>').fadeIn('fast');
                    $progress.addClass('compact').fadeIn('fast');
                });
            },

            /*
             * Expands tour from compact state and goes back to the tour step
             * they we're on prior to minimizing
             */
            expandTour: function () {
                tourIsVisible = true;
                $tour.removeClass('compact').addClass('in').focus();
                $tour.attr('aria-expanded', true);
                $compactTitle.fadeOut('fast');
                $progress.fadeOut('fast');
                $prevButton.fadeIn('fast');
                $nextButton.removeClass('up').text(window.trans('next'));
                $closeButton.fadeIn('fast').one('click', Tour.compactTour).focus();
                $mask.fadeIn('slow', function () {
                    $body.addClass('noscroll');
                    $tourList.find('li.current .step-target').trigger('tour-step');
                    $tourList.fadeIn('slow');
                    $progress.removeClass('compact').fadeIn('slow');
                });
            },

            /*
             * Minimizes / closes the tour based on current step
             * Triggered when user presses the esc key
             */
            onKeyUp: function (e) {
                var $current = $tourList.find('li.current');
                if (e.keyCode === 27 && tourIsVisible && !tourIsAnimating) {
                    if ($current.hasClass('last')) {
                        Tour.closeTour();
                    } else {
                        Tour.compactTour();
                    }
                }
            },

            /*
             * Starts the tour and animates the carousel up from bottom of viewport
             */
            startTour: function () {
                // $closeButton.one('click', function () {
                //     if (!tourIsAnimating) {
                //         alert('here');
                //         Tour.compactTour();
                //     }
                // });

                Tour.updateControls();

                $tour.addClass('in').focus();
                $tour.attr('aria-expanded', true);
                tourIsVisible = true;
                tourHasStarted = true;

                // fade out the inner mask messaging that's shown the the page loads
                $mask.find('.mask-inner').addClass('out');

                Mozilla.UITour.hideInfo();
                $tourList.find('li.current .step-target').trigger('tour-step');

                // toggle/close with escape key
                $doc.on('keyup.ui-tour', Tour.onKeyUp);

                // prevent focusing out of modal while open
                $doc.on('focus.ui-tour', 'body', function(e) {
                    // .contains must be called on the underlying HTML element, not the jQuery object
                    if (tourIsVisible && !$tour[0].contains(e.target)) {
                        e.stopPropagation();
                        $tour.focus();
                    }
                });
            },

            /*
             * Handles page visibility changes if user leaves/returns to current tab.
             * Tour step UI highlights should hide when user leaves the tab, and appear
             * again when the user returns to the tab.
             */
            handleVisibilityChange: function () {
                var $current = $tourList.find('li.current');
                var step = $current.data('step');

                if (document.hidden) {
                    clearInterval(highlightTimer);
                    Mozilla.UITour.hideHighlight();
                    Mozilla.UITour.hideInfo();
                    Mozilla.UITour.hideMenu('appMenu');
                } else {
                    if (tourIsVisible) {
                        $current.find('.step-target').delay(100).trigger('tour-step');
                        $progress.find('.step').text(step);
                        $progress.find('.progress').attr('aria-valuenow', step);
                        if ($current.hasClass('last')) {
                            Tour.rotateHighLights();
                        }
                    } else if (!tourHasStarted) {
                        $('.tour-init').trigger('tour-step');
                    }
                }
            }
        };
    }());

    // TODO - also check version number for Australis release
    if (isFirefox() && !isMobile()) {
        Tour.init();
    }

})(window.jQuery);
