// App Init
docReady(function() {
    // setup window
    windowDidLoad();

    // Setup Event Listenders
    window.addEventListener('resize', windowResize);
    window.rootView = loadRootView();

    window.renderer = new Renderer(window.canvas, window.rootView);
    window.renderer.begin();

    var anim = new Animation(null, 1.0 * 1000, window.rootView._subviews[1], function(context, t, relativeTimestamp, duration) {
        var view = context;
        var angle = t * 2 * Math.PI;

        var frame = view.getFrame();
        var trans = CGTransformTranslate(-frame.size.width / 2, -frame.size.height / 2);
        trans = CGTransformConcat(CGTransformRotate(angle), trans);
        trans = CGTransformConcat(CGTransformTranslate(frame.size.width / 2, frame.size.height / 2), trans);
        view.setTransform(trans);
    }, function() {
        anim.startTime = null;
        window.renderer.addAnimation(anim);
    });
    window.renderer.addAnimation(anim);
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
    setFrame(canvas, CGRectInset(getBounds(document.body), 2, 2));
    window.rootView.setFrame(CGRectInset(getBounds(canvas), 100, 100));

    if (window.renderer.animations.length <= 0) {
        var anim = new Animation(AnimationCurveInOutQuad, 1.0 * 1000, window.rootView._subviews[1], function(context, t, relativeTimestamp, duration) {
            var view = context;
            var angle = t * 2 * Math.PI;

            var frame = view.getFrame();
            var trans = CGTransformTranslate(-frame.size.width / 2, -frame.size.height / 2);
            trans = CGTransformConcat(CGTransformRotate(angle), trans);
            trans = CGTransformConcat(CGTransformTranslate(frame.size.width / 2, frame.size.height / 2), trans);
            view.setTransform(trans);
        });
        window.renderer.addAnimation(anim);
    }
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

    var subview3 = new View();
    subview3.setFrame(CGRectMake(0, 0, 100, 100));
    subview3.setTransform(CGTransformScale(0.5, 0.5));
    subview2.addSubview(subview3);

    return rootView;
}

function Renderer(canvas, view) {
    console.log(canvas, view)

    this.canvas = canvas;
    this.view = view;
    this.animations = [];

    this.render = function(that, timestamp) {
        // if (!this.view) {
        //     return;
        // }

        // 1. Layout if needed. 
        if (that.view._needsLayout) {
            that.view._layoutRecursively();
        }

        // 2. Run Animations
        var animationsCopy = that.animations.slice();
        for (var i=0; i<animationsCopy.length; i++) {
            var anim = animationsCopy[i];
            anim.callback(timestamp);
        }

        // 3. Redraw if needed
        if (that.view._needsRedraw || this.animations.length > 0) {
            renderView(that);
        }

        // Finally, Schedule next run loop iteration
        that.scheduleRender()
    }

    function renderView(that) {
        ctx = that.canvas.getContext("2d");
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        that.view.drawRect(ctx);
    }

    this.begin = function() {
        this.scheduleRender();
    }

    this.scheduleRender = function() {
        var that = this;
        requestAnimationFrame(function(timestamp){
            that.render(that, timestamp);
        });
    }

    this.addAnimation = function(anim) {
        this.animations.push(anim);
        anim.delegate = this;
    }

    this.purgeAnimation = function(anim) {
        var index = this.animations.indexOf(anim);
        this.animations.splice(index, 1);
        anim.delegate = null;
    }
}

function Animation(curve, duration, context, interpolationFunction, completionBlock) {
    this.curve = curve || function(x) {return x};
    this.duration = duration;
    this.startTime = null;
    this.interpolationFunction = interpolationFunction;
    this.context = context;
    this.delegate = null;
    this.completionBlock = completionBlock;

    // this must be called in the conext of requestAnimationFrame
    this.callback = function(timestamp) {
        this.startTime = this.startTime ? this.startTime : timestamp;
        var relativeTimestamp = (timestamp - this.startTime);
        var tLinear = relativeTimestamp / this.duration;
        if (tLinear <= 1.0) {
            var t = this.curve(tLinear);
            this.interpolationFunction(context, t, relativeTimestamp, duration);
        }
        else {
            if (this.delegate) {
                this.delegate.purgeAnimation(this);
            }
            if (this.completionBlock) {
                this.completionBlock();
            }
        }
    }
}

function View() {
    // Private
    this._bounds = CGRectZero();
    this._frame = CGRectZero();
    this._transform = CGTransformIdentity();
    this._subviews = [];
    this._needsLayout = false;
    this._needsRedraw = false;

    // Public
    this.superview = null;

    // Private Methods
    this._layoutRecursively = function() {
        this.layoutSubviews();
        for (var i=0; i<this._subviews.length; i++) {
            this._subviews[i].layoutSubviews()
        }
    }

    // Methods
    this.setNeedsRedraw = function() {
        this._needsRedraw = true;
    }

    this.drawRect = function(ctx, rect) {
        ctx.save();

        // Transform from superview CoordinateSpace to this view's coordinate space
        ctx.transform.apply(ctx, CGTransformTranslate(this._frame.origin.x, this._frame.origin.y));

        // Apply extra transform if needed
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

        this._needsRedraw = false;

        ctx.restore();
    };
    
    this.setNeedsLayout = function() {
        this._needsLayout = true;
        if (this.superview) {
            this.superview.setNeedsLayout();
        }
    }
    
    this.layoutSubviews = function() {
        // TODO(vivek): Need a way to call super implementation in subviews. 
        this._needsLayout = false;
    };

    this.sizeThatFits = function(size) {
        return size;
    }

    this.getFrame = function() {
        return CGRectCopy(this._frame);
    }

    this.setFrame = function(frame) {
        this._frame = CGRectCopy(frame);
        var bounds = CGRectCopy(frame);
        // TODO(vivek): this seems suspect....
        bounds.origin = CGPointZero();
        this._bounds = bounds;
        this.setNeedsLayout();
        this.setNeedsRedraw();
    }

    this.getBounds = function() {
        return CGRectCopy(this._bounds);
    }

    this.setBounds = function(bounds) {
        this._bounds = CGRectCopy(bounds);
        var frame = CGRectCopy(bounds);
        frame.origin = CGPointCopy(this._frame.origin);
        this._frame = frame;
        this.setNeedsLayout();
        this.setNeedsRedraw();
    }

    this.setTransform = function(t) {
        this._transform = t;
        this.setNeedsLayout();
        this.setNeedsRedraw();
    }

    this.addSubview = function(view) {
        this._subviews.push(view);
        view.superview = this;
        this.setNeedsLayout();
        this.setNeedsRedraw();
    }

    this.removeFromSuperview = function() {
        if (!this.superview) {
            return;
        }

        var index = this.superview.indexOf(this);
        this.superview._subviews.splice(index, 1);
        this.superview.setNeedsLayout();
        this.superview.setNeedsRedraw();
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
    - setBounds
    - addSubview
    - removeFromSuperview
    - superview
- addGestureRecognizer

WindowController
- windowDidLoad
- windowDidAppear
- windowDidDisappear
- loadRootView
- windowDidResize

    RenderController
    - animateWithCurveAndDuration
    - animateWithDuration
    - animateEaseInOutWithDuration
    - _render ??

GestureRecognizer
- types: Click, DoubleClick, Hover, RightClick, MouseEnteredFrame? 
- 

*/




