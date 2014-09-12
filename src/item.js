var Item = function(el, animationType, activeClass) {
	var moving = false,
        $ = window.jQuery,
        element = el,
		$element = $(element),
		halfWidth = $element.width() / 2,
		halfHeight = $element.height() / 2;

    function onDragStart(e) {
        $element.css("z-index", 10);
        if (activeClass) $element.addClass(activeClass);
        moving = true;
        e.preventDefault();
    }

    function onDragEnd() {
        if (moving) {
            $element.trigger(Item.DRAG_END);
        }
        moving = false;
        $element.css("z-index", 1);
        if (activeClass) $element.removeClass(activeClass);
    }

    function onMove(e) {
        if (!moving) {
            return;
        }

        var x = e.pageX;
        var y = e.pageY;

        if (e.touches) {
            x = e.touches[0].pageX;
            y = e.touches[0].pageY;
        }

        setPosition(x, y);
    }

    function setPosition(x, y) {
        // this might not be needed
        var offset = $element.parent().offset();

        var dx = (x - halfWidth);
        var dy = (y - halfHeight);

        switch (animationType) {
            // these are the same as we're not actually animating
            case "velocity":
            case "jquery":
                $element.offset({left: dx, top: dy});
                break;

            default:
            case "css":
                if (!Detect.transform || !Detect.webkitTransform) {
                    animationType = "jquery";
                    return setPosition(x, y);
                }
                dx -= offset.left;
                dy -= offset.top;
                var transform = "translate(" + dx + "px, " + dy + "px)";

                $element.css("-webkit-transform", transform);
                $element.css("transform", transform);
                break;
        }
    }

    $element.bind("touchstart", onDragStart);
    $element.bind("touchend", onDragEnd);
    $element.bind("touchmove", onMove);

    $element.bind("mousedown", onDragStart);
    window.document.addEventListener("mouseup", onDragEnd);
    window.document.addEventListener("mousemove", onMove);

    this.getElement = function() {
        return element;
    };

    this.getJQElement = function() {
        return $element;
    };
};

Item.DRAG_END = "dragend";
Item.DRAG_START = "dragstart";