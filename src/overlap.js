// collision detection between two elements
var overlaps = (function(window) {
    "use-strict";

    var $ = window.jQuery;
    function getPositions(elem)
    {
        var pos, width, height;
        pos = $(elem).position();
        width = $(elem).width();
        height = $(elem).height();
        return [[ pos.left, pos.left + width], [pos.top, pos.top + height]];
    }

    function getMousePositions(point, offset)
    {
        var p1,
            p2,
            left = offset.left || 0,
            top = offset.top || 0;

        p1 = point.x - left;
        p2 = point.y - top;

        return [[p1, p1 + 1], [p2, p2 + 1]];
    }

    function comparePositions(p1, p2)
    {
        var r1, r2;
        r1 = p1[0] < p2[0] ? p1 : p2;
        r2 = p1[0] < p2[0] ? p2 : p1;
        return r1[1] > r2[0] || r1[0] === r2[0];
    }

    return function (a, b, useMouseCoords, offset)
    {
        var pos1,
            pos2;
        if (useMouseCoords)
        {
            pos1 = getMousePositions(a, offset);
            pos2 = getPositions(b);

            return comparePositions(pos1[0], pos2[0]) && comparePositions(pos1[1], pos2[1]);
        }
        else
        {
            pos1 = getPositions(a);
            pos2 = getPositions(b);
            return comparePositions(pos1[0], pos2[0]) && comparePositions(pos1[1], pos2[1]);
        }
    };
})(window);