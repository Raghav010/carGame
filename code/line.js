import * as THREE from 'three';



// creating the scene and camera
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,1000);

const renderer=new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth,window.innerHeight);
document.body.appendChild(renderer.domElement);


// materials
const GreenLineMaterial=new THREE.LineBasicMaterial({color:0x00ff00});
const BlueLineMaterial=new THREE.LineBasicMaterial({color:0x0000ff});
const RedLineMaterial=new THREE.LineBasicMaterial({color:0xff0000});


// setting up the geometry
const x_axis=[];
const y_axis=[];
const z_axis=[];

x_axis.push(new THREE.Vector3(0,0,0));
x_axis.push(new THREE.Vector3(5,0,0));

y_axis.push(new THREE.Vector3(0,0,0));
y_axis.push(new THREE.Vector3(0,5,0));

z_axis.push(new THREE.Vector3(0,0,0));
z_axis.push(new THREE.Vector3(0,0,5));

const x_geom=new THREE.BufferGeometry().setFromPoints(x_axis);
const y_geom=new THREE.BufferGeometry().setFromPoints(y_axis);
const z_geom=new THREE.BufferGeometry().setFromPoints(z_axis);



// creating the mesh with geometry and material
const x_line=new THREE.Line(x_geom,GreenLineMaterial);
const y_line=new THREE.Line(y_geom,BlueLineMaterial);
const z_line=new THREE.Line(z_geom,RedLineMaterial);




// rendering
camera.position.z=6;
camera.position.y=6;
camera.position.x=6;
camera.lookAt(new THREE.Vector3(0,0,0));
scene.add(x_line);
scene.add(y_line);
scene.add(z_line);



renderer.render( scene, camera );