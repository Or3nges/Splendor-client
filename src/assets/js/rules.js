const articles = document.querySelectorAll('.rule-article');
let currentArticleIndex = 0;

function init() {
    showArticle(currentArticleIndex);
}

document.querySelector("#back-button").addEventListener("click", () => {
    window.location.href = "../index.html";
});


function showArticle(index) {
    articles.forEach((article, i) => {
        article.classList.toggle('active', i === index);
    });
}

const prevButton = document.querySelector('.nav-buttons button:nth-child(1)');
const nextButton = document.querySelector('.nav-buttons button:nth-child(2)');

prevButton.addEventListener('click', () => {
    currentArticleIndex = (currentArticleIndex > 0) ? currentArticleIndex - 1 : articles.length - 1;
    showArticle(currentArticleIndex);
});

nextButton.addEventListener('click', () => {
    currentArticleIndex = (currentArticleIndex < articles.length - 1) ? currentArticleIndex + 1 : 0;
    showArticle(currentArticleIndex);
});

init();