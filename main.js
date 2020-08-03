function init() {
	var scene = new THREE.Scene();
	var gui = new dat.GUI();
	var clock = new THREE.Clock();

	// background and fog
	scene.background = new THREE.Color( 0xcce0ff );
	scene.fog = new THREE.Fog( 0xcce0ff, 20, 70 ); 

	// load external geometry
	var textureLoader = new THREE.TextureLoader();
	var objLoader = new THREE.OBJLoader();
	var colorMap = textureLoader.load('./water.jpg');
	objLoader.load( '3di.obj', function ( object ) {
					object.traverse( function ( child ) {
						if ( child instanceof THREE.Mesh ) {
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
                    object.position.z = -7;
                    object.scale.x = 0.05;
                    object.scale.y = 0.05;
                    object.scale.z = 0.05;
                    obj = object
					scene.add( obj );
				} );
				console.log(scene);


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
		 		mesh.position.z = -7;
		 		scene.add( mesh );
		 		mesh.name = ('otherModelsText');
				});   
 		

	// initialize graph for waterdepth
	var graph = new THREE.Group();
	var graph3di = getPlane(10, 6);
	var gridHelper = new createAGrid();
	gridHelper.position.y = 9;
	gridHelper.position.z = 0;
	graph.add( gridHelper );
	graph.add(graph3di);


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

	// water, light and boxes
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
	graph.name = 'graph';
	
	water3di.rotation.x = Math.PI/2;
	water3di.position.y = -3;
	waterOther.rotation.x = Math.PI/2;
	waterOther.position.y = -3;
	directionalLight.position.x = 13;
	directionalLight.position.y = 10;
	directionalLight.position.z = 10;
	directionalLight.intensity = 3;

	scene.add(water3di);
	scene.add(waterOther);
	directionalLight.add(sphere);
	scene.add(directionalLight);
	scene.add(directionalLight2);
	scene.add(boxGrid);
	scene.add(boxGrid2);
	scene.add(graph);




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

	boxGrid.position.x -= 5;
	water3di.position.x -= 5;
	boxGrid2.position.x += 5;
	waterOther.position.x += 5;
	graph3di.position.y = 9;
	graph3di.position.z = 0;


	var currentStep = Math.abs(water3di.position.y - -3);
	var currentStep2 = Math.abs(waterOther.position.y - -3);
	var waterDepthArray = [];
	var waterDepthArray2 = [];

	var f1 = gui.addFolder('light');
	f1.add(directionalLight, 'intensity', 0, 10).name('light intensity');
	f1.add(directionalLight.position, 'x', 0, 20).name('light x position');
	f1.add(directionalLight.position, 'y', 0, 20).name('light y position');
	f1.add(directionalLight.position, 'z', 0, 20).name('light z position');
	gui.add(water3di.position, 'y', -3, 1, 1).name('waterheight 3Di').onChange(function(){
    var waterDepth = getWaterHeight(boxGrid, water3di);
    deleteObj('line');
    var step = Math.abs(water3di.position.y - -3);
    if (currentStep < step ){
    	waterDepthArray.push(waterDepth);
    	console.log(waterDepthArray);
    	currentStep = step;
    }
    var line = getLine(step, waterDepthArray, 0x0000ff);
    line.name = 'line'
    //line.visible = false;
    scene.add(line);
	});
	gui.add(waterOther.position, 'y', -3, 1, 1).name('waterheight other').onChange(function(){
    var waterDepth2 = getWaterHeight(boxGrid2, waterOther);
    deleteObj('line2');
    var step2 = Math.abs(waterOther.position.y - -3);
    if (currentStep2 < step2){
    	waterDepthArray2.push(waterDepth2);
    	console.log(waterDepthArray2);
    	currentStep2 = step2;
    }
    var line2 = getLine(step2, waterDepthArray2, 0x000000);
    line2.name = 'line2'
    //line2.visible = false;
    scene.add(line2);
	});;

	// hide graph and gui
	graph.visible = false;
	gui.add(graph,'visible').name('show graph');
	dat.GUI.toggleHide();



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


function deleteObj(objName){
        var selectedObject = scene.getObjectByName(objName);
        scene.remove( selectedObject );
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


function createAGrid(opts) {
	 var config = opts || {
	    height: 5,
	    width: 3,
	    linesHeight: 12,
	    linesWidth: 8,
	    color: 0xDD006C
	  };

     var material = new THREE.LineBasicMaterial({
       color: config.color,
       opacity: 0.2
     });

  	 var gridObject = new THREE.Object3D(),
      gridGeo = new THREE.Geometry(),
      stepw = 2 * config.width / config.linesWidth,
      steph = 2 * config.height / config.linesHeight;

    //width
      for (var i = -config.width; i <= config.width; i += stepw) {
        gridGeo.vertices.push(new THREE.Vector3(-config.height, i, 0));
        gridGeo.vertices.push(new THREE.Vector3(config.height, i, 0));
       }
    //height
      for (var i = -config.height; i <= config.height; i += steph) {
       gridGeo.vertices.push(new THREE.Vector3(i, -config.width, 0));
       gridGeo.vertices.push(new THREE.Vector3(i, config.width, 0));
      }
      var line = new THREE.LineSegments(gridGeo, material);
  	  gridObject.add(line);

    return gridObject;
}


function getBoxGrid(amount, separationMultiplier) {
	var group = new THREE.Group();
	var textureLoader = new THREE.TextureLoader();
	var groundTex = textureLoader.load( './grasslight-big.jpg' );

	// position of boxes within the grid
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

	// generate heights and shuffle
	var ones = heightGenerator(7, 1);
	var twos = heightGenerator(11, 2);
	var threes = heightGenerator(21, 3);
	var fours = heightGenerator(25, 4);
	var allNumbers = ones.concat(twos, threes, fours);
	shuffle(allNumbers)

	// logging
	const sum = allNumbers.reduce((a, b) => a + b, 0);
	const avg = (sum / allNumbers.length) || 0;
	console.log(`The sum is: ${sum}. The average is: ${avg}.`);

	// populating heights
	group.children.forEach(function(child, index) {
		child.scale.y = (allNumbers[index]);
		child.position.y = child.scale.y/2;
	});

	return group;
}


function heightGenerator(number, value){
	var array = [];
	for (i = 0; i < number; i ++){
		array.push(value);
	};
	return array;
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

	var timeElapsed = Math.floor(clock.getElapsedTime());
	var boxGrid2 = scene.getObjectByName('boxGrid2');
	var graph = scene.getObjectByName('graph');

	// if the graph is turned on, show the lines
	if(graph.visible){
		if (typeof scene.getObjectByName('line') != "undefined"){
			var line = scene.getObjectByName('line')
			line.visible = true;
		}
		if (typeof scene.getObjectByName('line2') != "undefined"){
			var line2 = scene.getObjectByName('line2')
			line2.visible = true;
		}
	}
	if(!graph.visible){
		if (typeof scene.getObjectByName('line') != "undefined"){
			var line = scene.getObjectByName('line')
			line.visible = false;
		}
		if (typeof scene.getObjectByName('line2') != "undefined"){
			var line2 = scene.getObjectByName('line2')
			line2.visible = false;
		}
	}




	if (timeElapsed <= 10 && timeElapsed >= 5){
		if(Math.floor(timeElapsed) == 10){
			dat.GUI.showGUI();
		}
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