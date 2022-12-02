
var Site = {
	init:function() {
		this.build_scene();
		this.build_elements();
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
		this.onRenderFcts= [];	
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
		window.addEventListener( 'resize', ()=>{
			this.camera.aspect = window.innerWidth / window.innerHeight;
			this.camera.updateProjectionMatrix();
			this.renderer.setSize( window.innerWidth, window.innerHeight );
		}, false );		
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
