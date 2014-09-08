/*
 * Mural
 *
 *
 * Copyright (c) 2014 Paul Asjes
 * Licensed under the MIT license.
 */

(function ($) {
    "use strict";

    var noop = function() {},
        settings = {},
        containerOffset,
        items = [];
    // Collection method.
    $.fn.mural = function (options, foo) {
        settings = $.extend({}, $.fn.mural.defaults, options);

        settings.container = this;

        // evaluate animation type and gracefully fallback in case the selected type isn't supported
        settings.animationType = autoDetectAnimation(settings.animationType);

        var $items = $(settings.itemSelector);

        for (var i = 0; i < $items.length; i++) {
            var item = new Item($items[i], settings.animationType);
            items.push(item);
            item.getJQElement().bind(Item.DRAG_END, onDrop).css("position", "absolute");
        }

        containerOffset = this.offset();

        var delay;
        $(window).resize(function() {
            clearTimeout(delay);
            delay = setTimeout(function() {
                drawItems(items);
            }, 150);
        });

        drawItems(items);

        return this;
    };


    /*
     * Auto detect which animation type to use in the following order:
     * 1. Velocity
     * 2. CSS
     * 3. jQuery
     */
    function autoDetectAnimation(type) {
        switch (type) {
            case "jquery":
                return "jquery";
                break;

            default:
            case "css":
                if (!Detect.transform || !Detect.webkitTransform) {
                    return "jquery";
                }
                return "css";
                break;

            case "velocity":
                if ($.Velocity !== undefined) {
                   return "velocity";
                }
                autoDetectAnimation("css");
                break;
        }
    }

    // TODO: Fix how drop works when only there is only one column
    function onDrop(e) {
        var $current = $(e.currentTarget);

        var hasMatch = false;

        var elementArray = items.map(function(el) {
            return el.getElement();
        });

        for (var i = 0; i < items.length; i++) {
            if (e.currentTarget !== items[i].getElement()) {
                if (overlaps($current[0], items[i].getElement(), false, containerOffset)) {
                    var midpoint = {};
                    var o = $current.offset();
                    midpoint.x = ($current.width() / 2) + o.left;
                    midpoint.y = ($current.height() / 2) + o.top;

                    var orientation = getPosInRelation(midpoint, items[i].getJQElement());

                    var dragged = elementArray.indexOf($current[0]);
                    var dropped = elementArray.indexOf(items[i].getElement());

                    var n = 0;
                    if (dragged < dropped) {
                        if (orientation === "left") n = -1;
                    } else {
                        if (orientation === "right") n = 1;
                    }

                    items.splice(dropped + n, 0, items.splice(dragged, 1).shift());
                    elementArray.splice(dropped + n, 0, elementArray.splice(dragged, 1).shift());

                    hasMatch = true;
                    break;
                }
            }
        }

        if (!hasMatch) {
            var pos = elementArray.indexOf($current[0]);

            if (isItemAtTop($current, items[0].getJQElement())) {
                items.splice(0, 0, items.splice(pos, 1).shift());
            } else if (isItemAtBottom($current, items[items.length - 1].getJQElement())) {
                items.splice(items.length, 0, items.splice(pos, 1).shift());
            }
        }

        drawItems(items);
    }

    function getPosInRelation(pos, $item)
    {
        var mx = pos.x - containerOffset.left,
            tw = $item.width() / 2,
            tp = $item.position(),
            mp = tp.left + tw;

        return (mx < mp) ? "left" : "right";
    }

    function isItemAtTop($item1, $item2) {
        return $item1.position().top < $item2.position().top;
    }

    function isItemAtBottom($item1, $item2) {
        return $item1.position().top > $item2.position().top;
    }

    // Static method default options.
    $.fn.mural.defaults = {
        cols: 5,
        itemSelector: ".mural-item",
        speed: 500,
        wgap: 50,
        hgap: 50,
        maxColumns: 5,
        shrinkOnResize: true,
        onReshuffle: noop, // this should return the item order
        animationType: "css", // options should be css, jquery, velocity or auto
        centered: true
    };

    function drawItems(items) {
        var w = settings.container.width();

        var iw = parseInt(items[0].getJQElement().css("width"), 10);

        var maxwidth = iw + settings.wgap + (settings.wgap / items.length);
        var columns = Math.floor(w / maxwidth);

        if (columns > settings.maxColumns && settings.container.height() > 400) {
            columns = settings.maxColumns;
        } else if (columns < 1) {
            columns = 1;
        }

        if (columns > items.length) {
            columns = items.length;
        }

        for (var i = 0; i < items.length; i++) {
            var row = Math.floor(i / columns);
            var column = i % columns;

            var $item = items[i].getJQElement();
            var width = $item.width();
            var height = $item.height();

            var wgap = width + settings.wgap;
            var hgap = height + settings.hgap;

            $item[0].newT = containerOffset.top + (row * hgap);

            var adjustment = 0;
            if (settings.centered) {
                var totalwidth = (columns * width) + (settings.wgap * (columns - 1));
                adjustment = (w - totalwidth) / 2;
            }
            $item[0].newL = Math.round(containerOffset.left + adjustment + (column * wgap));

            if ($item[0].newT < 0) $item[0].newT = 0;
            if ($item[0].newL < 0) $item[0].newL = 0;
        }

        animateItems(items);
    }

    function animateItems(items) {
        for (var i = 0; i < items.length; i++) {
            var $item = items[i].getJQElement();
            var o = $item.position();

            // Only animate if there is a change in position
            if (o.top !== $item[0].newT || o.left !== $item[0].newL) {
                var t = (i * 60 > 900) ? 900 : i * 60;

                switch (settings.animationType) {
                    case "jquery":
                        $item.stop(true, false);
                        $item.animate({"top": $item[0].newT, "left": $item[0].newL}, 100 + t);
                        break;

                    case "velocity":
                        // TODO: graceful fallback to CSS or jquery if velocity is not found
                        $item.velocity({"top": $item[0].newT, "left": $item[0].newL}, 100 + t);
                        break;

                    default:
                    case "css":
                        var transform = "translate(" + $item[0].newL + "px, " + $item[0].newT + "px)";
                        $item.css("-webkit-transition", "-webkit-transform " + (settings.speed / 1000) + "s");
                        $item.css("-webkit-transform", transform);
                        $item.css("transform", transform);

                        // remove animate after complete
                        (function(index) {
                            setTimeout(function() {
                                items[index].getJQElement().css("-webkit-transition", "");
                            }, settings.speed);
                        })(i);
                        break;
                }
            }
        }

        if (settings.onReshuffle) {
            setTimeout(function() {
                settings.onReshuffle.call(this, items.map(function(el) {
                    return el.getElement();
                }));
            }, settings.speed);
        }
    }

    // Static method.
    $.mural = function (options) {
        // Override default options with passed-in options.
        options = $.extend({}, $.awesome.options, options);
        // Return something awesome.
        return 'mural' + options.punctuation;
    };

    $.mural.setOrder = function(order) {
        console.log("set");
    };

    // Custom selector.
    $.expr[':'].mural = function (elem) {
        // Is this element awesome?
        return $(elem).text().indexOf('awesome') !== -1;
    };
}(jQuery));