let container = document.querySelector("#container");

window.addEventListener("load", (e) => {
    let img = document.querySelector("img");
    let height = img.naturalHeight;
    let width = img.naturalWidth;
    container.setAttribute("style", `aspect-ratio: ${width}/${height}`);
    container.style["grid-template-rows"] = `repeat(${ROWS}, 1fr)`;
    container.style["grid-template-columns"] = `repeat(${COLS}, 1fr)`;
})

const ROWS = 4;
const COLS = 4;

function puzzle() {
    let gameState = [...Array(ROWS * COLS).keys()];
    let grid = [];

    shuffle(gameState);
    init();

    function drawTile(pos) {
        const tileRow = Math.floor(gameState[pos] / COLS);
        const tileCol = gameState[pos] % COLS;
        grid[pos].style["background-position"] = `${tileCol * 100 / (COLS - 1)}% ${tileRow * 100 / (ROWS - 1)}%`;
    }
    function checkWin() {
        for (i = 0; i < ROWS * COLS; i++) {
            if (gameState[i] != i) {
                return false;
            }
        }
        win();
    }
    function init() {
        for (row = 0; row < ROWS; row++) {
            for (col = 0; col < COLS; col++) {
                let el = document.createElement("div");
                let pos = (row * COLS) + col;
                el.setAttribute("draggable", "true");
                el.style["background-size"] = `${COLS}00% auto`;
                el.addEventListener("dragover", e => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                });
                el.addEventListener("dragstart", e => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", pos);
                })
                el.addEventListener("drop", e => {
                    e.preventDefault();
                    const fromPos = e.dataTransfer.getData("text/plain");
                    if (fromPos != pos) {
                        swap(gameState, pos, fromPos);
                        drawTile(pos);
                        drawTile(fromPos);
                        checkWin();
                    }
                })
                grid.push(el);
                container.appendChild(el);
            }
        }
        for (i = 0; i < ROWS * COLS; i++) {
            drawTile(i);
        }
    }
    async function win() {
        let el = document.createElement("img");
        el.setAttribute("src",
            atob("aHR0cHM6Ly93d3cuY3N1YS5iZXJrZWxleS5lZHUvfnJvYmVydHEvY29udGFjdF9nb29kX2pvYl9wdXp6bGVfdGltZS5wbmc")
        );
        el.classList.add("win");
        let contact = document.querySelector("#contact");
        contact.classList.add("rainbow");
        contact.appendChild(el);
    }
}
function swap(list, i, j) {
    const temp = list[i];
    list[i] = list[j];
    list[j] = temp;
}
function randomRange(min, max) {
    return min + Math.floor(Math.random() * (max - min));
}
function shuffle(list) {
    const n = list.length;
    for (i = 0; i < n - 1; i++) {
        j = randomRange(i, n);
        swap(list, i, j);
    }
}


puzzle();