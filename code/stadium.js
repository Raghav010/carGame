import * as THREE from 'three';
import { Clock, KeepStencilOp, MathUtils, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


// variables
const xaxis=new Vector3(1,0,0);
const yaxis=new Vector3(0,1,0);
const zaxis=new Vector3(0,0,1);
let viewMode="third";
const minimap_width=window.innerWidth/6;
const minimap_height=window.innerWidth/6;
const third_CamHeight=0.45;
const driver_CamHeight=0.15;
const turning_radius=2;
const third_CamTarget=6;
const driver_CamTarget=13;
// horizontal cam in code below
let carVel=0;
const carPower=3.5;
const carBrakePower=3.5;
const friction=2;


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
miniRenderer.setSize(minimap_width,minimap_height);
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


    const pointLight=new THREE.PointLight("white",0.8,1000);
    pointLight.position.set(0,15,0);
    scene.add(pointLight);

    

    // loading all meshes into the app
    const loader=new GLTFLoader();
    const cons_stadiumData=await loader.loadAsync("../Meshes/full_stadium_myTrack.glb");
    console.log(cons_stadiumData)
    const car=cons_stadiumData.scene.children[6];
    const track=cons_stadiumData.scene.children[2];
    const outer_stadium=cons_stadiumData.scene.children[1];
    const inner_stadium=cons_stadiumData.scene.children[0];




    // adding meshes to the scene
    scene.add(cons_stadiumData.scene);



    // configuring these meshes
    car.rotation.z+=MathUtils.degToRad(180); // local coordinate frame of car
    let carLookDir=new Vector3(0,0,-1); // front of the car


    // initial camera config
    // minimap config
    setCameraPos(car.position.x,4,car.position.z,car.position,"minimap");
    // third config
    const third_vert_CamPos=yaxis.clone().multiplyScalar(third_CamHeight);
    // driver config
    const driver_vert_CamPos=yaxis.clone().multiplyScalar(driver_CamHeight);



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

        if(e.key=="p" && e.type=="keyup")
        {
            console.log(car.position.x,car.position.z,car.position.y);
        }
    }
    document.onkeydown=Pressed;
    document.onkeyup=Pressed;



    function moveCar()
    {
        let delta=clock.getDelta();
        if (keysPressed["a"]) {
            car.rotation.z += MathUtils.degToRad(turning_radius);
            carLookDir.applyAxisAngle(new Vector3(0, 1, 0), MathUtils.degToRad(turning_radius));
        }
        if (keysPressed["d"]) {
            car.rotation.z -= MathUtils.degToRad(turning_radius);
            carLookDir.applyAxisAngle(new Vector3(0, 1, 0), MathUtils.degToRad(-turning_radius));
        }
        if (keysPressed["w"]) {
            carVel+=((carPower)*delta);
            //car.position+=(carLookDir*0.05);
        }
        if (keysPressed["s"]) {
            carVel+=((-carBrakePower)*delta);
            //car.position.z-=(carLookDir*0.05);
        }
        if(carVel!=0 && !(carVel<0.001 && carVel>-0.001))
        {
            let fricDir=(carVel>0)?(-friction):friction;
            carVel+=(fricDir*delta);
            car.position.add(carLookDir.clone().multiplyScalar(carVel*delta));


            // checking for out of bounds(out of stadium)
            if(car.position.x>=16.3 || car.position.x <=-24.5)
            {
                if(carLookDir.dot(zaxis)>=0)
                {
                    car.rotation.z=MathUtils.degToRad(0);
                    carLookDir=zaxis.clone();
                }
                else if(carLookDir.dot(zaxis.clone().multiplyScalar(-1))>0)
                {
                    car.rotation.z=MathUtils.degToRad(180);
                    carLookDir=zaxis.clone().multiplyScalar(-1);
                }
                car.position.x+=((car.position.x<=-24.5)?0.05:-0.05);
                carVel=0;
            }
            if(car.position.z>=29 || car.position.z <=-31)
            {
                if(carLookDir.dot(xaxis)>=0)
                {
                    car.rotation.z=MathUtils.degToRad(90);
                    carLookDir=xaxis.clone();
                }
                else if(carLookDir.dot(xaxis.clone().multiplyScalar(-1))>0)
                {
                    car.rotation.z=MathUtils.degToRad(-90);
                    carLookDir=xaxis.clone().multiplyScalar(-1);
                }
                car.position.z+=((car.position.z<=-31)?0.05:-0.05);
                carVel=0;
            }


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
            let thirdTarget=(carLookDir.clone().multiplyScalar(third_CamTarget)).add(car.position);
            const horiz_CamPos=(carLookDir.clone().multiplyScalar(-0.8)).add(car.position);
            const CamPos=horiz_CamPos.clone().add(third_vert_CamPos);
            setCameraPos(CamPos.x,CamPos.y,CamPos.z,thirdTarget,cam);
        }
        else if(Mode=="driver")
        {
            let driverTarget=(carLookDir.clone().multiplyScalar(driver_CamTarget)).add(car.position);
            const horiz_CamPos=(carLookDir.clone().multiplyScalar(0.023)).add(car.position);
            const CamPos=horiz_CamPos.clone().add(driver_vert_CamPos);
            setCameraPos(CamPos.x,CamPos.y,CamPos.z,driverTarget,cam);
        }
    }


    // setting up the clock
    let clock=new THREE.Clock();


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

