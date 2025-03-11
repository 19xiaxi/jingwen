const flipButton = document.getElementById('flip-button');
const rightPage = document.querySelector('.page-right');

flipButton.addEventListener('click', () => {
    rightPage.classList.toggle('flipped');
});