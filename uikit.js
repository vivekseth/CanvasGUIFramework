// App Init
docReady(function() {
    // setup window
    windowDidLoad();

    // Setup Event Listenders
    window.addEventListener('resize', windowResize);
    window.rootView = loadRootView();
})

//! App Delegate
function windowDidLoad() {
    var body = document.body;
    body.style.margin = 0;
    body.style.textAlign = 'center';

    // body.style.borderColor = '#00F';
    // body.style.borderStyle = 'solid';
    // body.style.borderWidth = '10px';

    var canvas = document.createElement('canvas');
    canvas.id = 'main-canvas';
    canvas.style.borderColor = '#F00';
    canvas.style.borderStyle = 'solid';
    canvas.style.borderWidth = '2px';
    canvas.style.posistion = 'fixed'
    setFrame(canvas, CGRectInset(getBounds(body), 2, 2));

    // Add event listener for `click` events.
    canvas.addEventListener('click', function(event) {
        var x = event.pageX - canvas.offsetLeft;
        var y = event.pageY - canvas.offsetTop;

        // TODO(vivek): Kick off hitTest here...

    }, false);


    body.appendChild(canvas);
    window.canvas = canvas;
}

function windowResize() {
    var canvas = document.getElementById('main-canvas');
    setFrame(canvas, CGRectInset(getBounds(document.body), 20, 20));
}

function loadRootView() {
    var rootView = new View();
    rootView.setFrame(CGRectInset(getBounds(canvas), 100, 100))

    var subview = new View();
    subview.setFrame(CGRectMake(30, 30, 100, 100));
    rootView.addSubview(subview);

    var subview2 = new View();
    subview2.setFrame(CGRectMake(160, 30, 100, 100));
    rootView.addSubview(subview2);

    subview2.animateWithCurveAndDuration(AnimationCurveInOutQuad, 1.0 * 1000, function(view, t, relativeTimestamp, duration) {
        // TODO(vivek): can I use an abstraction to do the interpolation for me? How do CA animations work? How do they interpolate transforms? 
        var angle = t * 2 * Math.PI;

        var frame = view.getFrame();
        var trans = CGTransformTranslate(-frame.size.width / 2, -frame.size.height / 2);
        trans = CGTransformConcat(CGTransformRotate(angle), trans);
        trans = CGTransformConcat(CGTransformTranslate(frame.size.width / 2, frame.size.height / 2), trans);
        view.setTransform(trans);

        // TODO(vivek): can I coalesce animations to that only one root function is responsible for drawing? 
        // One root object should be responsible for calling requestAnimationWithBlock
        // When the callback triggers, it fetches callbacks for all running animatsions and call them to update values. 
        // Then it redraws the whole canvas. (If possible I should look into only redrawing dirty rects).
        // Finally it calls requestAnimationBlock IF there are animations that need to continue 
        // To summarize: 
        //  1. root object owns requestAnimationBlock calling
        //  2. When root callback triggers, fetch current animations and purge outdated animations. 
        //  3. Call all animation blocks to update values
        //  4. Redraw dirty regions of canvas (for now the whole thing)
        //  5. If there are remaining animations, schedule another animation block
        ctx = window.canvas.getContext("2d");
        ctx.clearRect(0, 0, window.canvas.width, window.canvas.height);
        window.rootView.drawRect(ctx);
    })


    subview.animateWithCurveAndDuration(AnimationCurveInOutQuad, 1.0 * 1000, function(view, t, relativeTimestamp, duration) {
        var frame = view.getFrame();
        var trans = CGTransformTranslate(130 * t, 100 * t);
        view.setTransform(trans);

        ctx = window.canvas.getContext("2d");
        ctx.clearRect(0, 0, window.canvas.width, window.canvas.height);
        window.rootView.drawRect(ctx);
    })


    return rootView;
}

function drawViews(timestamp) {
   // console.log(timestamp);

    var s = window.rootView._subviews[1];
    var frame = s.getFrame();
    var t = CGTransformTranslate(-frame.size.width / 2, -frame.size.height / 2);
    t = CGTransformConcat(CGTransformRotate(Math.PI * 0.01), t);
    t = CGTransformConcat(CGTransformTranslate(frame.size.width / 2, frame.size.height / 2), t);
    s.setTransform(CGTransformConcat(t, s._transform));

    ctx = window.canvas.getContext("2d");
    ctx.clearRect(0, 0, window.canvas.width, window.canvas.height);
    window.rootView.drawRect(ctx);

    requestAnimationFrame(drawViews);
}

function View() {
    // Private
    this._bounds = CGRectZero();
    this._frame = CGRectZero();
    this._subviews = [];
    this._needsLayout = false;
    this._transform = CGTransformIdentity(); // TODO(vivek)

    // Public
    this.superview = null;

    // Private Methods
    this.setFrameTransform = function(ctx) {
        // sx kx tx 
        // ky sy ty
        //  0  0  1

        // a c e
        // b d f
        // 0 0 1
        ctx.transform(1, 0, 0, 1, this._frame.origin.x, this._frame.origin.y)
    }

    // Methods
    this.drawRect = function(ctx, rect) {
        ctx.save();
        this.setFrameTransform(ctx);
        ctx.transform.apply(ctx, this._transform);

        for (var i=0; i<this._subviews.length; i++) {
            var subview = this._subviews[i];
            subview.drawRect(ctx, subview.getFrame());
        }

        // Red outline
        ctx.strokeStyle = "#00FF00";
        ctx.strokeRect(
            this._bounds.origin.x, 
            this._bounds.origin.y, 
            this._bounds.size.width, 
            this._bounds.size.height);

        ctx.restore();
    };
    this.setNeedsLayout = function() {
        this._needsLayout = true;
    }
    this.layoutSubviews = function() {

        // TODO(vivek): need an implementation here..
        // Might need a queue of things to layout? 

        this._needsLayout = false;
    };

    this.sizeThatFits = function(size) {return size;}
    this.getFrame = function() {
        return CGRectCopy(this._frame);
    }

    // TODO(vivek): this seems suspect....
    this.setFrame = function(frame) {
        this._frame = CGRectCopy(frame);
        var bounds = CGRectCopy(frame);
        bounds.origin = CGPointZero();
        this._bounds = bounds;
        this.setNeedsLayout();
    }

    this.getBounds = function() {
        return CGRectCopy(this._bounds);
    }

    this.setTransform = function(t) {
        this._transform = t;
        this.setNeedsLayout();
    }

    this.addSubview = function(view) {
        this._subviews.push(view);
        view.superview = this;
        this.setNeedsLayout();
    }

    this.removeFromSuperview = function() {
        if (!this.superview) {
            return;
        }

        var index = this.superview.indexOf(this);
        this.superview._subviews.splice(index, 1);
        this.superview.setNeedsLayout();
        this.superview = null;
    }

    // I can modify the function by which t is calculated to create custom animation curves. 
    this.animateWithDuration = function(duration, callback) {
        this.animateWithCurveAndDuration(null, duration, callback);
    }

    this.animateWithCurveAndDuration = function(curve, duration, callback) {
        curve = curve ? curve : function(x) {return x};
        var that = this;

        var startTime = null;
        function step(timestamp) {
            startTime = startTime ? startTime : timestamp;
            var relativeTimestamp = (timestamp - startTime);
            var tLinear = relativeTimestamp / duration;

            t = curve(tLinear);

            console.log(startTime, timestamp, relativeTimestamp, duration, t);
            callback(that, t, relativeTimestamp, duration);
            if (relativeTimestamp < duration) {
                requestAnimationFrame(step);
            }
        }
        requestAnimationFrame(step);
    }
}

/*
View
    - drawRect:
- layoutSubviews:
- sizeThatFits

- hitTest
- pointInside

- convertXtoView
- convertXfromView

    - setFrame:
    - getFrame
    - getBounds
- setBounds???
    - addSubview
    - removeFromSuperview
    - superview


*/




