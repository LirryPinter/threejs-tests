function init() {
	var scene = new THREE.Scene();
	var gui = new dat.GUI();
	var clock = new THREE.Clock();

	// background and fog
	scene.background = new THREE.Color( 'black' );
	//scene.fog = new THREE.Fog( 0xcce0ff, 20, 70 ); 

	// load external geometry
	var textureLoader = new THREE.TextureLoader();
	var objLoader = new THREE.OBJLoader();
	var colorMap = textureLoader.load('./water.jpg');
	var groundTexture = textureLoader.load( './grasslight-big.jpg' );
	var groundTex = textureLoader.load('./gound.jpg');
	var groundWaterTex = textureLoader.load('./groundwater.jpg');

 		
	var directionalLight = new getDirectionalLight();
	var ambientLight = new getAmbientLight();

	// // ground
	
	// groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
	// groundTexture.repeat.set( 10, 10 );
	// groundTexture.anisotropy = 16;
	// groundTexture.encoding = THREE.sRGBEncoding;
	// var groundMaterial = new THREE.MeshLambertMaterial( { map: groundTexture } );
	// var mesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 100, 100 ), groundMaterial );
	// mesh.rotation.x = - Math.PI / 2;
	// mesh.position.y = 0;
	// mesh.receiveShadow = true;
	// scene.add( mesh );

	// boxes
	var distanceObj = function(){
		this.distance = -1;
	} 	
	var dis = new distanceObj();
	var boxGroup = new THREE.Object3D();
	boxGroup.name = 'boxGroup';

	var groundWaterBox = getBox(4,6,4, 'lightblue', groundWaterTex);
	var groundBox = getBox(4, 4,4, '', groundWaterTex);
	var surfaceWaterBox =  getBox(4,3,4, '', colorMap, 0.5);
	var infiltrationBox = getBox(4,0.5,4, '', groundTexture);

	groundBox.position.y = groundWaterBox.geometry.parameters.height - (dis.distance * 0.5);
	surfaceWaterBox.position.y = groundBox.position.y + groundBox.geometry.parameters.height - (dis.distance * 0.2);
	infiltrationBox.position.y = surfaceWaterBox.position.y + surfaceWaterBox.geometry.parameters.height - (dis.distance* 1);
	

	boxGroup.add(groundWaterBox, groundBox, surfaceWaterBox, infiltrationBox);
	boxGroup.scale.y = 0.7;


	directionalLight.position.x = 13;
	directionalLight.position.y = 10;
	directionalLight.position.z = 10;
	directionalLight.intensity = 1.2;

	//scene.add(directionalLight);
	scene.add(ambientLight);
	scene.add(boxGroup);

	var groundWaterFlowIn = getWaterStream(3, 0.1, 0.1);
	var groundWaterFlowOut = getWaterStream(3, 0.1, 0.1);
	groundWaterFlowIn.position.x = 0;
	groundWaterFlowIn.position.z = 0.2;
	//groundWaterFlowOut.position.z = -0.2;
	groundWaterFlowIn.name = 'groundWaterFlowIn';
	groundWaterFlowOut.name = 'groundWaterFlowOut';
	scene.add(groundWaterFlowIn);
	scene.add(groundWaterFlowOut);





	// camera
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

    //gui
    var f1 = gui.addFolder('light');
	f1.add(ambientLight, 'intensity', 0, 10).name('light intensity');
	f1.add(directionalLight.position, 'x', 0, 20).name('light x position');
	f1.add(directionalLight.position, 'y', 0, 20).name('light y position');
	f1.add(directionalLight.position, 'z', 0, 20).name('light z position');

	gui.add(boxGroup.position, 'y', -10, 10)
	gui.add(dis, 'distance', -5, -1, 1).onChange(function(){
	groundBox.position.y = groundWaterBox.geometry.parameters.height - (dis.distance * 0.05);
	surfaceWaterBox.position.y = groundBox.position.y + groundBox.geometry.parameters.height - (dis.distance * 0.05);
	infiltrationBox.position.y = surfaceWaterBox.position.y + surfaceWaterBox.geometry.parameters.height - (dis.distance * 0.1);
	});

	update(renderer, scene, camera, controls, clock);

	return scene;
}


function deleteObj(objName){
        var selectedObject = scene.getObjectByName(objName);
        scene.remove( selectedObject );
    }

function getBox(w, h, d, color, map, opacity) {
	var geometry = new THREE.BoxBufferGeometry( w, h, d );
	var edges = new THREE.EdgesGeometry( geometry );
	var line = new THREE.LineSegments( edges, new THREE.LineBasicMaterial( { color: 'darkgrey', linewidth: 1,} ) ); 
	var material = new THREE.MeshPhongMaterial({
		color : color,
		map : map,
		transparent : true,
		opacity : opacity,
	});
	var mesh = new THREE.Mesh( geometry, material); 
	mesh.add(line);
	//mesh.receiveShadow = true;
	//mesh.castShadow = true;
	return mesh;
}

function getLine(step, array, color){
	var graphGeometry = new THREE.Geometry();
	var steps = [-2.5, 0, 2.5, 5];
	console.log('step ' + step);
	graphGeometry.vertices.push(new THREE.Vector3(-5, 6, 0.01)); 
	//graphGeometry.vertices.push(new THREE.Vector3(steps[step - 1], 6, 0.01));
	for (var i = 0; i < step; i ++) {
        graphGeometry.vertices.push(
	    new THREE.Vector3(steps[i], ((array[i]*0.03) + 6), 0.01),
	    );
       }
	var graphMat = new THREE.LineBasicMaterial({
	    color: color,
	    linewidth: 3,
	});
	var graphLine = new THREE.Line(graphGeometry, graphMat);
	return graphLine;
}

function getWaterStream(w, h, d){
	var particleMat = new THREE.PointsMaterial({
		color: '#10A5F5',
		size: 0.20,
		map: new THREE.TextureLoader().load('./particle.jpg'),
		transparent: true,
		blending: THREE.AdditiveBlending,
		depthWrite: false
	});

	var particleGeo = new THREE.BoxGeometry( w, h, d, 64);

	particleGeo.vertices.forEach(function(vertex) {
		vertex.x += (Math.random() - 0.5);
		vertex.y += (Math.random() - 0.5);
		vertex.z += (Math.random() - 0.5);
	});

	var particleSystem = new THREE.Points(
		particleGeo,
		particleMat
	);
	return particleSystem;
}



function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}



function getPlane(width, height) {
	var geometry = new THREE.PlaneGeometry(width, height);
	var material = new THREE.MeshPhongMaterial({
		color: 'rgb(250, 250, 250)',
		side: THREE.DoubleSide
	});
	var mesh = new THREE.Mesh(
		geometry,
		material, 
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

	var boxGroup = scene.getObjectByName('boxGroup');
	boxGroup.children[0].geometry.attributes.position.needsUpdate = true;
	boxGroup.children[1].geometry.attributes.position.needsUpdate = true;
	boxGroup.children[2].geometry.attributes.position.needsUpdate = true;
	boxGroup.children[3].geometry.attributes.position.needsUpdate = true;

	var particleSystem = scene.getObjectByName('groundWaterFlowOut');
	particleSystem.geometry.vertices.forEach(function(particle){
		particle.x += (Math.random() - 1) * 0.1;

		if (particle.x < -4){
			particle.x = 0;
		}
	});
	particleSystem.geometry.verticesNeedUpdate = true;

	var particleSystem2 = scene.getObjectByName('groundWaterFlowIn');
	particleSystem2.geometry.vertices.forEach(function(particle){
		particle.x += (Math.random() + 0.5) * 0.1;

		if (particle.x > 0){
			particle.x = -4;
		}
	});
	particleSystem2.geometry.verticesNeedUpdate = true;


	requestAnimationFrame(function() {
		update(renderer, scene, camera, controls, clock);
	})
}

var scene = init();