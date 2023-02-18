import * as THREE from 'three';
import { KeepStencilOp, MathUtils, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


// variables
const xaxis=new Vector3(1,0,0);
const yaxis=new Vector3(0,1,0);
const zaxis=new Vector3(0,0,1);
let viewMode="third";




// creating the scene and camera
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,1000);

// creating minimap cam
const miniCam=new THREE.OrthographicCamera(-3,3,3,-3,0.1,1000);

// normal renderer
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.setClearColor("#87CEEB");
document.body.appendChild(renderer.domElement);


//mini-map renderer
const miniRenderer=new THREE.WebGLRenderer({antialias:true});
miniRenderer.setSize(window.innerWidth/6,window.innerWidth/6);
miniRenderer.domElement.style.position="absolute";
miniRenderer.domElement.style.top=20+"px";
miniRenderer.domElement.style.left=20+"px";
document.body.appendChild(miniRenderer.domElement);





function setCameraPos(x,y,z,lookAtVec,cam)
{
    if(cam=="normal")
    {
        camera.position.x=x;
        camera.position.y=y;
        camera.position.z=z;
        camera.lookAt(lookAtVec);
    }
    else
    {
        miniCam.position.x=x;
        miniCam.position.y=y;
        miniCam.position.z=z;
        miniCam.lookAt(lookAtVec);
    }
}


async function main()
{


    // adding lighting
    const ambientLight=new THREE.AmbientLight('white',1);
    scene.add(ambientLight);


    const pointLight=new THREE.PointLight("white",0.4,300);
    pointLight.position.set(0,15,0);
    scene.add(pointLight);

    

    // loading all meshes into the app
    const loader=new GLTFLoader();
    const cons_stadiumData=await loader.loadAsync("../Meshes/full_stadium.glb");
    //console.log(cons_stadiumData)
    const car=cons_stadiumData.scene.children[3];
    const track=cons_stadiumData.scene.children[2];
    const outer_stadium=cons_stadiumData.scene.children[1];
    const inner_stadium=cons_stadiumData.scene.children[0];




    // adding meshes to the scene
    scene.add(cons_stadiumData.scene);



    // configuring these meshes
    car.rotation.z+=MathUtils.degToRad(180); // local coordinate frame of car
    const carLookDir=new Vector3(0,0,-1); // front of the car


    // initial camera config
    // minimap config
    setCameraPos(car.position.x,4,car.position.z,car.position,"minimap");
    // third config
    /*let thirdTarget=(carLookDir.clone().multiplyScalar(6)).add(car.position);
    const third_init_horiz_CamPos=(carLookDir.clone().multiplyScalar(-0.7)).add(car.position);*/
    const third_vert_CamPos=yaxis.clone().multiplyScalar(0.45);
    /*const third_init_CamPos=third_init_horiz_CamPos.clone().add(third_vert_CamPos);
    setCameraPos(third_init_CamPos.x,third_init_CamPos.y,third_init_CamPos.z,thirdTarget);*/
    // driver config
    /*let driverTarget=(carLookDir.clone().multiplyScalar(15)).add(car.position);
    const driver_init_horiz_CamPos=(carLookDir.clone().multiplyScalar(0.03)).add(car.position);*/
    const driver_vert_CamPos=yaxis.clone().multiplyScalar(0.2);
    /*const driver_init_CamPos=driver_init_horiz_CamPos.clone().add(driver_vert_CamPos);
    setCameraPos(driver_init_CamPos.x,driver_init_CamPos.y,driver_init_CamPos.z,driverTarget);*/



    // keybindings - this method supports multiple keys being pressed at the same time
    var keysPressed={};
    function Pressed(e)
    {
        if(e.key=="w" || e.key=="s" || e.key=="a" || e.key=="d")
        {
            keysPressed[e.key]=(e.type=="keydown");
        }

        // toggle between third and driver views
        if(e.key=="t" && e.type=="keyup")
        {
            // toggle views here
            viewMode=(viewMode=="third")?"driver":"third";
        }
    }
    
    document.onkeydown=Pressed;
    document.onkeyup=Pressed;

    function moveCar()
    {
        if (keysPressed["a"]) {
            car.rotation.z += MathUtils.degToRad(1);
            carLookDir.applyAxisAngle(new Vector3(0, 1, 0), MathUtils.degToRad(1));
        }
        if (keysPressed["d"]) {
            car.rotation.z -= MathUtils.degToRad(1);
            carLookDir.applyAxisAngle(new Vector3(0, 1, 0), MathUtils.degToRad(-1));
        }
        if (keysPressed["w"]) {
            //car.position+=(carLookDir*0.05);
            car.position.add(carLookDir.clone().multiplyScalar(0.05));
        }
        if (keysPressed["s"]) {
            //car.position.z-=(carLookDir*0.05);
            car.position.add(carLookDir.clone().multiplyScalar(-0.05));
        }
    }



    function moveCamera(Mode,cam)
    {
        if(Mode=="minimap")
        {
            setCameraPos(car.position.x,4,car.position.z,car.position,cam);
        }
        else if(Mode=="third")
        {
            let thirdTarget=(carLookDir.clone().multiplyScalar(6)).add(car.position);
            const horiz_CamPos=(carLookDir.clone().multiplyScalar(-0.8)).add(car.position);
            const CamPos=horiz_CamPos.clone().add(third_vert_CamPos);
            setCameraPos(CamPos.x,CamPos.y,CamPos.z,thirdTarget,cam);
        }
        else if(Mode=="driver")
        {
            let driverTarget=(carLookDir.clone().multiplyScalar(15)).add(car.position);
            const horiz_CamPos=(carLookDir.clone().multiplyScalar(0.03)).add(car.position);
            const CamPos=horiz_CamPos.clone().add(driver_vert_CamPos);
            setCameraPos(CamPos.x,CamPos.y,CamPos.z,driverTarget,cam);
        }
    }





    // animation loop
    function animate(){
        requestAnimationFrame(animate);
        moveCar();
        moveCamera(viewMode,"normal");
        moveCamera("minimap","minimap");
        renderer.render(scene,camera);

        miniRenderer.render(scene,miniCam);
    }
    animate();
    
}






main();

