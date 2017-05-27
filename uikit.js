// App Init
docReady(windowDidLoad);

//! App Delegate
function windowDidLoad() {
    var body = document.body;
    // body.style.margin = 0;
    // body.style.textAlign = 'center';

    body.style.borderColor = '#00F';
    body.style.borderStyle = 'solid';
    body.style.borderWidth = '10px';

    var canvas = document.createElement('canvas');
    canvas.id = 'main-canvas';
    canvas.style.borderColor = '#F00';
    canvas.style.borderStyle = 'solid';
    canvas.style.borderWidth = '2px';
    canvas.style.posistion = 'fixed'

    setFrame(canvas, CGRectInset(getBounds(body), 2, 2));

    body.appendChild(canvas);



    // Setup Event Listenders
    window.addEventListener('resize', windowResize);   
}

function windowResize() {
    var canvas = document.getElementById('main-canvas');
    setFrame(canvas, CGRectInset(getBounds(document.body), 2, 2));
}



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
    var newRect = JSON.parse(JSON.stringify(rect));
    newRect.origin.x += xInset;
    newRect.origin.y += yInset;
    newRect.size.width -= 2 * xInset;
    newRect.size.height -= 2 * yInset;
    return newRect
}

function CGRectRelativeToRect(sourceRect, relativeRect) {
    var newRect = JSON.parse(JSON.stringify(relativeRect));
    newRect.origin.x -= sourceRect.origin.x;
    newRect.origin.y -= sourceRect.origin.y;
    return newRect;
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











