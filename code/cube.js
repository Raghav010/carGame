import * as THREE from 'three';

const scene=new THREE.Scene();

const camera=new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,1000);

const renderer=new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth,window.innerHeight);
document.body.appendChild(renderer.domElement);



const cubeGeom=new THREE.BoxGeometry(1,1,1);

const material=new THREE.MeshBasicMaterial({color:0x00ff00});

const cubeMesh=new THREE.Mesh(cubeGeom,material);
scene.add(cubeMesh);

camera.position.z=5;


function rotCube(e)
{
    if(e.keyCode === 82)
    {
        cubeMesh.rotation.y+=0.05;
    }
}

document.onkeydown=rotCube;



function animate()
{
    requestAnimationFrame(animate);
    renderer.render(scene,camera);
    //cubeMesh.rotation.x+=0.01;
    //cubeMesh.rotation.y+=0.01;
}
animate();