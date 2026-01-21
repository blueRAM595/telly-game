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

                this.gameState = 'MAIN_MENU'; // Состояние: MAIN_MENU, SINGLE, MULTI
                this.nick = options.username;
                
                this.initListeners(canvas);
                this.runEngine(ctx, canvas);
            }
        };
    },

    // Обработка кликов по кнопкам меню
    initListeners(canvas) {
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = canvas.width / 2;

            if (this.gameState === 'MAIN_MENU') {
                // Кнопка Одиночная игра (проверка по координатам)
                if (x > centerX - 150 && x < centerX + 150 && y > 200 && y < 250) {
                    this.gameState = 'SINGLE';
                }
                // Кнопка Сетевая игра
                if (x > centerX - 150 && x < centerX + 150 && y > 270 && y < 320) {
                    this.gameState = 'MULTI';
                }
            }
        });
    },

    runEngine(ctx, canvas) {
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const centerX = canvas.width / 2;

            if (this.gameState === 'MAIN_MENU') {
                this.drawMenu(ctx, canvas, centerX);
            } else if (this.gameState === 'SINGLE') {
                this.drawWorld(ctx, canvas, "Одиночный мир (Загрузка...)");
            } else if (this.gameState === 'MULTI') {
                this.drawWorld(ctx, canvas, "Поиск серверов 1.20.1...");
            }

            requestAnimationFrame(animate);
        };
        animate();
    },

    drawMenu(ctx, canvas, centerX) {
        // Фон меню (панорама)
        ctx.fillStyle = "#1e3799"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Логотип
        ctx.fillStyle = "white";
        ctx.font = "bold 50px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("AUTOTELLY 2026", centerX, 120);

        // Кнопка 1: Одиночная игра
        this.drawButton(ctx, centerX - 150, 200, 300, 50, "Одиночная игра");

        // Кнопка 2: Сетевая игра
        this.drawButton(ctx, centerX - 150, 270, 300, 50, "Сетевая игра");

        // Подпись снизу
        ctx.font = "16px sans-serif";
        ctx.fillStyle = "#aaa";
        ctx.fillText("Версия 1.20.1 Fabric | Игрок: " + this.nick, centerX, canvas.height - 30);
    },

    drawButton(ctx, x, y, w, h, text) {
        ctx.fillStyle = "#444";
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = "white";
        ctx.font = "20px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(text, x + w / 2, y + 32);
    },

    drawWorld(ctx, canvas, statusText) {
        // Симуляция игрового мира
        ctx.fillStyle = "#74b9ff"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = "white";
        ctx.font = "30px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(statusText, canvas.width / 2, canvas.height / 2);
        
        // Кнопка Назад
        ctx.font = "18px sans-serif";
        ctx.fillText("Нажми F5 для выхода в меню", canvas.width / 2, canvas.height / 2 + 50);
    }
};
