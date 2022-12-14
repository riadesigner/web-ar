

var Site = {
	init:function() {		
		THREEx.ArToolkitContext.baseURL = '';
		this.onRenderFcts = [];
		// this.lastTimeMsec;
		this.build_scene();
		this.build_elements();
		this.toolkit_ar_init();
		this.behaviors();
		this.loop_animate();
	},	
	build_scene:function() {		
		this.renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true
		});
		this.renderer.setClearColor(new THREE.Color('lightgrey'), 0)
		this.renderer.setSize(640, 480);
		this.renderer.domElement.style.position = 'absolute'
		this.renderer.domElement.style.top = '0px'
		this.renderer.domElement.style.left = '0px'
		document.body.appendChild(this.renderer.domElement);		
		this.scene = new THREE.Scene();
		this.camera = new THREE.Camera();
		this.scene.add(this.camera);
		this.onRenderFcts.push( ()=> {
			this.renderer.render(this.scene, this.camera);
		})		
	},
	build_elements:function() {
		
		var geometry = new THREE.BoxGeometry(1, 1, 1);
		var material = new THREE.MeshNormalMaterial({
			transparent: true,
			opacity: 0.5,
			side: THREE.DoubleSide
		});
		this.BOX = new THREE.Mesh(geometry, material);
		this.BOX.position.y = geometry.parameters.height / 2
		this.scene.add(this.BOX);

		var geometry = new THREE.TorusKnotGeometry(0.3, 0.1, 64, 16);
		var material = new THREE.MeshNormalMaterial();
		this.TORUS = new THREE.Mesh(geometry, material);
		this.TORUS.position.y = 0.5
		this.scene.add(this.TORUS);

		this.onRenderFcts.push( (delta) =>{
			this.TORUS.rotation.x += Math.PI * delta
		});
	},
	toolkit_ar_init:function() {
		var _this=this;
		this.arToolkitSource = new THREEx.ArToolkitSource({
			// to read from the webcam
			sourceType: 'webcam',
			sourceWidth: window.innerWidth > window.innerHeight ? 640 : 480,
			sourceHeight: window.innerWidth > window.innerHeight ? 480 : 640,
			// // to read from an image
			// sourceType : 'image',
			// sourceUrl : THREEx.ArToolkitContext.baseURL + 'images/img.jpg',
			// to read from a video
			// sourceType : 'video',
			// sourceUrl : THREEx.ArToolkitContext.baseURL + 'videos/headtracking.mp4',
		});
		this.arToolkitSource.init(function onReady() {
			_this.arToolkitSource.domElement.addEventListener('canplay', () => {
				console.log(
					'canplay',
					'actual source dimensions',
					_this.arToolkitSource.domElement.videoWidth,
					_this.arToolkitSource.domElement.videoHeight
				);

				_this.toolkit_init_context();
			});
			window.arToolkitSource = _this.arToolkitSource;
			setTimeout(() => {
				// onResize()
			}, 2000);
		});		
	},
	toolkit_init_context:function(){
			this.arToolkitContext = new THREEx.ArToolkitContext({
				cameraParametersUrl: THREEx.ArToolkitContext.baseURL + 'data/camera_para.dat',
				detectionMode: 'mono'
			});
			
			this.arToolkitContext.init(() => { 
				this.camera.projectionMatrix.copy(this.arToolkitContext.getProjectionMatrix());
				this.arToolkitContext.arController.orientation = this.get_source_orientation();
				this.arToolkitContext.arController.options.orientation = this.get_source_orientation();
				console.log('arToolkitContext', this.arToolkitContext);
				window.arToolkitContext = this.arToolkitContext;
			});
			
			this.arMarkerControls = new THREEx.ArMarkerControls(this.arToolkitContext, this.camera, {
				type: 'pattern',
				patternUrl: THREEx.ArToolkitContext.baseURL + 'data/patt.hiro',
				// patternUrl : THREEx.ArToolkitContext.baseURL + 'data/patt.kanji',
				// as we controls the camera, set changeMatrixMode: 'cameraTransformMatrix'
				changeMatrixMode: 'cameraTransformMatrix'
			});

			this.scene.visible = false

			console.log('ArMarkerControls', this.arMarkerControls);
			window.arMarkerControls = this.arMarkerControls;		

		// update artoolkit on every frame
		this.onRenderFcts.push(()=>{
			if (!this.arToolkitContext || !this.arToolkitSource || !this.arToolkitSource.ready) { return;};
			this.arToolkitContext.update(this.arToolkitSource.domElement)
			// update scene.visible if the marker is seen
			this.scene.visible = this.camera.visible
		});			
	},
	ar_on_resize:function(argument) {
		this.arToolkitSource.onResizeElement()
		this.arToolkitSource.copyElementSizeTo(this.renderer.domElement)
		if (window.arToolkitContext.arController !== null) {
			this.arToolkitSource.copyElementSizeTo(window.arToolkitContext.arController.canvas)
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
		window.addEventListener('resize', function () {
			onResize()
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