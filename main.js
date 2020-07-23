function init() {
	var scene = new THREE.Scene();
	var gui = new dat.GUI();
	var clock = new THREE.Clock();

	scene.background = new THREE.Color( 0xcce0ff );
	scene.fog = new THREE.Fog( 0xcce0ff, 20, 70 ); 

	// load external geometry
	var textureLoader = new THREE.TextureLoader();
	var objLoader = new THREE.OBJLoader();

	var colorMap = textureLoader.load('./water.jpg');
	


	objLoader.load( '3di.obj', function ( object ) {

					object.traverse( function ( child ) {

						if ( child instanceof THREE.Mesh ) {

							// child.material.map = new THREE.MeshPhongMaterial( 0xEEEEEE);

						}

					} );

					var materialObj =  new THREE.MeshStandardMaterial( { color: 0xA00000, roughness: 0, metalness: 0.5 } );
						    object.traverse(function(child) {
						        if (child instanceof THREE.Mesh) {
						            child.material = materialObj;
						        }
						    });

					object.position.x = -6.5;
                    object.position.y = 10;
                    object.scale.x = 0.05;
                    object.scale.y = 0.05;
                    object.scale.z = 0.05;
                    obj = object
                    console.log(obj);
					scene.add( obj );

				} );


				var loader = new THREE.FontLoader();
				loader.load( 'gentilis_bold.typeface.json', function ( font ) {

		  		var textGeometry = new THREE.TextGeometry( "Other models", {

		   		font: font,
		   		size: 1,
		    	height: 1,
		    	// curveSegments: 12,
			    // bevelThickness: 1,
			    // bevelSize: 1,
			    // bevelEnabled: true

		  		});

		  		var textMaterial =  new THREE.MeshStandardMaterial( { color: 0xA00000, roughness: 0, metalness: 0.5 }
		  		);
		 		var mesh = new THREE.Mesh( textGeometry, textMaterial );
		 		mesh.scale.z = 0.2;
		 		mesh.position.y = 8;
		 		mesh.position.x = 1;
		 		scene.add( mesh );

				});   



	var size = 30;
	var divisions = 30;

	var gridHelper = new THREE.GridHelper( size, divisions );
	//scene.add( gridHelper );

	// ground
	var groundTexture = textureLoader.load( './grasslight-big.jpg' );
	groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
	groundTexture.repeat.set( 10, 10 );
	groundTexture.anisotropy = 16;
	groundTexture.encoding = THREE.sRGBEncoding;

	var groundMaterial = new THREE.MeshLambertMaterial( { map: groundTexture } );

	var mesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 100, 100 ), groundMaterial );
	mesh.rotation.x = - Math.PI / 2;
	mesh.receiveShadow = true;
	scene.add( mesh );


	var water3di = getWater(7.999);
	var waterOther = getWater(7.999);
	var directionalLight = getDirectionalLight(1);
	var directionalLight2 = getDirectionalLight(1);
	var sphere = getSphere(0.05);
	var boxGrid = getBoxGrid(8, 1);
	var boxGrid2 = getBoxGrid(8, 1);

	//plane.name = 'plane-1';
	boxGrid.name = 'boxGrid';
	boxGrid2.name = 'boxGrid2';
	water3di.name = 'waterHeight';

	water3di.rotation.x = Math.PI/2;
	water3di.position.y = -3;
	waterOther.rotation.x = Math.PI/2;
	waterOther.position.y = -3;
	directionalLight.position.x = 13;
	directionalLight.position.y = 10;
	directionalLight.position.z = 10;
	directionalLight.intensity = 3;

	//scene.add(plane);
	scene.add(water3di);
	scene.add(waterOther);
	directionalLight.add(sphere);
	scene.add(directionalLight);
	scene.add(directionalLight2);
	scene.add(boxGrid);
	scene.add(boxGrid2);





	var camera = new THREE.PerspectiveCamera(
		45,
		window.innerWidth/window.innerHeight,
		1,
		1000
	);

	camera.position.x = 0.7;
	camera.position.y = 11;
	camera.position.z = 29;

	camera.lookAt(new THREE.Vector3(0, 0, 0));

	boxGrid.position.x -= 5;
	water3di.position.x -= 5;
	boxGrid2.position.x += 5;
	waterOther.position.x += 5;



	// gui.add(directionalLight, 'intensity', 0, 10);
	// gui.add(directionalLight.position, 'x', 0, 20);
	// gui.add(directionalLight.position, 'y', 0, 20);
	// gui.add(directionalLight.position, 'z', 0, 20);
	gui.add(water3di.position, 'y', -3, 1, 1).name('waterheight 3Di').onFinishChange(function(){
    var waterDepth = getWaterHeight(boxGrid, water3di);
    console.log(waterDepth)
	});
	gui.add(waterOther.position, 'y', -3, 1, 1).name('waterheight other');
		


	var renderer = new THREE.WebGLRenderer( {antialias: true});
	renderer.shadowMap.enabled = true;
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor('rgb(120, 120, 120)');
	document.getElementById('webgl').appendChild(renderer.domElement);

	var controls = new THREE.OrbitControls(camera, renderer.domElement);
	controls.maxPolarAngle = Math.PI/2 - 0.03; 
	controls.maxDistance = 35;
	controls.minDistance = 15;
	controls.minAzimuthAngle = Math.PI * -0.5;
    controls.maxAzimuthAngle = Math.PI * 0.5;



	update(renderer, scene, camera, controls, clock);

	return scene;
}

function getBox(w, h, d) {
	var geometry = new THREE.BoxBufferGeometry( w, h, d );
	var edges = new THREE.EdgesGeometry( geometry );
	var line = new THREE.LineSegments( edges, new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 1,} ) ); 
	var material = new THREE.MeshLambertMaterial({
		color : '#06c258',
	});
	var mesh = new THREE.Mesh( geometry, material); 
	//mesh.add(line);
	mesh.receiveShadow = true;
	mesh.castShadow = true;


	return mesh;
}

function getBoxGrid(amount, separationMultiplier) {
	var group = new THREE.Group();
	var textureLoader = new THREE.TextureLoader();
	var groundTex = textureLoader.load( './grasslight-big.jpg' );

	for (var i=0; i<amount; i++) {
		var obj = getBox(1, 1, 1);
		obj.position.x = i * separationMultiplier;
		obj.position.y = obj.geometry.parameters.height/2;
		obj.material.map = groundTex;
		group.add(obj);
		for (var j=1; j<amount; j++) {
			var obj = getBox(1, 1, 1);
			obj.position.x = i * separationMultiplier;
			obj.position.y = obj.geometry.parameters.height/2;
			obj.position.z = j * separationMultiplier;
			obj.material.map = groundTex;
			group.add(obj);
		}
	}

	group.position.x = -(separationMultiplier * (amount-1))/2;
	group.position.z = -(separationMultiplier * (amount-1))/2;

	group.children.forEach(function(child, index) {
		var height = [1, 2, 3, 4];
		child.scale.y = (Math.floor(Math.random() * height.length + 1));
		child.position.y = child.scale.y/2;
	});

	return group;
}



function getPlane(size) {
	// var gridHelper = new THREE.GridHelper( size, 1 );
	var geometry = new THREE.PlaneGeometry(size, size);
	var material = new THREE.MeshPhongMaterial({
		color: 'rgb(120, 120, 120)',
		side: THREE.DoubleSide
	});
	var mesh = new THREE.Mesh(
		geometry,
		material 
	);
	mesh.receiveShadow = true;

	return mesh;
}


function getWater(size) {
	var textureLoader = new THREE.TextureLoader();
	var colorMap = textureLoader.load('./water.jpg');
	var geometry = new THREE.BoxGeometry(size, size, size);
	var material = new THREE.MeshPhongMaterial({
		map : colorMap,
		color: 'rgb(65, 105, 255)',
	});
	var mesh = new THREE.Mesh(
		geometry,
		material 
	);
	mesh.receiveShadow = true;

	return mesh;
}

function getWaterHeight(boxGrid, waterheight){
		var height;
			switch (waterheight.position.y) {
	  		case -3:
	    		height = 0;
	    		break;
	  		case -2:
	    		height = 1;
	    		break;
	  		case -1:
	     		height = 2;
	    		break;
	  		case 0:
	    		height = 3;
	    		break;
	  		case -0:
	    		height = 3;
	    		break;
	  		case 1:
	    		height = 4;
	    		break;
	  		case 2:
	    		height = 5;
			}
		var addedWaterlevel = 0;
		boxGrid.children.forEach(function(child, index){
			if(height >= child.scale.y){
				addedWaterlevel += (height - child.scale.y + 1);
			};
		});
		return addedWaterlevel;
}


function getSphere(size) {
	var geometry = new THREE.SphereGeometry(size, 24, 24);
	var material = new THREE.MeshBasicMaterial({
		color: 'rgb(255, 255, 255)'
	});
	var mesh = new THREE.Mesh(
		geometry,
		material 
	);

	return mesh;
}

function getPointLight(intensity) {
	var light = new THREE.PointLight(0xffffff, intensity);
	light.castShadow = true;

	return light;
}

function getAmbientLight() {
	var light = new THREE.AmbientLight( 0xEEEEEE );

	return light;
}

function getSpotLight(intensity) {
	var light = new THREE.SpotLight(0xffffff, intensity);
	light.castShadow = true;

	light.shadow.bias = 0.001;
	light.shadow.mapSize.width = 2048;
	light.shadow.mapSize.height = 2048;

	return light;
}


function getDirectionalLight(intensity) {
	var light = new THREE.DirectionalLight(0xffffff, intensity);
	light.castShadow = true;

	light.shadow.camera.left = -10;
	light.shadow.camera.bottom = -10;
	light.shadow.camera.right = 10;
	light.shadow.camera.top = 10;

	//Set up shadow properties for the light
	light.shadow.mapSize.width = 1024;  // default: 512
	light.shadow.mapSize.height = 1024; // default: 512
	// light.bias = 0.001;

	return light;
}

function update(renderer, scene, camera, controls, clock) {
	renderer.render(
		scene,
		camera
	);


	var timeElapsed = clock.getElapsedTime();
	
	var boxGrid2 = scene.getObjectByName('boxGrid2');

	if (timeElapsed <= 10 && timeElapsed >= 5){
	boxGrid2.children.forEach(function(child, index) {
		if ((3 - child.scale.y) > 0.00001){
		if (child.scale.y < 3){
			child.scale.y += 0.01;
			child.position.y = child.scale.y/2;
		}
		else{
			child.scale.set.y = 3;
			child.position.y = child.scale.y/2;
		}
	}
	if ((6 - child.scale.y) > 0.00001){
		if (child.scale.y > 3){
			child.scale.y -= 0.01;
			child.position.y = child.scale.y/2;
		}
		else{
			child.scale.set.y = 3;
			child.position.y = child.scale.y/2;
		}
	}
	});
}

	requestAnimationFrame(function() {
		update(renderer, scene, camera, controls, clock);
	})
}

var scene = init();