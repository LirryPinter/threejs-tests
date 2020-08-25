function init() {
	var scene = new THREE.Scene();
	var gui = new dat.GUI();
	var clock = new THREE.Clock();
	var raycaster = new THREE.Raycaster();

	


	// collect objects for raycasting, 
	// for better performance don't raytrace all scene
	var tooltipEnabledObjects = [];

	// this will be 2D coordinates of the current mouse position, [0,0] is middle of the screen.
	var mouse = new THREE.Vector2();

	var latestMouseProjection; // this is the latest projection of the mouse on object (i.e. intersection with ray)
	var hoveredObj; // this objects is hovered at the moment

	// tooltip will not appear immediately. If object was hovered shortly,
	// - the timer will be canceled and tooltip will not appear at all.
	var tooltipDisplayTimeout;


	// cubemap and env
	var planeMaterial = ('standard', 'rgb(255,255,255)');
	var plane = getPlane(planeMaterial, 30);

	var path = './env/';
	var format = '.jpg';
	var urls = [
		path + 'negx' + format,
		path + 'posx' + format,
		path + 'posy' + format,
		path + 'negy' + format,
		path + 'negz' + format,
		path + 'posz' + format, 
	];
	var envCube = new THREE.CubeTextureLoader().load(urls);
	envCube.format = THREE.RGBFormat;
	

	// background and fog
	//scene.background = envCube;
	//scene.fog = new THREE.Fog( 0xcce0ff, 20, 70 );
	scene.background = new THREE.Color( 'black' ); 

	// load external geometry
	var textureLoader = new THREE.TextureLoader();
	var objLoader = new THREE.OBJLoader();
	var waterTex = textureLoader.load('./water.jpg');
	var groundTexture = textureLoader.load( './grasslight-big.jpg' );
	var groundTex = textureLoader.load('./gound.jpg');
	var groundWaterTex = textureLoader.load('./groundwater.jpg');
	var cloudTex = textureLoader.load("smoke.png");

 		
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
	var surfaceWaterBox =  getBox(4,3,4, '', waterTex, 0.5);
	surfaceWaterBox.envMap = envCube;
	envCube.mapping = THREE.EquirectangularRefractionMapping;
	var infiltrationBox = getBox(4,0.5,4, '', groundTexture);

	groundBox.position.y = groundWaterBox.geometry.parameters.height - (dis.distance * 0.5);
	surfaceWaterBox.position.y = groundBox.position.y + groundBox.geometry.parameters.height - (dis.distance * 0.5);
	infiltrationBox.position.y = surfaceWaterBox.position.y + surfaceWaterBox.geometry.parameters.height - 0.3	

	boxGroup.add(groundWaterBox, groundBox, surfaceWaterBox, infiltrationBox);
	boxGroup.scale.y = 0.7;


	directionalLight.position.x = 13;
	directionalLight.position.y = 10;
	directionalLight.position.z = 10;
	directionalLight.intensity = 1.2;

	//scene.add(directionalLight);
	scene.add(ambientLight);
	scene.add(boxGroup);


	// ground water flow
	var groundWaterFlow = new THREE.Object3D();
	var groundWaterFlowIn = getWaterStream(3, 0.1, 0.1);
	var groundWaterFlowOut = getWaterStream(3, 0.1, 0.1);
	groundWaterFlowIn.position.x = -1;
	groundWaterFlowOut.position.x = -1;
	//groundWaterFlowIn.position.x = 0;
	groundWaterFlowIn.position.z = 0.2;
	groundWaterFlowIn.name = 'Groundwater Flow';
	tooltipEnabledObjects.push(groundWaterFlowIn);
	groundWaterFlowOut.name = 'groundWaterFlowOut';
	groundWaterFlow.add(groundWaterFlowIn);
	groundWaterFlow.add(groundWaterFlowOut);
	groundWaterFlow.scale.y = 0.37;
	groundWaterFlow.scale.z = 0.37;
	groundWaterFlow.scale.x = 0.5;
	groundWaterFlow.position.x = -1.5;
	scene.add(groundWaterFlow)
	

	// surface water flow
	var surfaceWaterFlow = new THREE.Object3D();
	var surfaceWaterFlowIn = getWaterStream(2, 0.1, 0.1);
	var surfaceWaterFlowOut = getWaterStream(2, 0.1, 0.1);
	surfaceWaterFlowIn.position.x = -1;
	surfaceWaterFlowOut.position.x = -1;
	surfaceWaterFlowIn.position.z = 0.2;
	surfaceWaterFlowIn.name = 'Overland Flow';
	tooltipEnabledObjects.push(surfaceWaterFlowIn);
	surfaceWaterFlowOut.name = 'surfaceWaterFlowOut';
	surfaceWaterFlow.add(surfaceWaterFlowIn);
	surfaceWaterFlow.add(surfaceWaterFlowOut);
	surfaceWaterFlow.scale.y = 0.37;
	surfaceWaterFlow.scale.z = 0.37;
	surfaceWaterFlow.scale.x = 0.5;
	surfaceWaterFlow.position.x = -1.5;
	surfaceWaterFlow.position.y = 7.5;
	scene.add(surfaceWaterFlow)

	// infiltration & seepage (groundwater)
	var gwInfiltration = getWaterStream(2, 0.1,0.1);
	gwInfiltration.position.x = -0.5;
	gwInfiltration.position.z = 0;
	gwInfiltration.position.y = -3;
	gwInfiltration.scale.x = 0.2;
	gwInfiltration.scale.z = 0.3;
	gwInfiltration.scale.y = 1.3;
	gwInfiltration.name = 'Infiltration (Groundwater)'
	tooltipEnabledObjects.push(gwInfiltration);
	scene.add(gwInfiltration);

	var gwSeepage = getWaterStream(2, 0.1,0.1);
	gwSeepage.position.x = 0.7;
	gwSeepage.position.z = 0;
	gwSeepage.position.y = -3;
	gwSeepage.scale.x = 0.2;
	gwSeepage.scale.z = 0.3;
	gwSeepage.scale.y = 1.3;
	gwSeepage.name = 'Seepage'
	tooltipEnabledObjects.push(gwSeepage);
	scene.add(gwSeepage);


	// Percolation & Capillary rise
	var percolation = getWaterStream(2, 0.1,0.1);
	percolation.position.x = -0.5;
	percolation.position.z = 0;
	percolation.position.y = 2.5;
	percolation.scale.x = 0.2;
	percolation.scale.z = 0.3;
	percolation.scale.y = 1.3;
	percolation.name = 'Percolation'
	tooltipEnabledObjects.push(percolation);
	scene.add(percolation);

	var capillaryRise = getWaterStream(2, 0.1,0.1);
	capillaryRise.position.x = 0.7;
	capillaryRise.position.z = 0;
	capillaryRise.position.y = 2.5;
	capillaryRise.scale.x = 0.2;
	capillaryRise.scale.z = 0.3;
	capillaryRise.scale.y = 1.3;
	capillaryRise.name = 'Capillary Rise'
	tooltipEnabledObjects.push(capillaryRise);
	scene.add(capillaryRise);

	// infiltration overland
	var swInfiltration = getWaterStream(2, 0.1,0.1);
	swInfiltration.position.x = -0.5;
	swInfiltration.position.z = 0;
	swInfiltration.position.y = 6;
	swInfiltration.scale.x = 0.2;
	swInfiltration.scale.z = 0.3;
	swInfiltration.scale.y = 1.3;
	swInfiltration.name = 'Infiltration'
	tooltipEnabledObjects.push(swInfiltration);
	scene.add(swInfiltration);






	// texts
	var textGroup = new THREE.Object3D();
	var loader = new THREE.FontLoader();
	loader.load( 'gentilis_bold.typeface.json', function ( font ) {
			var textGeometry = new THREE.TextGeometry( "Groundwater", {
				font: font,
		   		size: 1,
		    	height: 1,
		    	// curveSegments: 12,
			    // bevelThickness: 1,
			    // bevelSize: 1,
			    // bevelEnabled: true
		  		});
		  		var textMaterial =  new THREE.MeshStandardMaterial( { color: 'white', roughness: 0, metalness: 0.5 }
		  		);
		 		var mesh = new THREE.Mesh( textGeometry, textMaterial );
		 		mesh.scale.z = 0.01;
		 		mesh.scale.y = 0.4;
		 		mesh.scale.x = 0.4;
		 		mesh.position.y = 0;
		 		mesh.position.x = 3;
		 		mesh.position.z = 2;
		 		textGroup.add( mesh );
		 		mesh.name = ('otherModelsText');
				}); 
	loader.load( 'gentilis_bold.typeface.json', function ( font ) {
			var textGeometry = new THREE.TextGeometry( "Unsaturated zone", {
				font: font,
		   		size: 1,
		    	height: 1,
		    	// curveSegments: 12,
			    // bevelThickness: 1,
			    // bevelSize: 1,
			    // bevelEnabled: true
		  		});
		  		var textMaterial =  new THREE.MeshStandardMaterial( { color: 'white', roughness: 0, metalness: 0.5 }
		  		);
		 		var mesh = new THREE.Mesh( textGeometry, textMaterial );
		 		mesh.scale.z = 0.01;
		 		mesh.scale.y = 0.4;
		 		mesh.scale.x = 0.4;
		 		mesh.position.y = 4.5;
		 		mesh.position.x = 3;
		 		mesh.position.z = 2;
		 		textGroup.add( mesh );
		 		mesh.name = ('otherModelsText');
				});
		loader.load( 'gentilis_bold.typeface.json', function ( font ) {
			var textGeometry = new THREE.TextGeometry( "Surface water", {
				font: font,
		   		size: 1,
		    	height: 1,
		    	// curveSegments: 12,
			    // bevelThickness: 1,
			    // bevelSize: 1,
			    // bevelEnabled: true
		  		});
		  		var textMaterial =  new THREE.MeshStandardMaterial( { color: 'white', roughness: 0, metalness: 0.5 }
		  		);
		 		var mesh = new THREE.Mesh( textGeometry, textMaterial );
		 		mesh.scale.z = 0.01;
		 		mesh.scale.y = 0.4;
		 		mesh.scale.x = 0.4;
		 		mesh.position.y = 7.5;
		 		mesh.position.x = 3;
		 		mesh.position.z = 2;
		 		textGroup.add( mesh );
		 		mesh.name = ('otherModelsText');
				}); 
		loader.load( 'gentilis_bold.typeface.json', function ( font ) {
			var textGeometry = new THREE.TextGeometry( "Interception", {
				font: font,
		   		size: 1,
		    	height: 1,
		    	// curveSegments: 12,
			    // bevelThickness: 1,
			    // bevelSize: 1,
			    // bevelEnabled: true
		  		});
		  		var textMaterial =  new THREE.MeshStandardMaterial( { color: 'white', roughness: 0, metalness: 0.5 }
		  		);
		 		var mesh = new THREE.Mesh( textGeometry, textMaterial );
		 		mesh.scale.z = 0.01;
		 		mesh.scale.y = 0.4;
		 		mesh.scale.x = 0.4;
		 		mesh.position.y = 9.5;
		 		mesh.position.x = 3;
		 		mesh.position.z = 2;
		 		textGroup.add( mesh );
		 		mesh.name = ('otherModelsText');
				});        

	scene.add(textGroup)
	textGroup.name = 'textGroup'


	// rain
	var makeItRain = new THREE.Object3D();
	var rain = getRain(1500);
	makeItRain.add(rain);

	// cloud
	cloud = getCloud(cloudTex);
	cloud.position.z = -50;
	cloud.material.opacity = 0.6;
	cloud.name = 'cloud';
	//makeItRain.add(cloud);

	scene.add(makeItRain);
	makeItRain.visible = false;
	makeItRain.name = 'rain'
	

	




	// camera
	var camera = new THREE.PerspectiveCamera(
		45,
		window.innerWidth/window.innerHeight,
		1,
		1000
	);
	camera.position.x = 0.7;
	camera.position.y = 13;
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
	controls.maxDistance = 50;
	controls.minDistance = 15;
	controls.minAzimuthAngle = Math.PI * -0.5;
    controls.maxAzimuthAngle = Math.PI * 0.5;
    var initialAngle = controls.getAzimuthalAngle();
    controls.addEventListener('change', onPositionChange);

    function onPositionChange(o) {
    var axis = new THREE.Vector3(0, 3.5, 0).normalize();
    var textGroup = scene.getObjectByName('textGroup');


    var currentAngle = controls.getAzimuthalAngle();
	// console.log("the initial angle is:" + initialAngle);
	// console.log("the current angle is:" + currentAngle);
	// console.log("the difference is " + (Math.abs(initialAngle - currentAngle)));

		if (currentAngle > initialAngle){
			textGroup.rotateY(Math.abs(initialAngle - currentAngle));
			initialAngle = currentAngle;
		}
		if (currentAngle < initialAngle){
			textGroup.rotateY((Math.abs(initialAngle - currentAngle))* -1);
			initialAngle = currentAngle;
		}	
	
  	}




    //gui
    var f1 = gui.addFolder('light');
	f1.add(ambientLight, 'intensity', 0, 10).name('light intensity');
	f1.add(directionalLight.position, 'x', 0, 20).name('light x position');
	f1.add(directionalLight.position, 'y', 0, 20).name('light y position');
	f1.add(directionalLight.position, 'z', 0, 20).name('light z position');

	gui.add(makeItRain, 'visible').name('Rain');


	// This will move tooltip to the current mouse position and show it by timer.
	function showTooltip() {
	    var divElement = $("#tooltip");


	    if (divElement && latestMouseProjection) {
	        divElement.css({
	            display: "block",
	            opacity: 0.0
	        });

	        var canvasHalfWidth = renderer.domElement.offsetWidth / 2;
	        var canvasHalfHeight = renderer.domElement.offsetHeight / 2;

	        var tooltipPosition = latestMouseProjection.clone().project(camera);
	        tooltipPosition.x = (tooltipPosition.x * canvasHalfWidth) + canvasHalfWidth + renderer.domElement.offsetLeft;
	        tooltipPosition.y = -(tooltipPosition.y * canvasHalfHeight) + canvasHalfHeight + renderer.domElement.offsetTop;

	        var tootipWidth = divElement[0].offsetWidth;
	        var tootipHeight = divElement[0].offsetHeight;

	        divElement.css({
	            left: `${tooltipPosition.x - tootipWidth/2}px`,
	            top: `${tooltipPosition.y - tootipHeight - 5}px`
	        });

	        // var position = new THREE.Vector3();
	        // var quaternion = new THREE.Quaternion();
	        // var scale = new THREE.Vector3();
	        // hoveredObj.matrix.decompose(position, quaternion, scale);
	        divElement.text(hoveredObj.name);
	        console.log(hoveredObj.name);

	        setTimeout(function() {
	            divElement.css({
	                opacity: 1.0
	            });
	        }, 5);
	    }
	}

// This will immediately hide tooltip.
function hideTooltip() {
    var divElement = $("#tooltip");
    if (divElement) {
        divElement.css({
            display: "none"
        });
    }
}

// Following two functions will convert mouse coordinates
// from screen to three.js system (where [0,0] is in the middle of the screen)
function updateMouseCoords(event, coordsObj) {
    coordsObj.x = ((event.clientX - renderer.domElement.offsetLeft + 0.5) / window.innerWidth) * 2 - 1;
    coordsObj.y = -((event.clientY - renderer.domElement.offsetTop + 0.5) / window.innerHeight) * 2 + 1;
}


function handleManipulationUpdate() {
    raycaster.setFromCamera(mouse, camera); {
        var intersects = raycaster.intersectObjects(tooltipEnabledObjects);
        if (intersects.length > 0) {
        	console.log('yes');
            latestMouseProjection = intersects[0].point;
            hoveredObj = intersects[0].object;
        }
    }

    if (tooltipDisplayTimeout || !latestMouseProjection) {
        clearTimeout(tooltipDisplayTimeout);
        tooltipDisplayTimeout = undefined;
        hideTooltip();
    }

    if (!tooltipDisplayTimeout && latestMouseProjection) {
        tooltipDisplayTimeout = setTimeout(function() {
            tooltipDisplayTimeout = undefined;
            showTooltip();
        }, 330);
    }
}

function onMouseMove(event) {
    updateMouseCoords(event, mouse);
    latestMouseProjection = undefined;
    hoveredObj = undefined;
    handleManipulationUpdate();
}



	update(renderer, scene, camera, controls, clock);
	window.addEventListener('mousemove', onMouseMove, false);

	return scene;
}






function getText(text, font){
		var textGeometry = new THREE.TextGeometry( text, {
				font: '',
		   		size: 1,
		    	height: 1,
		 });
		var textMaterial =  new THREE.MeshStandardMaterial( { color: 0xA00000, roughness: 0, metalness: 0.5 });
		var mesh = new THREE.Mesh( textGeometry, textMaterial );
		mesh.scale.z = 0.2;   
		return mesh;
}


function getCloud (texture){
	 cloudGeo = new THREE.PlaneBufferGeometry(150,150);
	 cloudMaterial = new THREE.MeshLambertMaterial({
	    map: texture,
	    transparent: true
	  });
	  var cloud = new THREE.Mesh(cloudGeo, cloudMaterial);
	  return cloud;
};


function getRain(rainCount){
	rainGeo = new THREE.Geometry();
      for(let i=0;i<rainCount;i++) {
        rainDrop = new THREE.Vector3(
          Math.random() * 4,
          Math.random() * 100 - 25,
          Math.random() *4
        );
        rainDrop.velocity = {};
        rainDrop.velocity = 0;
        rainGeo.vertices.push(rainDrop);
      }
      rainMaterial = new THREE.PointsMaterial({
      	map: createCircleTexture('lightblue', 256),
        //color: 'lightblue',
        size: 0.2,
        transparent: true,
        opacity : 0.6,
        depthWrite : false,
      });


     rain = new THREE.Points(rainGeo,rainMaterial);
     rain.position.x = -2;
     rain.position.z = -2;
     return rain;
}


function createCircleTexture(color, size) {
  var matCanvas = document.createElement('canvas');
  matCanvas.width = matCanvas.height = size;
  var matContext = matCanvas.getContext('2d');
  // create texture object from canvas.
  var texture = new THREE.Texture(matCanvas);
  // Draw a circle
  var center = size / 2;
  matContext.beginPath();
  matContext.arc(center, center, size/2, 0, 2 * Math.PI, false);
  matContext.closePath();
  matContext.fillStyle = color;
  matContext.fill();
  // need to set needsUpdate
  texture.needsUpdate = true;
  // return a texture made from the canvas
  return texture;
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
	//mesh.add(line);
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
		color: '#2E3192',
		size: 0.12,
		map: new THREE.TextureLoader().load('./particle.jpg'),
		transparent: true,
		blending: THREE.AdditiveBlending,
		depthWrite: false
	});

	var particleGeo = new THREE.BoxGeometry( w, h, d, 128);

	particleGeo.vertices.forEach(function(vertex) {
		vertex.x += (Math.random() - 0.3);
		vertex.y += (Math.random() - 0.3);
		vertex.z += (Math.random() - 0.3);
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
	var light = new THREE.AmbientLight( 0xEEEEEE,  1.4);

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


	var cloud = scene.getObjectByName('cloud');

	rainGeo.vertices.forEach(p => {
        p.velocity -= 0.0005 + Math.random() * 0.0005;
        p.y += p.velocity;
        if (p.y < 9) {
          p.y = 50;
          p.velocity = 0;
        }
      });
      rainGeo.verticesNeedUpdate = true;


	


	function moveParticles(particles, inOut, lowY, highY){
		if (inOut == 'out'){
			particles.geometry.vertices.forEach(function(particle){
			particle.x += (Math.random() + 1) * -0.05;
			if (particle.x < -4){
				particle.x = 0;
			}
			});
		}
		if (inOut == 'in'){
			particles.geometry.vertices.forEach(function(particle){
			particle.x += (Math.random() + 1) * 0.05;
			if (particle.x > 0){
				particle.x = -4;
			}
			});
		}
		if (inOut == 'down'){
			particles.geometry.vertices.forEach(function(particle){
			particle.y += (Math.random() + 0.2) * -0.03;
			if (particle.y < lowY){
				particle.y = highY;
			}
			});
		}
		if (inOut == 'up'){
			particles.geometry.vertices.forEach(function(particle){
			particle.y += (Math.random() + 0.2) * 0.03;
			if (particle.y > highY){
				particle.y = lowY;
			}
			});
		}
	}


	var gwOutParticles = scene.getObjectByName('groundWaterFlowOut');
	moveParticles(gwOutParticles, 'out');
	gwOutParticles.geometry.verticesNeedUpdate = true;

	var gwInParticles = scene.getObjectByName('Groundwater Flow');
	moveParticles(gwInParticles, 'in'); 
	gwInParticles.geometry.verticesNeedUpdate = true;

	var gwUpParticles = scene.getObjectByName('Seepage');
	moveParticles(gwUpParticles, 'up', -0.5, 0.5);
	gwUpParticles.geometry.verticesNeedUpdate = true;

	var gwDownParticles = scene.getObjectByName('Infiltration (Groundwater)');
	moveParticles(gwDownParticles, 'down', -0.5, 0.5);
	gwDownParticles.geometry.verticesNeedUpdate = true;

	var infiltration = scene.getObjectByName('Infiltration');
	moveParticles(infiltration, 'down', -0.5, 0.5);
	infiltration.geometry.verticesNeedUpdate = true;

	var percolation = scene.getObjectByName('Percolation');
	moveParticles(percolation, 'down', -0.5, 0.5);
	percolation.geometry.verticesNeedUpdate = true;

	var capillaryRise = scene.getObjectByName('Capillary Rise');
	moveParticles(capillaryRise, 'up', -0.5, 0.5);
	capillaryRise.geometry.verticesNeedUpdate = true;


	var swOutParticles = scene.getObjectByName('surfaceWaterFlowOut');
	moveParticles(swOutParticles, 'out');
	swOutParticles.geometry.verticesNeedUpdate = true;

	var swInParticles = scene.getObjectByName('Overland Flow');
	moveParticles(swInParticles, 'in'); 
	swInParticles.geometry.verticesNeedUpdate = true;





	requestAnimationFrame(function() {
		update(renderer, scene, camera, controls, clock);
	})
}

var scene = init();