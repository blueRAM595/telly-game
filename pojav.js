// AutoTelly Engine 2026 — Собственная разработка (No Libraries)
window.Pojav = {
    async createRuntime(options) {
        const status = document.getElementById('status');
        const canvas = options.canvas;
        const ctx = canvas.getContext('2d');

        return {
            start: async () => {
                // 1. ИСПРАВЛЕНИЕ ОГРОМНЫХ БУКВ
                // Устанавливаем реальное разрешение холста равным размеру окна
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;

                // Скрываем меню
                document.getElementById('launcher').style.display = 'none';
                canvas.style.display = 'block';

                // 2. ИНИЦИАЛИЗАЦИЯ СЕТЕВОГО ЯДРА (Multiplayer)
                this.initNetwork(ctx, options.username, canvas);
                
                // 3. ЗАПУСК ЦИКЛА ГРАФИКИ (Game Loop)
                this.runGameLoop(ctx, canvas, options.username);
            }
        };
    },

    initNetwork(ctx, nick, canvas) {
        console.log("Попытка подключения к серверу...");
        // В будущем здесь будет адрес твоего WebSocket-прокси
        // Для теста создаем попытку подключения
        const ws = new WebSocket('ws://localhost:8080'); 
        ws.binaryType = 'arraybuffer';

        ws.onopen = () => {
            console.log("Сетевой поток открыт");
        };

        ws.onerror = () => {
            // Рисуем ошибку прямо на канвасе
            ctx.fillStyle = "#ff4757";
            ctx.font = "20px Arial";
            ctx.fillText("Ошибка: Сервер 1.20.1 не отвечает (нужен WebSocket Proxy)", 50, canvas.height - 50);
        };
    },

    runGameLoop(ctx, canvas, nick) {
        let frame = 0;

        const animate = () => {
            frame++;
            
            // Очистка экрана
            ctx.fillStyle = "#1a1a1a"; 
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Рендерим "Мир" (пока это сетка, которую мы превратим в 3D)
            ctx.strokeStyle = "#333";
            for(let i = 0; i < canvas.width; i += 50) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, canvas.height);
                ctx.stroke();
            }

            // ИНТЕРФЕЙС ИГРЫ (HUD)
            ctx.fillStyle = "#55a84a";
            ctx.font = "bold 24px sans-serif";
            ctx.fillText("AutoTelly 1.20.1 Build 2026", 30, 50);

            ctx.fillStyle = "white";
            ctx.font = "18px sans-serif";
            ctx.fillText("Игрок: " + nick, 30, 85);
            ctx.fillText("FPS: 60", 30, 110);

            // Имитация чата (как на серверах)
            ctx.fillStyle = "rgba(0,0,0,0.5)";
            ctx.fillRect(20, canvas.height - 150, 400, 100);
            ctx.fillStyle = "white";
            ctx.fillText("[Система] Поиск серверов...", 35, canvas.height - 120);
            if (frame > 100) ctx.fillText("[AutoTelly] Добро пожаловать в мультиплеер!", 35, canvas.height - 90);

            requestAnimationFrame(animate);
        };

        animate();
    }
};

// Обработка изменения размера окна, чтобы буквы не ломались при ресайзе
window.addEventListener('resize', () => {
    const canvas = document.getElementById('canvas');
    if (canvas && canvas.style.display === 'block') {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
});
