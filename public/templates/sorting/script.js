document.addEventListener('DOMContentLoaded', () => {
    const sortableList = document.getElementById('sortable-list');
    const checkButton = document.getElementById('check-button');
    const feedbackElement = document.getElementById('feedback');
    const timeElapsedElement = document.getElementById('time-elapsed');
    const currentScoreElement = document.getElementById('current-score');

    let elements = [];
    let correctOrder = [];
    let timerInterval;
    let secondsElapsed = 0;
    let score = 0;
    let gameStarted = false;
    let draggingElement = null;

    async function loadElements() {
        try {
            const response = await fetch('elements.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            elements = data.items; // The items to be sorted
            correctOrder = [...elements].sort((a, b) => a.correctOrder - b.correctOrder).map(item => item.id);
            shuffleAndDisplayElements();
            if (!gameStarted) {
                startTimer();
                gameStarted = true;
            }
        } catch (error) {
            console.error('Error loading elements:', error);
            feedbackElement.textContent = '加载游戏元素失败，请检查 elements.json 文件。';
            feedbackElement.className = 'incorrect';
        }
    }

    function shuffleAndDisplayElements() {
        const shuffledElements = [...elements].sort(() => Math.random() - 0.5);
        sortableList.innerHTML = ''; // Clear previous items
        shuffledElements.forEach(element => {
            const listItem = document.createElement('div');
            listItem.classList.add('sortable-item');
            listItem.textContent = element.text;
            listItem.setAttribute('draggable', true);
            listItem.dataset.id = element.id;
            sortableList.appendChild(listItem);
        });
        addDragListeners();
    }

    function addDragListeners() {
        const items = sortableList.querySelectorAll('.sortable-item');
        items.forEach(item => {
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragover', handleDragOver);
            item.addEventListener('drop', handleDrop);
            item.addEventListener('dragend', handleDragEnd);
        });
    }

    function handleDragStart(e) {
        draggingElement = e.target;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', e.target.dataset.id);
        setTimeout(() => {
            e.target.classList.add('dragging');
        }, 0);
    }

    function handleDragOver(e) {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'move';
        const targetItem = e.target.closest('.sortable-item');
        if (targetItem && draggingElement !== targetItem) {
            const rect = targetItem.getBoundingClientRect();
            const nextSibling = (e.clientY - rect.top) > (rect.height / 2) ? targetItem.nextSibling : targetItem;
            sortableList.insertBefore(draggingElement, nextSibling);
        } else if (!targetItem && draggingElement) { // Allow dropping into empty space
            // Check if dragging over the list itself but not an item
            const listRect = sortableList.getBoundingClientRect();
            if (e.clientY >= listRect.top && e.clientY <= listRect.bottom) {
                // Heuristic: if dragging towards the end of the list, append.
                // This part might need refinement for better UX in empty or sparse lists.
                const children = Array.from(sortableList.children);
                const lastChild = children[children.length - 1];
                if (lastChild && e.clientY > lastChild.getBoundingClientRect().bottom) {
                    sortableList.appendChild(draggingElement);
                } else if (!children.length) {
                    sortableList.appendChild(draggingElement);
                }
            }
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        // The actual reordering is handled in dragOver for immediate visual feedback.
        // Here we just clean up.
        if (draggingElement) {
            draggingElement.classList.remove('dragging');
        }
        draggingElement = null;
    }

    function handleDragEnd(e) {
        if (e.target.classList.contains('dragging')) {
            e.target.classList.remove('dragging');
        }
        draggingElement = null;
    }


    function checkOrder() {
        const currentOrder = Array.from(sortableList.querySelectorAll('.sortable-item')).map(item => item.dataset.id);
        let isCorrect = true;
        if (currentOrder.length !== correctOrder.length) {
            isCorrect = false;
        } else {
            for (let i = 0; i < correctOrder.length; i++) {
                if (currentOrder[i] !== correctOrder[i]) {
                    isCorrect = false;
                    break;
                }
            }
        }

        if (isCorrect) {
            feedbackElement.textContent = '恭喜你，顺序正确！';
            feedbackElement.className = 'correct';
            score += 100 - secondsElapsed; // Simple scoring logic
            currentScoreElement.textContent = score < 0 ? 0 : score;
            stopTimer();
            checkButton.disabled = true;
        } else {
            feedbackElement.textContent = '顺序不正确，请再试一次。';
            feedbackElement.className = 'incorrect';
            score -= 10; // Penalty for incorrect attempt
            currentScoreElement.textContent = score < 0 ? 0 : score;
        }
    }

    function startTimer() {
        secondsElapsed = 0;
        timeElapsedElement.textContent = secondsElapsed;
        timerInterval = setInterval(() => {
            secondsElapsed++;
            timeElapsedElement.textContent = secondsElapsed;
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

    checkButton.addEventListener('click', checkOrder);

    // Load elements when the page loads
    loadElements();
});