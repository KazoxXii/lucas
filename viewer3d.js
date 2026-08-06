// ===============================
// VOIR MON PLAT+ - Visualiseur 3D
// ===============================
// Construit des plats en 3D avec Three.js.
// Mode "real" : materiaux realistes + lumiere + ombres.
// Mode "normal" : rendu 3D simple et leger.

let scene, camera, renderer, controls;
let dishGroup = null;
let currentMode = 'real';
let autoRotate = true;
const dishes = {
    'Burger Maison': { icon: '\u{1F354}', make: buildBurger },
    'Pizza Truffe': { icon: '\u{1F355}', make: buildPizza },
    'Tiramisu': { icon: '\u{1F370}', make: buildTiramisu },
    'Sushi': { icon: '\u{1F363}', make: buildSushi },
    'Salade': { icon: '\u{1F957}', make: buildSalad },
    'Pates': { icon: '\u{1F35D}', make: buildPasta },
    'Starter Demo': { icon: '\u{1F354}', make: buildBurger }
};

init();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2.5, 6);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    document.getElementById('viewerContainer').appendChild(renderer.domElement);

    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 12;
    controls.target.set(0, 0.5, 0);

    // Lumiere
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 8, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xf5a623, 0.3);
    fillLight.position.set(-4, 2, -3);
    scene.add(fillLight);

    const envLight = new THREE.HemisphereLight(0xffffff, 0x1a1a1a, 0.5);
    scene.add(envLight);

    // Sol
    const floorGeom = new THREE.PlaneGeometry(20, 20);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.9, metalness: 0.1 });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    floor.receiveShadow = true;
    scene.add(floor);

    // Plateforme
    buildPodium();

    // Selection des plats
    buildDishSelector();

    loadDish('Burger Maison');

    window.addEventListener('resize', onResize);

    // Boutons
    document.getElementById('resetView').addEventListener('click', () => {
        camera.position.set(0, 2.5, 6);
        controls.target.set(0, 0.5, 0);
    });
    document.getElementById('autoRotateBtn').addEventListener('click', () => {
        autoRotate = !autoRotate;
        controls.autoRotate = autoRotate;
        controls.autoRotateSpeed = 2;
    });

    animate();
}

function buildPodium() {
    const podiumGeom = new THREE.CylinderGeometry(1.6, 1.9, 0.4, 32);
    const podiumMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.3,
        metalness: 0.7
    });
    const podium = new THREE.Mesh(podiumGeom, podiumMat);
    podium.position.y = 0.2;
    podium.receiveShadow = true;
    podium.castShadow = true;
    scene.add(podium);

    const ringGeom = new THREE.TorusGeometry(1.75, 0.03, 16, 64);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xf5a623, emissive: 0x3a2500, metalness: 0.8 });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.02;
    scene.add(ring);
}

function buildDishSelector() {
    const selector = document.getElementById('dishSelector');
    document.querySelectorAll('.dish-pill').forEach(n => n.remove());
    Object.keys(dishes).forEach(name => {
        const pill = document.createElement('button');
        pill.className = 'dish-pill';
        if (name === 'Burger Maison') pill.classList.add('active');
        pill.textContent = dishes[name].icon + ' ' + name;
        pill.addEventListener('click', () => {
            document.querySelectorAll('.dish-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            loadDish(name);
        });
        selector.appendChild(pill);
    });
}

function loadDish(name) {
    if (dishGroup) {
        scene.remove(dishGroup);
        disposeGroup(dishGroup);
        dishGroup = null;
    }

    dishGroup = new THREE.Group();
    dishes[name].make(dishGroup);
    dishGroup.position.y = 0.45;
    dishGroup.name = name;
    scene.add(dishGroup);

    const info = dishes[name] ? dishes[name].icon : '';
    document.getElementById('dishInfo').innerHTML = name + '<span>' + info + ' Visualisez chaque detail</span>';

    camera.position.set(0, 2.5, 6);
    controls.target.set(0, 0.5, 0);
}

function disposeGroup(group) {
    group.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
            if (Array.isArray(child.material)) {
                child.material.forEach(m => {
                    if (m.map) m.map.dispose();
                    m.dispose();
                });
            } else {
                if (child.material.map) child.material.map.dispose();
                child.material.dispose();
            }
        }
    });
}

function foodMat(color, opts) {
    const isReal = currentMode === 'real';
    if (isReal) {
        return new THREE.MeshStandardMaterial({
            color: color,
            roughness: opts && opts.roughness !== undefined ? opts.roughness : 0.7,
            metalness: opts && opts.metalness !== undefined ? opts.metalness : 0.05,
            emissive: opts && opts.emissive ? opts.emissive : 0x000000,
            emissiveIntensity: isReal ? 0.5 : 0
        });
    }
    return new THREE.MeshLambertMaterial({ color: color });
}

function plate(group, radius, color, height) {
    const h = height || 0.12;
    const outer = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, h, 32),
        foodMat(color, { roughness: 0.2, metalness: 0.4 })
    );
    outer.position.y = -h / 2;
    outer.castShadow = true;
    group.add(outer);

    const inner = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.82, radius * 0.82, h * 1.2, 32),
        foodMat(0xf0f0f0, { roughness: 0.3, metalness: 0.3 })
    );
    inner.position.y = -height * 0.3;
    inner.castShadow = true;
    group.add(inner);
    return inner;
}

function sphereWithSeeds(group, pos, radius, color, seeds, seedColor) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32), foodMat(color, { roughness: 0.6 }));
    s.position.copy(pos);
    s.castShadow = true;
    group.add(s);
    if (seeds) {
        for (let i = 0; i < seeds; i++) {
            const seed = new THREE.Mesh(
                new THREE.SphereGeometry(radius * 0.12, 8, 8),
                foodMat(seedColor || 0xffcc66, { roughness: 0.4 })
            );
            const angle = Math.random() * Math.PI * 2;
            const y = (Math.random() * 0.6 + 0.4) * radius;
            seed.position.set(
                pos.x + Math.cos(angle) * Math.sqrt(radius * radius - y * y),
                pos.y + y,
                pos.z + Math.sin(angle) * Math.sqrt(radius * radius - y * y)
            );
            group.add(seed);
        }
    }
}

// ============ PLATS ============

function buildBurger(g) {
    const bunTop = new THREE.Mesh(
        new THREE.SphereGeometry(1.1, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2),
        foodMat(0xe8a33d, { roughness: 0.6 })
    );
    bunTop.position.y = 0.9;
    bunTop.castShadow = true;
    g.add(bunTop);

    const bunBottom = new THREE.Mesh(
        new THREE.CylinderGeometry(1.1, 1.1, 0.25, 32),
        foodMat(0xe8a33d, { roughness: 0.6 })
    );
    bunBottom.position.y = 0.05;
    bunBottom.castShadow = true;
    g.add(bunBottom);

    sphereWithSeeds(g, new THREE.Vector3(0, 1.15, 0), 1.1, 0xe8a33d, 12, 0xffe6a3);

    // Viande
    const meat = new THREE.Mesh(
        new THREE.CylinderGeometry(1.0, 1.05, 0.22, 32),
        foodMat(0x6d4a2a, { roughness: 0.8 })
    );
    meat.position.y = 0.48;
    meat.castShadow = true;
    g.add(meat);

    // Fromage
    const cheese = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 0.06, 1.3),
        foodMat(0xf5b830, { roughness: 0.5 })
    );
    cheese.position.y = 0.62;
    cheese.rotation.y = 0.3;
    cheese.rotation.z = 0.05;
    cheese.castShadow = true;
    g.add(cheese);

    // Salade
    const lettuce = new THREE.Mesh(
        new THREE.CylinderGeometry(1.1, 1.1, 0.15, 32),
        foodMat(0x5a9e3d, { roughness: 0.9 })
    );
    lettuce.position.y = 0.72;
    lettuce.castShadow = true;
    g.add(lettuce);
}

function buildPizza(g) {
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(1.6, 1.6, 0.15, 32),
        foodMat(0xe0b060, { roughness: 0.8 })
    );
    base.position.y = 0;
    base.castShadow = true;
    g.add(base);

    // Sauce
    const sauceRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.1, 0.01, 16, 64),
        new THREE.MeshStandardMaterial({ color: 0xc03028 })
    );
    sauceRing.rotation.x = Math.PI / 2;
    sauceRing.position.y = 0.08;
    g.add(sauceRing);

    // Fromage fondant
    const cheese = new THREE.Mesh(
        new THREE.CylinderGeometry(1.4, 1.4, 0.06, 32),
        foodMat(0xf5d76e, { roughness: 0.4 })
    );
    cheese.position.y = 0.1;
    g.add(cheese);

    // Pepperoni
    const toppings = 8;
    for (let i = 0; i < toppings; i++) {
        const angle = (i / toppings) * Math.PI * 2;
        const top = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.25, 0.05, 16),
            foodMat(0xb03020, { roughness: 0.6 })
        );
        top.position.set(Math.cos(angle) * 0.8, 0.14, Math.sin(angle) * 0.8);
        top.rotation.y = angle;
        g.add(top);
    }

    // Champignons
    const nb = 6;
    for (let i = 0; i < nb; i++) {
        const angle = (i / nb) * Math.PI * 2 + 0.4;
        const mush = new THREE.Mesh(
            new THREE.SphereGeometry(0.16, 12, 12),
            foodMat(0xd9d9d9, { roughness: 0.5 })
        );
        mush.position.set(Math.cos(angle) * 0.5, 0.16, Math.sin(angle) * 0.5);
        mush.scale.y = 0.6;
        g.add(mush);
    }
}

function buildTiramisu(g) {
    const layers = [0xe8c080, 0x8a5a2a, 0xe8c080, 0x8a5a2a, 0xe8c080];
    let y = 0;
    layers.forEach((c, i) => {
        const layer = new THREE.Mesh(
            new THREE.CylinderGeometry(1.0, 1.0, 0.2, 32),
            foodMat(c, { roughness: 0.6 })
        );
        layer.position.y = y;
        layer.castShadow = true;
        g.add(layer);
        y += 0.22;
    });

    // Creme chantilly
    const chantilly = new THREE.Mesh(
        new THREE.SphereGeometry(0.85, 24, 24),
        foodMat(0xfff8e7, { roughness: 0.4 })
    );
    chantilly.position.y = y - 0.15;
    chantilly.scale.y = 0.7;
    g.add(chantilly);

    // Grain de cafe
    for (let i = 0; i < 5; i++) {
        const grain = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 10, 10),
            foodMat(0x5a3a20, { roughness: 0.7 })
        );
        const angle = (i / 5) * Math.PI * 2;
        grain.position.set(Math.cos(angle) * 0.5, y - 0.02, Math.sin(angle) * 0.5);
        g.add(grain);
    }
}

function buildSushi(g) {
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const x = Math.cos(angle) * 1.0;
        const z = Math.sin(angle) * 1.0;

        const rice = new THREE.Mesh(
            new THREE.CylinderGeometry(0.24, 0.28, 0.25, 16),
            foodMat(0xfff5e6, { roughness: 0.7 })
        );
        rice.position.set(x, 0.1, z);
        rice.rotation.z = 0.1;
        g.add(rice);

        const fish = new THREE.Mesh(
            new THREE.BoxGeometry(0.45, 0.12, 0.45),
            foodMat(i % 2 === 0 ? 0xe8845a : 0x90b84a, { roughness: 0.3 })
        );
        fish.position.set(x, 0.3, z);
        g.add(fish);
    }
}

function buildSalad(g) {
    const bowl = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2),
        foodMat(0x2a5a3a, { roughness: 0.4 })
    );
    bowl.position.y = 0.2;
    bowl.castShadow = true;
    g.add(bowl);

    const vegColors = [0x3fae2a, 0xe23b3b, 0xf5b830, 0xa53a8a, 0x2a8a5a, 0xffffff];
    for (let i = 0; i < 30; i++) {
        const veg = new THREE.Mesh(
            new THREE.SphereGeometry(0.1 + Math.random() * 0.06, 8, 8),
            foodMat(vegColors[Math.floor(Math.random() * vegColors.length)], { roughness: 0.5 })
        );
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * 0.7;
        veg.position.set(
            Math.cos(angle) * r,
            0.4 + Math.random() * 0.6,
            Math.sin(angle) * r
        );
        g.add(veg);
    }
}

function buildPasta(g) {
    const bowl = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2),
        foodMat(0x2a5a3a, { roughness: 0.4 })
    );
    bowl.position.y = 0.2;
    bowl.castShadow = true;
    g.add(bowl);

    for (let i = 0; i < 20; i++) {
        const pasta = new THREE.Mesh(
            new THREE.TorusGeometry(0.3, 0.06, 8, 16),
            foodMat(0xe8c050, { roughness: 0.6 })
        );
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * 0.5;
        pasta.position.set(Math.cos(angle) * r, 0.35 + Math.random() * 0.5, Math.sin(angle) * r);
        pasta.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        g.add(pasta);
    }
}

// ============ MODE ============

function setMode(mode) {
    currentMode = mode;
    document.getElementById('modeNormalBtn').classList.toggle('active', mode === 'normal');
    document.getElementById('modeRealBtn').classList.toggle('active', mode === 'real');
    if (dishGroup) {
        const name = dishGroup.name;
        loadDish(name);
    }
}

// ============ LOOP ============

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    if (autoRotate && dishGroup) {
        dishGroup.rotation.y += 0.004;
    }
    renderer.render(scene, camera);
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}