window.Pojav = {
    async createRuntime(options) {
        // ... (Все начало кода, как было раньше, до initListeners) ...
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
                
                this.cam = { x: 8, y: 8, z: -15, pitch: 0, yaw: 0, bob: 0 };
                this.keys = {}; // Отслеживание нажатых клавиш
                this.world = [];
                this.generateChunk();

                this.initListeners(canvas);
                this.runEngine(ctx, canvas);
            }
        };
    },

    // НОВАЯ ФУНКЦИЯ: Обработка ввода (WASD)
    initListeners(canvas) {
        document.addEventListener('keydown', (e) => this.keys[e.key] = true);
        document.addEventListener('keyup', (e) => this.keys[e.key] = false);

        // Захват курсора мышкой при клике на игру
        canvas.addEventListener('click', () => {
            if (this.gameState === 'SINGLE' || this.gameState === 'IN_GAME') {
                canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
                canvas.requestPointerLock();
            }
        });

        // Управление обзором мышкой
        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === canvas) {
                document.addEventListener("mousemove", this.updatePosition);
            } else {
                document.removeEventListener("mousemove", this.updatePosition);
            }
        });

        // Старые обработчики кликов по кнопкам меню
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            if (this.gameState === 'MAIN_MENU') {
                if (y > 250 && y < 300) this.gameState = 'SINGLE';
                if (y > 320 && y < 370) this.gameState = 'MULTI';
            } else if (x < 150 && y < 100) this.gameState = 'MAIN_MENU';
        });
    },
    
    // НОВАЯ ФУНКЦИЯ: Обновление позиции камеры мышкой
    updatePosition(event) {
        if (window.Pojav.gameState === 'SINGLE' || window.Pojav.gameState === 'IN_GAME') {
            window.Pojav.cam.yaw += event.movementX * 0.002;
            window.Pojav.cam.pitch -= event.movementY * 0.002;
            // Ограничиваем поворот головы (чтобы не крутить на 360 градусов)
            window.Pojav.cam.pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, window.Pojav.cam.pitch));
        }
    },

    // НОВАЯ ФУНКЦИЯ: Обновление логики игры (движение игрока)
    updateGameLogic() {
        if (this.gameState === 'SINGLE' || this.gameState === 'IN_GAME') {
            const speed = 0.1;
            let dx = 0, dz = 0;

            if (this.keys['w'] || this.keys['ц']) dz -= speed;
            if (this.keys['s'] || this.keys['ы']) dz += speed;
            if (this.keys['a'] || this.keys['ф']) dx -= speed;
            if (this.keys['d'] || this.keys['в']) dx += speed;
            
            // Применяем вращение к движению (чтобы идти туда, куда смотришь)
            this.cam.x += dx * Math.cos(this.cam.yaw) - dz * Math.sin(this.cam.yaw);
            this.cam.z += dx * Math.sin(this.cam.yaw) + dz * Math.cos(this.cam.yaw);

            this.cam.bob = Math.sin(Date.now() * 0.008) * 0.2; // Покачивание при ходьбе
        }
    },


    runEngine(ctx, canvas) {
        const animate = () => {
            this.updateGameLogic(); // Вызываем логику движения каждый кадр
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (this.gameState === 'MAIN_MENU') {
                this.drawMenu(ctx, canvas);
            } else {
                this.render3D(ctx, canvas);
                this.drawHand(ctx, canvas);
                this.drawHUD(ctx, canvas);
            }
            requestAnimationFrame(animate);
        };
        animate();
    },

    // ... (Все остальные функции drawMenu, drawButton, drawHand, render3D, drawHUD) ...
    // В render3D нужно заменить this.cam.rot на this.cam.yaw:
    render3D(ctx, canvas) {
        // ...
        // Замени строку, где было this.cam.rot += 0.005 на:
        // this.cam.yaw += 0; // Убрали авто-вращение, теперь управляем мышкой

        // ...
    },
    
    // В drawHand нужно заменить this.cam.bob = Math.sin(...) на:
    drawHand(ctx, canvas) {
        // ...
        const bobX = Math.sin(Date.now() * 0.005) * 10;
        // Замени старую bobY на новую логику:
        const bobY = Math.abs(Math.sin(Date.now() * 0.008)) * 15;
        // ... (остальной код руки) ...
    },
    
    // (функции connectToServer, drawServerList, generateChunk и т.д. остаются из прошлого кода)
};
