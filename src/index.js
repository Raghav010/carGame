import * as THREE from 'three';
import { Box3, Clock, Group, KeepStencilOp, MathUtils, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


// variables-----------------------------------------------------
const xaxis=new Vector3(1,0,0);
const yaxis=new Vector3(0,1,0);
const zaxis=new Vector3(0,0,1);
let viewMode="third";
const minimap_width=window.innerWidth/6;
const minimap_height=window.innerWidth/6;
const third_CamHeight=0.45;
const driver_CamHeight=0.15;
const turning_radius=1.3;
const third_CamTarget=6;
const driver_CamTarget=13;
// horizontal cam in code below
let carVel=0;
const carPower=3.5;
const carBrakePower=3.5;
const friction=2;
const maxGasCans=20;
let gasCansOnTrack=0; // length of arr?
// [[gasCanObject,itsBoundingBox]]
const gasCanArr=[];
let health=100;
const trueFuelLoss=1;
const accFuelDrop=0.09;
const fuelCap=110;
let fuel=110; // litres
let gasCanFuel=5; // litres
// score?? time??
let fuelDist=0.81; // how far you can go on 1 litre
let loader=null;
let cons_stadiumData=null;
let gasCan=null;





// loading all the meshes first-----------------------------------------------
async function loadMeshes()
{
    // loading all meshes into the app
    loader=new GLTFLoader();
    cons_stadiumData=await loader.loadAsync("../Meshes/full_stadium_myTrack.glb");
    gasCan=await loader.loadAsync("../Meshes/gas-can.glb");
}
loadMeshes(); // calling before start page loads, so meshes can load in the background







// starting page-------------------------------------------------------
let startButton=document.createElement("button");
startButton.innerText="Start."
startButton.style.width="200px";
startButton.style.height="100px";
startButton.style.borderRadius="20%";
startButton.style.fontSize="30px";
startButton.style.fontWeight="bold";
startButton.style.position="absolute";
startButton.style.top="200px";
startButton.style.left="45%";
startButton.style.backgroundColor="#51AAAD";
startButton.onclick=startGame;

let start=document.createElement("div");
start.style.width="100vw";
start.style.height="100vh";
start.style.backgroundImage="url('../images/start_screen.png')";
start.appendChild(startButton);
document.body.appendChild(start);


function startGame()
{
    document.body.removeChild(start);
    main();
}










// main function ----------------------------------------
async function main()
{

    let animationFrameid=null;




    // initial camera and scene setup---------------------------------------------
    // creating the scene and camera
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,1000);

    // creating minimap cam
    const miniCam=new THREE.OrthographicCamera(-5,5,5,-5,0.1,1000);

    // normal renderer
    const renderer=new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(window.innerWidth,window.innerHeight);
    renderer.setClearColor("#51AAAD");
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

    // setting up stats
    let healthHUD=document.createElement("p"); 
    healthHUD.innerText="Health: "+health;
    healthHUD.style.fontSize="35px"
    healthHUD.style.fontWeight="bold";
    healthHUD.style.color="white";
    healthHUD.style.margin="0px";
    let fuelHUD=document.createElement("p");
    fuelHUD.innerText="Fuel: "+fuel;
    fuelHUD.style.fontSize="35px"
    fuelHUD.style.fontWeight="bold";
    fuelHUD.style.color="white";
    fuelHUD.style.margin="0px";
    let timeHUD=document.createElement("p");
    timeHUD.innerText="Time: 0";
    timeHUD.style.fontSize="35px"
    timeHUD.style.fontWeight="bold";
    timeHUD.style.color="white";
    timeHUD.style.margin="0px";
    let statBox=document.createElement("div");
    statBox.style.position="absolute";
    statBox.style.top="20px";
    statBox.style.right="20px";
    statBox.appendChild(healthHUD);
    statBox.appendChild(fuelHUD);
    statBox.appendChild(timeHUD);
    
    









    // More detailed configuration ----------------------------------------------------
    // adding lighting
    const ambientLight=new THREE.AmbientLight('white',1);
    scene.add(ambientLight);


    const pointLight=new THREE.PointLight("white",0.8,1000);
    pointLight.position.set(0,15,0);
    scene.add(pointLight);

    

   
    //console.log(cons_stadiumData)
    const car=cons_stadiumData.scene.children[6];
    const track=cons_stadiumData.scene.children[2];
    const outer_stadium=cons_stadiumData.scene.children[1];
    const inner_stadium=cons_stadiumData.scene.children[0];
    gasCan=gasCan.scene;
    



    // adding meshes to the scene
    scene.add(cons_stadiumData.scene);



    // configuring these meshes
    car.rotation.z+=MathUtils.degToRad(180); // local coordinate frame of car
    let carLookDir=new Vector3(0,0,-1); // front of the car
    const carBB=new THREE.Box3(new THREE.Vector3(),new THREE.Vector3());
    carBB.setFromObject(car);
    //console.log(carBB,car.position);
    gasCan.position.y=-7.14;
    gasCan.scale.set(1/6,1/6,1/6);


    // initial camera config
    // minimap config
    setCameraPos(car.position.x,4,car.position.z,car.position,"minimap");
    // third config
    const third_vert_CamPos=yaxis.clone().multiplyScalar(third_CamHeight);
    // driver config
    const driver_vert_CamPos=yaxis.clone().multiplyScalar(driver_CamHeight);


    function spawnGasCans()
    {
        for(let i=0;i<(maxGasCans-gasCansOnTrack);i++)
        {
            // make a radomized gas can
            const gasCanT=gasCan.clone();
            let track=Math.random();
            if(track < 0.5) // side tracks (along z axis)
            {
                gasCanT.position.z=(Math.random()*(54))-28;
                if(track<0.25)
                    gasCanT.position.x=(Math.random()*(6))-22;
                else
                    gasCanT.position.x=(Math.random()*(6))+9;
            }
            else // tracks along x axis
            {
                gasCanT.position.x=(Math.random()*(37))-22;
                if(track<0.75)
                    gasCanT.position.z=(Math.random()*(6))+20;
                else
                    gasCanT.position.z=(Math.random()*(6))-28;
            }
            // random rotation maybe
            const gasCanBB=new THREE.Box3(new THREE.Vector3(),new THREE.Vector3());
            gasCanBB.setFromObject(gasCanT);
            //console.log(gasCanBB,gasCanT.position);
            gasCanArr.push([gasCanT,gasCanBB]);
            scene.add(gasCanT);
        }
        gasCansOnTrack=maxGasCans;
    }
    spawnGasCans();







    
    // keybindings - this method supports multiple keys being pressed at the same time----------------------------
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
            console.log(carBB,car.position);
        }
    }
    document.onkeydown=Pressed;
    document.onkeyup=Pressed;













    // all per frame update functions---------------------------------------------------
    // moves car and the bounding box
    function moveCar()
    {
        // rot acc??
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
            if(trueFuelLoss)
                fuel-=accFuelDrop;
            //car.position+=(carLookDir*0.05);
        }
        if (keysPressed["s"]) {
            carVel+=((-carBrakePower)*delta);
            if(trueFuelLoss)
                fuel-=accFuelDrop;
            //car.position.z-=(carLookDir*0.05);
        }
        if(carVel!=0 && !(carVel<0.001 && carVel>-0.001))
        {
            let fricDir=(carVel>0)?(-friction):friction;
            carVel+=(fricDir*delta);
            car.position.add(carLookDir.clone().multiplyScalar(carVel*delta));

            // reducing fuel(maybe not update it every frame???)
            if(!trueFuelLoss)
            {
                fuel-=((carVel*delta)/fuelDist);
                if(fuel < 0 )
                    console.log("You ran out of fuel");
            }


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
        // moving the bounding box too
        carBB.setFromObject(car); // maybe expensive
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
    // checks for collisions with gas cans
    function fuelUp()
    {
        for(let i=0;i<gasCansOnTrack;i++)
        {
            if(gasCanArr[i][1].intersectsBox(carBB))
            {
                scene.remove(gasCanArr[i][0]);
                gasCanArr.splice(i,1);
                i--;
                gasCansOnTrack--;
                if(fuel<fuelCap)
                    fuel+=gasCanFuel;
                console.log("Fuel",fuel);
            }
        }
        spawnGasCans();
    }

    // updates stats and checks for game over
    function updateStats()
    {
        if(fuel<=0)
        {
            cancelAnimationFrame(animationFrameid);
            while (document.body.firstChild) {
                document.body.removeChild(document.body.firstChild);
            }
            gameOver(1,0,0);
        }
        fuelHUD.innerText="Fuel: "+Math.trunc(fuel);
        healthHUD.innerText="Health: "+health;
        timeHUD.innerText="Time: "+(Math.floor(Date.now() / 1000)-startTime);
    }






    // the animation loop------------------------------------------------------
    // setting up the clock
    let clock=new THREE.Clock();
    let startTime=Math.floor(Date.now() / 1000);
    // adding stats to screen
    document.body.appendChild(statBox);

    // animation loop
    function animate(){
        animationFrameid=requestAnimationFrame(animate);
        moveCar();
        moveCamera(viewMode,"normal");
        moveCamera("minimap","minimap");
        fuelUp();
        renderer.render(scene,camera);
        miniRenderer.render(scene,miniCam);
        updateStats();
    }
    animate();







    // game over screen--------------------------------------------
    function gameOver(fuelOver,healthOver,won)
    {
        console.log("entered game over screen");
        let message=document.createElement("p");
        if(fuelOver)
            message.innerText="You ran out of fuel :(";
        else if(healthOver)
            message.innerText="Your car blew up";
        else if(won)
            message.innerText="You Finished.";
        message.style.position="absolute";
        message.style.left="300px";
        message.style.top="45%";
        message.style.color="white";
        message.style.fontSize="60px";
        message.style.fontWeight="bold";
        let go=document.createElement("div");
        go.style.width="100vw";
        go.style.height="100vh";
        go.style.backgroundImage="url('../images/game_overScreen.png')";
        go.appendChild(message);
        document.body.appendChild(go);
    }
    
}






