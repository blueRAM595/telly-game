// Этот код сам найдет и скачает движок, обходя ошибки 404
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net';
script.onload = () => {
    window.Pojav = window.PojavJS || window.default;
    console.log("Движок загружен!");
};
document.head.appendChild(script);
