

var AR_SCENE = {
	// public
	init:function(mode) {		
		THREEx.ArToolkitContext.baseURL = 'data/';
		this.QUEUE_SETS = [];
		this.onRenderFcts = [];		
		this.build_scene();
		this.toolkit_ar_init();
		this.behaviors();
		this.loop_animate();
		mode && mode=='test' && this.build_test();				
	},
	add_to:function(patternPath,foo) {
		this.QUEUE_SETS.push({patternPath:patternPath,foo:foo});
	},
	
	// private
	add_from_queue:function() {
		if(!this.arToolkitSource.ready || !this.QUEUE_SETS.length) {return false;}		
		var sets =  this.QUEUE_SETS.shift();
		if(!sets){return false;}		
		var foo = sets.foo; 
		var patternPath = sets.patternPath;

		////////////////////////////////////////////////////////////
		// setup markerRoots
		////////////////////////////////////////////////////////////		

		var markerRoot= new THREE.Group();
		this.scene.add( markerRoot );
		var arMarkerControls = new THREEx.ArMarkerControls(this.arToolkitContext, markerRoot, {
			type: 'pattern',								
			patternUrl: THREEx.ArToolkitContext.baseURL + patternPath,
			// patternUrl: THREEx.ArToolkitContext.baseURL + 'patt.hiro',
			// patternUrl : THREEx.ArToolkitContext.baseURL + 'patt.kanji',
			// if we controls the camera, set changeMatrixMode: 'cameraTransformMatrix'
			// changeMatrixMode: 'cameraTransformMatrix'
		});
		foo&&foo(this,markerRoot);		

	},
	build_scene:function() {
		this.renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true
		});
		this.renderer.setClearColor(new THREE.Color('lightgrey'), 0)
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.domElement.style.position = 'absolute'
		this.renderer.domElement.style.top = '0px'
		this.renderer.domElement.style.left = '0px'		
		document.body.appendChild(this.renderer.domElement);
		this.scene = new THREE.Scene();
		this.camera = new THREE.Camera();
		this.scene.add(this.camera);
		this.onRenderFcts.push( ()=> {
			this.renderer.render(this.scene, this.camera);
		});		

	},

	build_test:function() {
		// simple demo set
		this.add_to('patt.kanji',(root,markerRoot)=>{
			var geometry = new THREE.BoxGeometry(1, 1, 1);
			var material = new THREE.MeshNormalMaterial({
				transparent: true,
				opacity: 0.5,
				side: THREE.DoubleSide
			});
			var box = new THREE.Mesh(geometry, material);
			box.position.y = geometry.parameters.height / 2
			markerRoot.add(box);
			var geometry = new THREE.TorusKnotGeometry(0.3, 0.1, 64, 16);
			var material = new THREE.MeshNormalMaterial();
			var torus = new THREE.Mesh(geometry, material);
			torus.position.y = 0.5
			markerRoot.add(torus);
			root.onRenderFcts.push( (delta) =>{
				torus.rotation.x += Math.PI * delta
			});
		});
	},

	toolkit_ar_init:function() {
		var _this=this;

		////////////////////////////////////////////////////////////
		// setup arToolkitSource
		////////////////////////////////////////////////////////////

		this.arToolkitSource = new THREEx.ArToolkitSource({
			// to read from the webcam
			sourceType: 'webcam',
			// // to read from an image
			// sourceType : 'image',
			// sourceUrl : THREEx.ArToolkitContext.baseURL + 'images/img.jpg',
			// to read from a video
			// sourceType : 'video',
			// sourceUrl : THREEx.ArToolkitContext.baseURL + 'videos/headtracking.mp4',
		});
		this.arToolkitSource.init(function onReady() {
			_this.arToolkitSource.domElement.addEventListener('canplay', () => {								
				_this.toolkit_init_context();
				console.log("--2")
				_this.on_resize('fast');							
			});
		});		

	},
	toolkit_init_context:function(){

		////////////////////////////////////////////////////////////
		// setup arToolkitContext
		////////////////////////////////////////////////////////////			

		this.arToolkitContext = new THREEx.ArToolkitContext({
			cameraParametersUrl: THREEx.ArToolkitContext.baseURL + 'camera_para.dat',
			detectionMode: 'mono',
			// labelingMode: 'white_region',
		});
		
		this.arToolkitContext.init(() => { 
			this.camera.projectionMatrix.copy(this.arToolkitContext.getProjectionMatrix());			
			this.arToolkitContext.arController.orientation = this.get_source_orientation();
			this.arToolkitContext.arController.options.orientation = this.get_source_orientation();				
		});


		this.scene.visible = false

		// update artoolkit on every frame
		this.onRenderFcts.push(()=>{
			if (!this.arToolkitContext || !this.arToolkitSource || !this.arToolkitSource.ready) { return;};
			this.arToolkitContext.update(this.arToolkitSource.domElement)
			// update scene.visible if the marker is seen
			this.scene.visible = this.camera.visible
			// add to scene markers and objects
			this.add_from_queue();
		});			

	},
	on_resize:function(mode) {		
		var foo = {
			resize:()=>{
				this.arToolkitSource.onResizeElement()				
				this.arToolkitSource.copyElementSizeTo(this.renderer.domElement) 
				if (this.arToolkitContext.arController !== null) {		
					this.arToolkitSource.copyElementSizeTo(this.arToolkitContext.arController.canvas)
				}
				console.log("resized");
			}
		};

		if(mode=='fast'){
			foo.resize();	
		}else{						
			this.TMR_RESIZE && clearTimeout(this.TMR_RESIZE);
			this.TMR_RESIZE = setTimeout(()=>{
				foo.resize();	
			},100);	
		}	
	},
	get_source_orientation() {
		if (!this.arToolkitSource) { return null;};
		if (this.arToolkitSource.domElement.videoWidth > this.arToolkitSource.domElement.videoHeight) {			
			return 'landscape';
		} else {			
			return 'portrait';
		};
	},	
	behaviors:function() {
		window.addEventListener('resize', ()=> {			
			this.on_resize();
		});
	},
	loop_animate:function() {
		var _this=this;
		var lastTimeMsec = null
		requestAnimationFrame(function animate(nowMsec) {			
			requestAnimationFrame(animate);			
			lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60;
			var deltaMsec = Math.min(200, nowMsec - lastTimeMsec);
			lastTimeMsec = nowMsec;			
			_this.onRenderFcts.forEach(function (onRenderFct) {				
				onRenderFct(deltaMsec / 1000, nowMsec / 1000);
			});
		});		
	}
};

function randInt(min, max) {
	if (max === undefined) { max = min; min = 0;}
	return Math.random() * (max - min) + min | 0;
}
