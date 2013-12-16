/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

;(function() {
  var $family = $('#family-content');
  var $product_links = $('.product-link');
  var cinemagrammed = false;
  var displayed_product;

  $product_links.hover(function() {
    if (!$family.hasClass('collapsed')) {
      var $parent_li = $(this).parents('li:first');

      hightlight_product($parent_li.attr('data-product'));
    }
  }, function() {
    if (!$family.hasClass('collapsed')) {
      hightlight_product('');
    }
  });

  var start_cinemagrams = function(product) {
    if (!cinemagrammed) {
      $('#cinemagram-desktop').sprite({fps: 10, no_of_frames: 44, rewind: false});

      cinemagrammed = true;
    } else {
      $('#cinemagram-' + product).spStart();
    }
  };

  var hightlight_product = function(product) {
    // remove active class from all family products
    $('#family-portraits li').removeClass('active inactive');

    // remove active class from all family links
    $('#family-names a').removeClass('active inactive');

    // hide all scenes
    $('.product-scene').removeClass('active');

    if (product !== '') {
      $('#family-portraits li[data-product="' + product + '"]').addClass('active');
      $('#family-portraits li[data-product!="' + product + '"]').addClass('inactive');

      $('#family-names li[data-product="' + product + '"] a').addClass('active');
      $('#family-names li[data-product!="' + product + '"] a').addClass('inactive');

      $('#family-header').addClass('inactive');

      // show proper scene
      $('#scene-' + product).addClass('active');

      if (product === 'os') {
        $('#os-fingers').fadeIn('fast');
      }

      // initialize cinemagrams
      start_cinemagrams(product);
    } else {
      // de-activate cinemagrams
      $('#cinemagram-desktop').spStop();

      $('#os-fingers').fadeOut('fast');

      $('#family-header').removeClass('inactive');
    }
  };

  $('.family-links').on('click', 'a', function(e) {
    e.preventDefault();

    var $parent_li = $(this).parents('li:first');
    var product = $parent_li.attr('data-product');

    // don't load the currently displayed product
    if (product !== displayed_product) {
      displayed_product = product;

      $('#masthead').animate({
        'top': '-50px'
      }, 500);

      $family.addClass('collapsed');

      $('#family-names li[data-product="' + product + '"] a').addClass('active');
      $('#family-names li[data-product!="' + product + '"] a').removeClass('active inactive');

      $('#selected-arrow').attr('class', 'active').addClass(product);

      setTimeout(function() {
        $('#nav-logo').fadeIn();
      }, 1000);

      $('html, body').animate({
        scrollTop: 0
      }, 700);

      $('#product-wrapper').empty();

      // load in external content
      $.ajax({
        url: product_details[product].url,
        type: 'GET',
        dataType: 'html',
        success: function(html) {
          var main = $(html).find('main');

          if (!product_details[product].loaded) {
            // load CSS first
            for (var i = 0; i < product_details[product].css.length; i++) {
              $('head').append('<link rel="stylesheet" type="text/css" href="' + product_details[product].css[i] + '">');
            }
          }

          $('#product-wrapper').html(main);

          if (!product_details[product].loaded) {
            for (var i = 0; i < product_details[product].js.length; i++) {
              $.getScript(product_details[product].js[i]);
            }
          }

          init_platform_imgs();

          setTimeout(function() {
            $('#product-wrapper').addClass(product);
          }, 600);
        }
      });
    }
  });

  $('#nav-logo').on('click', function(e) {
    e.preventDefault();

    $('#masthead').animate({
      'top': '0px'
    }, 500);

    $('#nav-logo').fadeOut();

    $family.removeClass('collapsed');

    $('#family-names li a').removeClass('active inactive');

    $('#selected-arrow').attr('class', '');

    $('#product-wrapper').empty();

    displayed_product = undefined;
  });
})();
