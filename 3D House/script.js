// 1. SCENE AND CAMERA SETTINGS
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.getElementById('container').appendChild(renderer.domElement);

// 2. LIGHTING
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
scene.add(directionalLight);

// 3. CONTROL VARIABLES
let cameraRotationY = 0;
let activeTouches = {};
let joystickTouchId = null;
let lookTouchId = null;
let previousLookX = 0;

// 4. COLLISION OBJECTS
let collisionObjects = [];

// 5. CREATE WALL
function createWall(x, y, z, width, height, depth, color = 0xF5DEB3) {
    const wall = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        new THREE.MeshStandardMaterial({ color })
    );
    wall.position.set(x, y, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
    collisionObjects.push(wall);
    return wall;
}

// 6. CREATE TABLE
function createTable(x, y, z) {
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    
    const top = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 1.5), material);
    top.position.set(0, 0.8, 0);
    group.add(top);
    
    for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), material);
        leg.position.set(
            (i % 2 === 0 ? -0.9 : 0.9),
            0.4,
            (i < 2 ? -0.65 : 0.65)
        );
        group.add(leg);
    }
    
    group.position.set(x, y, z);
    group.traverse(child => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            collisionObjects.push(child);
        }
    });
    scene.add(group);
    return group;
}

// 7. CREATE HOUSE
function createHouse() {
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(40, 40),
        new THREE.MeshStandardMaterial({ color: 0x8B4513 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    
    // Wall
    createWall(-20, 2, 0, 0.2, 4, 40); // Sol
    createWall(20, 2, 0, 0.2, 4, 40);  // Sağ
    createWall(0, 2, -20, 40, 4, 0.2); // Ön
    createWall(0, 2, 20, 40, 4, 0.2);  // Arka
    
    createTable(0, 0, -5);
}

createHouse();

// 8. JOYSTICK CONTROLS
const joystickArea = document.getElementById('joystick-area');
const joystickHandle = document.getElementById('joystick-handle');
let joystickX = 0;
let joystickY = 0;
let isJoystickActive = false;

// 9. TOUCH EVENTS
joystickArea.addEventListener('touchstart', handleJoystickStart, { passive: false });
document.addEventListener('touchstart', handleTouchStart, { passive: false });
document.addEventListener('touchmove', handleTouchMove, { passive: false });
document.addEventListener('touchend', handleTouchEnd, { passive: false });

function handleJoystickStart(e) {
    e.preventDefault();
    if (joystickTouchId === null) {
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            const rect = joystickArea.getBoundingClientRect();
            const inJoystickArea = 
                touch.clientX >= rect.left && 
                touch.clientX <= rect.right &&
                touch.clientY >= rect.top && 
                touch.clientY <= rect.bottom;
            
            if (inJoystickArea && joystickTouchId === null) {
                joystickTouchId = touch.identifier;
                isJoystickActive = true;
                updateJoystick(touch.clientX, touch.clientY);
                break;
            }
        }
    }
}

function handleTouchStart(e) {
    e.preventDefault();
    
    for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        activeTouches[touch.identifier] = touch;
        
        const rect = joystickArea.getBoundingClientRect();
        const inJoystickArea = 
            touch.clientX >= rect.left && 
            touch.clientX <= rect.right &&
            touch.clientY >= rect.top && 
            touch.clientY <= rect.bottom;
        
        if (inJoystickArea && joystickTouchId === null) {
            joystickTouchId = touch.identifier;
            isJoystickActive = true;
            updateJoystick(touch.clientX, touch.clientY);
        } 
        else if (!inJoystickArea && lookTouchId === null) {
            lookTouchId = touch.identifier;
            previousLookX = touch.clientX;
        }
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    
    for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        activeTouches[touch.identifier] = touch;
        
        if (touch.identifier === joystickTouchId) {
            updateJoystick(touch.clientX, touch.clientY);
        }
        
        if (touch.identifier === lookTouchId) {
            const deltaX = touch.clientX - previousLookX;
            cameraRotationY -= deltaX * 0.005;
            camera.rotation.y = cameraRotationY;
            previousLookX = touch.clientX;
        }
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    
    for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        delete activeTouches[touch.identifier];
        
        if (touch.identifier === joystickTouchId) {
            joystickTouchId = null;
            isJoystickActive = false;
            resetJoystick();
        }
        
        if (touch.identifier === lookTouchId) {
            lookTouchId = null;
        }
    }
}

function updateJoystick(touchX, touchY) {
    const rect = joystickArea.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = touchX - centerX;
    const deltaY = touchY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const angle = Math.atan2(deltaY, deltaX);
    
    const maxDistance = 50;
    const limitedDistance = Math.min(distance, maxDistance);
    
    const newX = limitedDistance * Math.cos(angle);
    const newY = limitedDistance * Math.sin(angle);
    
    joystickHandle.style.transform = `translate(${newX}px, ${newY}px)`;
    joystickX = newX / maxDistance;
    joystickY = -newY / maxDistance;
}

function resetJoystick() {
    joystickX = 0;
    joystickY = 0;
    joystickHandle.style.transform = 'translate(0, 0)';
}

// 10. COLLISION DETECTION
function canMoveTo(position) {
    const playerBox = new THREE.Box3(
        new THREE.Vector3().copy(position).sub(new THREE.Vector3(0.3, 0.8, 0.3)),
        new THREE.Vector3().copy(position).add(new THREE.Vector3(0.3, 0.8, 0.3))
    );
    
    for (const obj of collisionObjects) {
        const objBox = new THREE.Box3().setFromObject(obj);
        if (playerBox.intersectsBox(objBox)) {
            return false;
        }
    }
    return true;
}

// 11. ANIMATION LOOP
function animate() {
    requestAnimationFrame(animate);
    
    if (isJoystickActive) {
        const moveSpeed = 0.15;
        
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        
        forward.y = 0;
        right.y = 0;
        forward.normalize();
        right.normalize();
        
        const moveDirection = new THREE.Vector3();
        moveDirection.add(forward.multiplyScalar(joystickY * moveSpeed));
        moveDirection.add(right.multiplyScalar(joystickX * moveSpeed));
        
        if (moveDirection.length() > 0) {
            const newPosition = camera.position.clone().add(moveDirection);
            if (canMoveTo(newPosition)) {
                camera.position.copy(newPosition);
            }
        }
    }
    
    renderer.render(scene, camera);
}

animate();

// 12. WINDOW RESIZING
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});