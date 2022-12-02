
var Site = {
	init:function() {
		this.onRenderFcts= [];
		this.build_scene();
		this.build_elements();
		this.add_ar_toolkits();
		this.behaviors();
		this.animate_all();
	},
	build_scene:function() {
		this.renderer = new THREE.WebGLRenderer({ antialias: true,alpha: true});
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.renderer.domElement.style.position = 'absolute'
		this.renderer.domElement.style.top = '0px'
		this.renderer.domElement.style.left = '0px'
		document.body.appendChild( this.renderer.domElement );		
		this.scene	= new THREE.Scene();		
		this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.01, 100 );
		this.camera.position.z = 3;		
	},
	build_elements:function() {
		
		var geometry	= new THREE.BoxGeometry(1,1,1);
		var material	= new THREE.MeshNormalMaterial({
			transparent : true,
			opacity: 0.5,
			side: THREE.DoubleSide
		});
		this.CUBE = new THREE.Mesh( geometry, material );
		this.scene.add( this.CUBE );

		var geometry	= new THREE.TorusKnotGeometry(0.3,0.1,64,16);
		var material	= new THREE.MeshNormalMaterial();
		this.TORUS	= new THREE.Mesh( geometry, material );
		this.scene.add( this.TORUS );

		this.onRenderFcts.push((delta)=>{					
			this.TORUS.rotation.x += Math.PI*delta;
		});

		// render the scene
		this.onRenderFcts.push(()=>{
			this.renderer.render( this.scene, this.camera );
		})	

	},
	behaviors:function() {
		var _this=this;

		window.addEventListener( 'resize', ()=>{
			_this.TMR_ONRESIZE && clearTimeout(_this.TMR_ONRESIZE);
			_this.TMR_ONRESIZE = setTimeout(()=>{
				this.camera.aspect = window.innerWidth / window.innerHeight;
				this.camera.updateProjectionMatrix();
				this.renderer.setSize( window.innerWidth, window.innerHeight );
				this.update_toolkits_onresize();				
			},100);
		}, false );		
	},
	update_toolkits_onresize:function() {
		this.arToolkitSource.onResizeElement()
		this.arToolkitSource.copyElementSizeTo(this.renderer.domElement)
		if (window.arToolkitContext.arController !== null) {
			this.arToolkitSource.copyElementSizeTo(window.arToolkitContext.arController.canvas)
		}
	},
	add_ar_toolkits:function() {
		var _this = this;
		this.arToolkitSource = new THREEx.ArToolkitSource({
			// to read from the webcam
			sourceType: 'webcam',
			sourceWidth: window.innerWidth > window.innerHeight ? 640 : 480,
			sourceHeight: window.innerWidth > window.innerHeight ? 480 : 640,
			// // to read from an image
			// sourceType : 'image',
			// sourceUrl : THREEx.ArToolkitContext.baseURL + '../data/images/img.jpg',
			// to read from a video
			// sourceType : 'video',
			// sourceUrl : THREEx.ArToolkitContext.baseURL + '../data/videos/headtracking.mp4',
		});
		this.arToolkitSource.init(function onReady() {
			_this.arToolkitSource.domElement.addEventListener('canplay', () => {
				console.log(
					'canplay',
					'actual source dimensions',
					_this.arToolkitSource.domElement.videoWidth,
					_this.arToolkitSource.domElement.videoHeight
				);
				_this.init_ar_context();
			});
			window.arToolkitSource = _this.arToolkitSource;			
			_this.TMR_TOOLKITS_UPD = setTimeout(() => {
				_this.update_toolkits_onresize()
			}, 2000);
		});
	},
	init_ar_context() {
		var _this=this;

		this.arToolkitContext = new THREEx.ArToolkitContext({
			cameraParametersUrl: THREEx.ArToolkitContext.baseURL + '../data/data/camera_para.dat',
			detectionMode: 'mono'
		});
		// initialize it
		this.arToolkitContext.init(() => { // copy projection matrix to camera
			this.camera.projectionMatrix.copy(this.arToolkitContext.getProjectionMatrix());

			this.arToolkitContext.arController.orientation = this.get_ar_source_orientation();
			this.arToolkitContext.arController.options.orientation = this.get_ar_source_orientation();

			console.log('this.arToolkitContext', this.arToolkitContext);
			window.arToolkitContext = this.arToolkitContext;
		});
		// MARKER
		this.arMarkerControls = new THREEx.ArMarkerControls(this.arToolkitContext, this.camera, {
			type: 'pattern',
			patternUrl: THREEx.ArToolkitContext.baseURL + '../data/data/patt.hiro',
			// patternUrl : THREEx.ArToolkitContext.baseURL + '../data/data/patt.kanji',
			// as we controls the camera, set changeMatrixMode: 'cameraTransformMatrix'
			changeMatrixMode: 'cameraTransformMatrix'
		});
		
		console.log('ArMarkerControls', this.arMarkerControls);
		window.arMarkerControls = this.arMarkerControls;
		
		this.scene.visible = false;

		// update artoolkit on every frame
		this.onRenderFcts.push(function () {
			if (!_this.arToolkitContext || !_this.arToolkitSource || !_this.arToolkitSource.ready) { return; }			
			_this.arToolkitContext.update(_this.arToolkitSource.domElement)
			// update scene.visible if the marker is seen
			_this.scene.visible = _this.camera.visible
		});

	},	
	get_ar_source_orientation() {
		if (!this.arToolkitSource) { return null; }
		console.log(
			'actual source dimensions',
			this.arToolkitSource.domElement.videoWidth,
			this.arToolkitSource.domElement.videoHeight
		);

		if (this.arToolkitSource.domElement.videoWidth > this.arToolkitSource.domElement.videoHeight) {
			console.log('source orientation', 'landscape');
			return 'landscape';
		} else {
			console.log('source orientation', 'portrait');
			return 'portrait';
		}
	},
	animate_all:function() {
		this.lastTimeMsec= null;
		var _this=this;
		requestAnimationFrame(function animate(nowMsec){						
			requestAnimationFrame( animate );			
			_this.lastTimeMsec	= _this.lastTimeMsec || nowMsec-1000/60
			var deltaMsec	= Math.min(200, nowMsec - _this.lastTimeMsec)
			_this.lastTimeMsec	= nowMsec						
			_this.onRenderFcts.forEach(function(onRenderFct){				
				onRenderFct(deltaMsec/1000, nowMsec/1000)
			})
		});
	}
};
