window.Pojav = {
    async createRuntime(options) {
        const canvas = options.canvas;
        const ctx = canvas.getContext('2d');
        
        return {
            start: async () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                document.getElementById('launcher').style.display = 'none';
                canvas.style.display = 'block';

                this.gameState = 'MAIN_MENU'; 
                this.nick = options.username;
                this.proxyAddress = "wss://9e0c9906-5063-4350-9c6d-41ff56344c61-00-35d9p2n8jchss.riker.replit.dev";
                
                this.cam = { x: 5, y: -6, z: -10, pitch: 0, yaw: 0 };
                this.keys = {};
                this.world = [];
                this.swing = 0;
                this.servers = [{ name: "Hypixel", ip: "mc.hypixel.net" }];

                this.initListeners(canvas);
                this.runEngine(ctx, canvas);
            }
        };
    },

    initListeners(canvas) {
        document.addEventListener('keydown', (e) => this.keys[e.key.toLowerCase()] = true);
        document.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);

        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = canvas.width / 2;

            if (this.gameState === 'MAIN_MENU') {
                if (y > 200 && y < 250) { this.generateWorld(); this.gameState = 'SINGLE'; }
                if (y > 270 && y < 320) this.gameState = 'MULTI';
            } else if (this.gameState === 'MULTI') {
                if (x > canvas.width - 160 && y < 65) { // Кнопка ДОБАВИТЬ
                    const n = prompt("Имя сервера:"), i = prompt("IP:");
                    if(n && i) this.servers.push({name:n, ip:i});
                }
                if (x > 20 && x < 140 && y < 65) this.gameState = 'MAIN_MENU';
                // Клик по списку серверов
                this.servers.forEach((s, i) => {
                    if (y > 120 + i*80 && y < 190 + i*80) this.connectToServer(s);
                });
            } else {
                if (x < 150 && y < 80) {
                    if(this.socket) this.socket.close();
                    this.gameState = 'MAIN_MENU';
                    document.exitPointerLock();
                } else {
                    canvas.requestPointerLock();
                    this.swing = 1;
                }
            }
        });

        document.addEventListener("mousemove", (e) => {
            if (document.pointerLockElement === canvas) {
                this.cam.yaw += e.movementX * 0.003;
                this.cam.pitch = Math.max(-1.4, Math.min(1.4, this.cam.pitch + e.movementY * 0.003));
            }
        });
    },

    generateWorld() {
        this.world = [];
        for(let x=0; x<10; x++) for(let z=0; z<10; z++) this.world.push({x, y:2, z, type:'grass'});
    },

    connectToServer(server) {
        this.gameState = 'CONNECTING';
        const addr = this.proxyAddress + "/?target=" + server.ip;
        this.socket = new WebSocket(addr);
        this.socket.onopen = () => { this.gameState = 'IN_GAME_MULTI'; };
        this.socket.onerror = () => { alert("Ошибка Replit!"); this.gameState = 'MULTI'; };
    },

    drawHand(ctx, canvas) {
        if (this.swing > 0) this.swing -= 0.1;
        const time = Date.now() * 0.005;
        const s = Math.sin(this.swing * Math.PI) * 30;
        const hX = canvas.width - 180 - s, hY = canvas.height - 180 + Math.abs(Math.cos(time))*10 + s;

        // Рисуем 3D руку (три грани)
        ctx.fillStyle = "#eab676"; // Перед
        ctx.fillRect(hX, hY, 70, 200);
        ctx.fillStyle = "#d19d5f"; // Бок
        ctx.beginPath(); ctx.moveTo(hX+70, hY); ctx.lineTo(hX+100, hY-30); ctx.lineTo(hX+100, hY+170); ctx.lineTo(hX+70, hY+200); ctx.fill();
        ctx.fillStyle = "#2eb8b8"; // Рукав
        ctx.fillRect(hX-5, hY+100, 80, 100);
    },

    render3D(ctx, canvas, world) {
        ctx.fillStyle = "#74b9ff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        const f = 700, cx = canvas.width/2, cy = canvas.height/2;
        const cY = Math.cos(this.cam.yaw), sY = Math.sin(this.cam.yaw), cP = Math.cos(this.cam.pitch), sP = Math.sin(this.cam.pitch);

        if(world.length === 0) {
            ctx.fillStyle="white"; ctx.textAlign="center"; ctx.fillText("ОЖИДАНИЕ ДАННЫХ...", cx, cy);
        }

        world.forEach(b => {
            let dx = b.x - this.cam.x, dy = b.y + this.cam.y, dz = b.z - this.cam.z;
            let rx = dx * cY - dz * sY, rz = dx * sY + dz * cY;
            let ry = dy * cP + rz * sP, pz = rz * cP - dy * sP;
            if (pz > 0.5) {
                let sc = f/pz, x = cx + rx*sc, y = cy + ry*sc, sz = sc;
                // Рисуем куб с гранями (как в майнкрафте)
                ctx.fillStyle = "#55a84a"; ctx.fillRect(x-sz/2, y-sz/2, sz, sz); // Верх
                ctx.fillStyle = "rgba(0,0,0,0.2)"; ctx.fillRect(x-sz/2, y+sz/2, sz, sz*0.5); // Тень бока
                ctx.strokeStyle = "rgba(0,0,0,0.1)"; ctx.strokeRect(x-sz/2, y-sz/2, sz, sz);
            }
        });
    },

    runEngine(ctx, canvas) {
        const loop = () => {
            if (this.gameState.includes('GAME')) {
                const spd = 0.15;
                let mx=0, mz=0;
                if(this.keys['w']||this.keys['ц']) mz+=spd; if(this.keys['s']||this.keys['ы']) mz-=spd;
                if(this.keys['a']||this.keys['ф']) mx+=spd; if(this.keys['d']||this.keys['в']) mx-=spd;
                this.cam.x += mx*Math.cos(this.cam.yaw) + mz*Math.sin(this.cam.yaw);
                this.cam.z += -mx*Math.sin(this.cam.yaw) + mz*Math.cos(this.cam.yaw);
            }
            ctx.clearRect(0,0,canvas.width,canvas.height);
            if(this.gameState==='MAIN_MENU') this.drawMenu(ctx, canvas);
            else if(this.gameState==='MULTI') this.drawServerList(ctx, canvas);
            else {
                this.render3D(ctx, canvas, this.gameState==='SINGLE' ? this.world : []);
                this.drawHand(ctx, canvas);
                this.drawHUD(ctx, canvas);
            }
            requestAnimationFrame(loop);
        };
        loop();
    },

    drawMenu(ctx, canvas) {
        ctx.fillStyle="#111"; ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle="#55a84a"; ctx.font="bold 40px sans-serif"; ctx.textAlign="center";
        ctx.fillText("AutoTelly 2026", canvas.width/2, 120);
        this.drawButton(ctx, canvas.width/2-150, 200, 300, 50, "Одиночная игра");
        this.drawButton(ctx, canvas.width/2-150, 270, 300, 50, "Сетевая игра");
    },

    drawServerList(ctx, canvas) {
        ctx.fillStyle="#1a1a1a"; ctx.fillRect(0,0,canvas.width,canvas.height);
        this.drawButton(ctx, 20, 20, 120, 40, "<- НАЗАД");
        this.drawButton(ctx, canvas.width-160, 20, 140, 40, "+ ДОБАВИТЬ");
        this.servers.forEach((s, i) => this.drawButton(ctx, canvas.width/2-250, 120 + i*80, 500, 60, s.name + " (" + s.ip + ")"));
    },

    drawHUD(ctx, canvas) {
        ctx.strokeStyle="white"; ctx.beginPath(); ctx.moveTo(canvas.width/2-8, canvas.height/2); ctx.lineTo(canvas.width/2+8, canvas.height/2); ctx.moveTo(canvas.width/2, canvas.height/2-8); ctx.lineTo(canvas.width/2, canvas.height/2+8); ctx.stroke();
        this.drawButton(ctx, 20, 20, 100, 40, "МЕНЮ");
    },

    drawButton(ctx, x, y, w, h, text) {
        ctx.fillStyle="#333"; ctx.strokeStyle="white"; ctx.fillRect(x,y,w,h); ctx.strokeRect(x,y,w,h);
        ctx.fillStyle="white"; ctx.font="16px sans-serif"; ctx.textAlign="center"; ctx.fillText(text, x+w/2, y+h/1.6);
    }
};
