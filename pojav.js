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
                // Ссылка на твой Replit-прокси
                this.proxyAddress = "wss://9e0c9906-5063-4350-9c6d-41ff56344c61-00-35d9p2n8jchss.riker.replit.dev";
                
                // Список серверов (изначально пустой или с примером)
                this.servers = [
                    { name: "AutoTelly Test", ip: "wss://relay.autotelly.ru" }
                ];

                this.initListeners(canvas);
                this.runEngine(ctx, canvas);
            }
        };
    },

    initListeners(canvas) {
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = canvas.width / 2;

            // Логика ГЛАВНОГО МЕНЮ
            if (this.gameState === 'MAIN_MENU') {
                if (x > centerX - 150 && x < centerX + 150 && y > 200 && y < 250) this.gameState = 'SINGLE';
                if (x > centerX - 150 && x < centerX + 150 && y > 270 && y < 320) this.gameState = 'MULTI';
            } 
            // Логика СПИСКА СЕРВЕРОВ
            else if (this.gameState === 'MULTI') {
                // Кнопка НАЗАД
                if (x > 20 && x < 140 && y > 20 && y < 65) {
                    this.gameState = 'MAIN_MENU';
                }
                // Кнопка ДОБАВИТЬ СЕРВЕР (в правом углу)
                if (x > canvas.width - 160 && x < canvas.width - 20 && y > 20 && y < 65) {
                    const name = prompt("Введите название сервера:");
                    const ip = prompt("Введите IP сервера (например, play.hypixel.net):");
                    if (name && ip) {
                        this.servers.push({ name, ip });
                    }
                }
                // Клик по серверу в списке
                this.servers.forEach((srv, i) => {
                    const yPos = 120 + (i * 80);
                    if (x > centerX - 300 && x < centerX + 300 && y > yPos && y < yPos + 70) {
                        this.connectToServer(srv);
                    }
                });
            }
            // Кнопка ВЫХОД из игры
            else if (this.gameState === 'IN_GAME' || this.gameState === 'CONNECTING') {
                if (x > 20 && x < 140 && y > 20 && y < 65) {
                    if(this.socket) this.socket.close();
                    this.gameState = 'MULTI';
                }
            }
        });
    },

    connectToServer(server) {
        this.gameState = 'CONNECTING';
        this.selectedServer = server;
        
        // Если IP не WSS, используем прокси
        let addr = server.ip.startsWith("wss://") ? server.ip : this.proxyAddress + "/?target=" + server.ip;
        
        console.log("Connecting via: " + addr);
        this.socket = new WebSocket(addr);
        this.socket.binaryType = "arraybuffer";

        this.socket.onopen = () => {
            this.gameState = 'IN_GAME';
        };

        this.socket.onerror = () => {
            alert("Ошибка подключения! Проверь Replit.");
            this.gameState = 'MULTI';
        };
    },

    runEngine(ctx, canvas) {
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const centerX = canvas.width / 2;

            if (this.gameState === 'MAIN_MENU') {
                this.drawMenu(ctx, canvas, centerX);
            } else if (this.gameState === 'MULTI') {
                this.drawServerList(ctx, canvas, centerX);
            } else if (this.gameState === 'CONNECTING') {
                this.drawStatus(ctx, canvas, "ПОДКЛЮЧЕНИЕ...");
            } else if (this.gameState === 'IN_GAME') {
                this.drawGame(ctx, canvas);
            }

            requestAnimationFrame(animate);
        };
        animate();
    },

    drawMenu(ctx, canvas, centerX) {
        ctx.fillStyle = "#1e3799"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "bold 50px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("AUTOTELLY 2026", centerX, 120);
        this.drawButton(ctx, centerX - 150, 200, 300, 50, "Одиночная игра");
        this.drawButton(ctx, centerX - 150, 270, 300, 50, "Сетевая игра");
    },

    drawServerList(ctx, canvas, centerX) {
        ctx.fillStyle = "#2c3e50";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        this.drawButton(ctx, 20, 20, 120, 45, "<- Назад");
        this.drawButton(ctx, canvas.width - 160, 20, 140, 45, "+ Добавить");

        ctx.fillStyle = "white";
        ctx.font = "bold 30px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Список серверов", centerX, 70);

        this.servers.forEach((srv, i) => {
            const yPos = 120 + (i * 80);
            ctx.fillStyle = "rgba(0,0,0,0.5)";
            ctx.fillRect(centerX - 300, yPos, 600, 70);
            ctx.textAlign = "left";
            ctx.fillStyle = "#55a84a";
            ctx.font = "bold 20px sans-serif";
            ctx.fillText(srv.name, centerX - 280, yPos + 30);
            ctx.fillStyle = "#aaa";
            ctx.font = "14px sans-serif";
            ctx.fillText(srv.ip, centerX - 280, yPos + 55);
        });
    },

    drawStatus(ctx, canvas, text) {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
        this.drawButton(ctx, 20, 20, 120, 45, "Отмена");
    },

    drawGame(ctx, canvas) {
        ctx.fillStyle = "#74b9ff"; // Небо
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText("ВЫ НА СЕРВЕРЕ: " + this.selectedServer.name, canvas.width / 2, 50);
        this.drawButton(ctx, 20, 20, 120, 45, "<- Выйти");
    },

    drawButton(ctx, x, y, w, h, text) {
        ctx.fillStyle = "#444";
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = "white";
        ctx.font = "18px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(text, x + w / 2, y + h / 1.6);
    }
};

window.addEventListener('resize', () => {
    const cvs = document.getElementById('canvas');
    if(cvs) { cvs.width = window.innerWidth; cvs.height = window.innerHeight; }
});
