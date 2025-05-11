document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const resetButton = document.getElementById('reset-button');
    const timerDisplay = document.querySelector('#timer span');
    const scoreDisplay = document.querySelector('#score span');
    const attemptsDisplay = document.querySelector('#attempts span');

    let cards = [];
    let flippedCards = [];
    let matchedPairs = 0;
    let score = 0;
    let attempts = 0;
    let timerInterval;
    let seconds = 0;
    let totalPairs = 0;

    // 从JSON文件加载卡片数据
    async function loadItems() {
        try {
            const response = await fetch('items.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const items = await response.json();
            totalPairs = items.length / 2;
            return items;
        } catch (error) {
            console.error("无法加载卡片数据:", error);
            gameBoard.innerHTML = "<p>加载游戏数据失败，请检查items.json文件或网络连接。</p>";
            return []; // 返回空数组以避免后续错误
        }
    }

    // 初始化游戏
    async function initializeGame() {
        const items = await loadItems();
        if (!items || items.length === 0) return; // 如果没有数据则不继续

        cards = shuffleArray([...items]); // 复制并打乱数组
        matchedPairs = 0;
        score = 0;
        attempts = 0;
        seconds = 0;
        flippedCards = [];
        updateInfoBar();
        stopTimer();
        startTimer();
        createBoard();
    }

    // 创建游戏板
    function createBoard() {
        gameBoard.innerHTML = ''; // 清空旧的游戏板
        // 根据卡片数量调整列数，确保美观
        const numCards = cards.length;
        let columns = 4; // 默认4列
        if (numCards <= 8) columns = 2;
        else if (numCards <= 12) columns = 3;
        else if (numCards <= 16) columns = 4;
        else if (numCards <= 20) columns = 5;
        else columns = Math.ceil(Math.sqrt(numCards)); // 对于更多卡片，尝试接近正方形布局

        gameBoard.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;


        cards.forEach((item, index) => {
            const cardElement = document.createElement('div');
            cardElement.classList.add('card');
            cardElement.dataset.id = item.id;
            cardElement.dataset.matchId = item.matchId; // 用于匹配的ID

            // 卡片正面 (初始不可见)
            const cardFaceFront = document.createElement('div');
            cardFaceFront.classList.add('card-face', 'card-front');
            cardFaceFront.textContent = item.content;

            // 卡片背面 (初始可见)
            const cardFaceBack = document.createElement('div');
            cardFaceBack.classList.add('card-face', 'card-back');
            cardFaceBack.textContent = '?'; // 或者其他背面图案

            cardElement.appendChild(cardFaceFront);
            cardElement.appendChild(cardFaceBack);

            cardElement.addEventListener('click', () => handleCardClick(cardElement, item));
            gameBoard.appendChild(cardElement);
        });
    }

    // 处理卡片点击
    function handleCardClick(cardElement, item) {
        if (flippedCards.length < 2 && !cardElement.classList.contains('flipped') && !cardElement.classList.contains('matched')) {
            cardElement.classList.add('flipped');
            flippedCards.push({ element: cardElement, ...item });

            if (flippedCards.length === 2) {
                attempts++;
                updateInfoBar();
                checkForMatch();
            }
        }
    }

    // 检查是否匹配
    function checkForMatch() {
        const [card1, card2] = flippedCards;

        if (card1.matchId === card2.matchId && card1.id !== card2.id) {
            // 匹配成功
            score += 10;
            matchedPairs++;
            card1.element.classList.add('matched');
            card2.element.classList.add('matched');
            flippedCards = [];

            if (matchedPairs === totalPairs) {
                stopTimer();
                setTimeout(() => alert(`恭喜你！所有卡片都匹配成功了！\n得分: ${score}\n用时: ${seconds}s\n尝试次数: ${attempts}`), 300);
            }
        } else {
            // 匹配失败
            score = Math.max(0, score - 2); // 匹配失败扣分，但不低于0
            setTimeout(() => {
                card1.element.classList.remove('flipped');
                card2.element.classList.remove('flipped');
                flippedCards = [];
            }, 1000); // 1秒后翻回去
        }
        updateInfoBar();
    }

    // 更新信息栏
    function updateInfoBar() {
        scoreDisplay.textContent = score;
        attemptsDisplay.textContent = attempts;
        timerDisplay.textContent = seconds;
    }

    // 计时器
    function startTimer() {
        if (timerInterval) clearInterval(timerInterval); // 清除已有的计时器
        timerInterval = setInterval(() => {
            seconds++;
            timerDisplay.textContent = seconds;
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

    // 打乱数组 (Fisher-Yates shuffle)
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // 事件监听
    resetButton.addEventListener('click', initializeGame);

    // 初始加载游戏
    initializeGame();
});