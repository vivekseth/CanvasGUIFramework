(function(funcName, baseObj) {
    // The public function name defaults to window.docReady
    // but you can pass in your own object and own function name and those will be used
    // if you want to put them in a different namespace
    funcName = funcName || "docReady";
    baseObj = baseObj || window;
    var readyList = [];
    var readyFired = false;
    var readyEventHandlersInstalled = false;

    // call this when the document is ready
    // this function protects itself against being called more than once
    function ready() {
        if (!readyFired) {
            // this must be set to true before we start calling callbacks
            readyFired = true;
            for (var i = 0; i < readyList.length; i++) {
                // if a callback here happens to add new ready handlers,
                // the docReady() function will see that it already fired
                // and will schedule the callback to run right after
                // this event loop finishes so all handlers will still execute
                // in order and no new ones will be added to the readyList
                // while we are processing the list
                readyList[i].fn.call(window, readyList[i].ctx);
            }
            // allow any closures held by these functions to free
            readyList = [];
        }
    }

    function readyStateChange() {
        if ( document.readyState === "complete" ) {
            ready();
        }
    }

    // This is the one public interface
    // docReady(fn, context);
    // the context argument is optional - if present, it will be passed
    // as an argument to the callback
    baseObj[funcName] = function(callback, context) {
        if (typeof callback !== "function") {
            throw new TypeError("callback for docReady(fn) must be a function");
        }
        // if ready has already fired, then just schedule the callback
        // to fire asynchronously, but right away
        if (readyFired) {
            setTimeout(function() {callback(context);}, 1);
            return;
        } else {
            // add the function and context to the list
            readyList.push({fn: callback, ctx: context});
        }
        // if document already ready to go, schedule the ready function to run
        if (document.readyState === "complete") {
            setTimeout(ready, 1);
        } else if (!readyEventHandlersInstalled) {
            // otherwise if we don't have event handlers installed, install them
            if (document.addEventListener) {
                // first choice is DOMContentLoaded event
                document.addEventListener("DOMContentLoaded", ready, false);
                // backup is window load event
                window.addEventListener("load", ready, false);
            } else {
                // must be IE
                document.attachEvent("onreadystatechange", readyStateChange);
                window.attachEvent("onload", ready);
            }
            readyEventHandlersInstalled = true;
        }
    }
})("docReady", window);




//// GUI UTIL


// TODO(vivek): need a new name for my rect class. 
// TODO(vivek): attempt adopting a more javascripty approach to rects. 
// TODO(vivek): consider removing namespace to make more javascripty.


//! CGRect
function CGRectZero() {
    return CGRectMake(0, 0, 0, 0);
}

function CGRectNull() {
    return CGRectMake(null, null, null, null);
}

function CGRectMake(x, y, width, height) {
    return {
        origin: {x: x, y: y},
        size: {width: width, height: height}
    }
}

function CGRectFromBBox(bbox) {
    return CGRectMake(bbox.left, bbox.top, bbox.width, bbox.height);
}

function CGRectInset(rect, xInset, yInset) {
    if (!rect) {
        return;
    }
    var newRect = CGRectCopy(rect);
    newRect.origin.x += xInset;
    newRect.origin.y += yInset;
    newRect.size.width -= 2 * xInset;
    newRect.size.height -= 2 * yInset;
    return newRect
}

function CGRectRelativeToRect(sourceRect, relativeRect) {
    var newRect = CGRectCopy(relativeRect);
    newRect.origin.x -= sourceRect.origin.x;
    newRect.origin.y -= sourceRect.origin.y;
    return newRect;
}

function CGRectIntersect(rectA, rectB) {
    throw 'NOT IMPLEMENTED';
}

function CGRectCopy(rect) {
    return JSON.parse(JSON.stringify(rect));
}

function CGPointMake(x, y) {
    return {x: x, y: y}
}

function CGPointZero() {
    return CGPointMake(0, 0);
}

function CGTransformIdentity() {
    return [1, 0, 0, 1, 0, 0];
}

function CGTransformTranslate(tx, ty) {
    return [1, 0, 0, 1, tx, ty];
}

function CGTransformScale(sx, sy) {
    return [sx, 0, 0, sy, 0, 0];
}

function CGTransformRotate(angle) {
    return [Math.cos(angle), Math.sin(angle), -Math.sin(angle), Math.cos(angle), 0, 0];
}


function CGTransformConcat(t1, t2) {
    var m1 = _matrixFromTransform(t1);
    var m2 = _matrixFromTransform(t2);
    return _transformFromMatrix(_matrixMultiply(m1, m2));
}

function _matrixFromTransform(t) {
    var a = t[0];
    var b = t[1];
    var c = t[2];
    var d = t[3];
    var e = t[4];
    var f = t[5];

    return [
        [a, c, e],
        [b, d, f],
        [0, 0, 1],
    ];
}

function _transformFromMatrix(m) {
    var a = m[0][0];
    var b = m[1][0];
    var c = m[0][1];
    var d = m[1][1];
    var e = m[0][2];
    var f = m[1][2];
    return [a, b, c, d, e, f];
}

// return A * B
function _matrixMultiply(a, b) {
  var aNumRows = a.length, aNumCols = a[0].length,
      bNumRows = b.length, bNumCols = b[0].length,
      m = new Array(aNumRows);  // initialize array of rows
  for (var r = 0; r < aNumRows; ++r) {
    m[r] = new Array(bNumCols); // initialize the current row
    for (var c = 0; c < bNumCols; ++c) {
      m[r][c] = 0;             // initialize the current cell
      for (var i = 0; i < aNumCols; ++i) {
        m[r][c] += a[r][i] * b[i][c];
      }
    }
  }
  return m;
}


//! Dom Node Helpers

function setFrame(node, rect) {
    if (!node) {
        return;
    }

    node.style.top = rect.origin.y;
    node.style.left = rect.origin.x;
    node.style.width = rect.size.width;
    node.style.height = rect.size.height;

    node.height = rect.size.height;
    node.width = rect.size.width;
}

// TODO(vivek): frame of document.body should be the entire size. its bounds should take care of the visibleRect being smaller. Not sure how to handle resizing a document, obviously subelements should adapt their sizes to fit. 
function getFrame(node) {
    // TODO(vivek): there is no concept of a transform so this is easy.
    if (!node || node == document) {
        return CGRectNull();
    }
    else if (node == document.body.parentNode) {
        var bbox = node.getBoundingClientRect();
        return CGRectMake(bbox.left, bbox.top, node.clientWidth, node.clientHeight);
    }
    else {
        var absoluteRect = CGRectFromBBox(node.getBoundingClientRect());
        if (node == document.body) {
            absoluteRect.size.height = node.clientHeight;
            absoluteRect.size.width = node.clientWidth;
        }

        var parentRect = CGRectFromBBox(node.parentNode.getBoundingClientRect());
        return CGRectRelativeToRect(parentRect, absoluteRect);
    }
}

function getBounds(node) {
    var style = window.getComputedStyle(node);
    var inset = 0;
    inset += parseFloat(style.margin);
    inset += parseFloat(style.borderWidth);
    inset += parseFloat(style.padding);

    var frame = getFrame(node);
    frame = CGRectInset(frame, inset, inset);
    frame.origin = {x:0, y:0};

    return frame;
}

function AnimationCurveInOutQuad(t)
{
    if(t <= 0.5)
        return 2.0 * t * t;
    t -= 0.5;
    return 2.0 * t * (1.0 - t) + 0.5;
}









