const questionTextElement = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const submitButton = document.getElementById('submit-btn');
const nextButton = document.getElementById('next-btn');
const resultArea = document.getElementById('result-area');
const resultTextElement = document.getElementById('result-text');
const scoreElement = document.getElementById('score');

let currentQuestionIndex = 0;
let score = 0;
let questions = [];
let selectedOption = null;

// 加载题目数据
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        questions = await response.json();
        if (questions.length > 0) {
            displayQuestion(questions[currentQuestionIndex]);
        } else {
            questionTextElement.textContent = '没有题目可供显示。';
            submitButton.style.display = 'none';
        }
    } catch (error) {
        console.error('加载题目失败:', error);
        questionTextElement.textContent = '加载题目失败，请检查 questions.json 文件。';
        submitButton.style.display = 'none';
    }
}

// 显示题目和选项
function displayQuestion(question) {
    if (!question) return;
    questionTextElement.textContent = question.question;
    optionsContainer.innerHTML = ''; // 清空旧选项

    question.options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option;
        button.classList.add('option-btn');
        button.addEventListener('click', () => selectAnswer(button, option, question.options));
        optionsContainer.appendChild(button);
    });

    submitButton.style.display = 'block';
    nextButton.style.display = 'none';
    resultArea.style.display = 'none';
    selectedOption = null; // 重置已选答案
    // 确保所有选项按钮都处于非禁用状态
    document.querySelectorAll('.option-btn').forEach(btn => btn.disabled = false);
}

// 选择答案
function selectAnswer(selectedButton, optionText, allOptions) {
    // 移除其他选项的选中状态
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    // 设置当前选项为选中状态
    selectedButton.classList.add('selected');
    selectedOption = optionText;
}

// 提交答案
submitButton.addEventListener('click', () => {
    if (selectedOption === null) {
        alert('请选择一个答案！');
        return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedOption === currentQuestion.answer;

    resultArea.style.display = 'block';
    submitButton.style.display = 'none';
    nextButton.style.display = 'block';

    // 禁用所有选项按钮
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.disabled = true;
        if (btn.textContent === currentQuestion.answer) {
            btn.classList.add('correct'); // 标记正确答案
        } else if (btn.textContent === selectedOption && !isCorrect) {
            btn.classList.add('incorrect'); // 标记用户选错的答案
        }
    });


    if (isCorrect) {
        score++;
        resultTextElement.textContent = '回答正确！';
        resultTextElement.className = 'correct';
    } else {
        resultTextElement.textContent = `回答错误。正确答案是: ${currentQuestion.answer}`;
        resultTextElement.className = 'incorrect';
    }
    scoreElement.textContent = score;

    if (currentQuestionIndex >= questions.length - 1) {
        nextButton.textContent = '查看最终得分';
    }
});

// 下一题或结束游戏
nextButton.addEventListener('click', () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        displayQuestion(questions[currentQuestionIndex]);
    } else {
        // 游戏结束
        questionTextElement.textContent = '游戏结束！';
        optionsContainer.innerHTML = '';
        submitButton.style.display = 'none';
        nextButton.style.display = 'none';
        resultArea.style.display = 'block';
        resultTextElement.textContent = `你的最终得分是: ${score} / ${questions.length}`;
        resultTextElement.className = ''; // 清除颜色类
    }
});

// 初始化游戏
loadQuestions();