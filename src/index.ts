import './global.css';

import TextbookPage from './pages/textbook/textbook-page';
import AuthPage from './pages/auth/auth-page';
import { SprintGameApp } from './pages/sprint-game/app/sprint-game-app';
import AudioCallApp from './pages/audio-call/app/audio-call-app';
import StatisticController from './pages/statistic-page/statistic-controller/statistic-cotroller';
// import App from './core/components/app/app';

// const app = new App();
const textbook = new TextbookPage();
const auth = new AuthPage();
const sprintGame = new SprintGameApp();
const audioCallGame = new AudioCallApp();
const statistic = new StatisticController();

const authLink = document.querySelector('.header__nav-auth') as HTMLElement;
const sprintLink = document.querySelector('.header__nav-game-sprint') as HTMLElement;
const audioCallLink = document.querySelector('.header__nav-game-audiocall') as HTMLElement;
const textbookLink = document.querySelector('.header__nav-learn-textbook') as HTMLElement;
const statisticLink = document.querySelector('.header__nav-stats') as HTMLElement;

textbookLink.onclick = () => textbook.render();
audioCallLink.onclick = () => audioCallGame.renderAudioCall();
statisticLink.onclick = () => statistic.render();
sprintLink.onclick = () => sprintGame.starting();
authLink.onclick = () => auth.render();
textbook.render();
