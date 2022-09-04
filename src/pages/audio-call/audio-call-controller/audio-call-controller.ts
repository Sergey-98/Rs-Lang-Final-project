import AudioCallView from '../audio-call-view/audio-call-view'; 
import Loader from '../../../core/components/loader/loader';
import { ResponseAuth } from '../../../core/types/loader-types';
import { Statistic } from '../../../core/types/loader-types';
import Storage from '../../../core/components/service/storage/storage';
import { Word, Stat, GlobalStat } from '../../../core/types/controller-types';
import ModalWindowController from '../../modal-window/modal-window-controller/modal-window-controller';
import {MaxParam, maxButtons, timer } from '../../../core/constants/audio-call-const';
import TextbookPage from '../../textbook/textbook-page';
import LevelPage from '../../level-page/level-page';
import { audioCallLevelMessage } from '../../../core/constants/level-const';

export default class AudioCallController {
  public view: AudioCallView;
  public loader: Loader;
  public storage: Storage;
  public audio: HTMLAudioElement;
  public gameStatistic: Stat;
  public AudioCallStatistic: GlobalStat;
  public modal: ModalWindowController;
  public life: number;
  public LevelPage: LevelPage;
  public audioCallLevelMessage: string;
  public preloader: HTMLImageElement;

  constructor() {
    this.loader = new Loader();
    this.view = new AudioCallView();
    this.storage = new Storage();
    this.audio = new Audio();
    this.AudioCallStatistic = {};
    this.gameStatistic = (JSON.parse(this.storage.get('gameStatistic') as string) as Stat) ? JSON.parse(this.storage.get('gameStatistic') as string) as Stat : {};
    this.modal = new ModalWindowController();
    this.life = this.view.removeHearth() - 1;
    this.LevelPage = new LevelPage();
    this.audioCallLevelMessage = audioCallLevelMessage;
    this.preloader = this.createPreloader();
  }
  connectWithView() {
    this.chooseLevel();
  }
  chooseLevel() {
    this.LevelPage.renderLevelPage('wrapper-audiocall', this.audioCallLevelMessage);
    const level = document.querySelectorAll('.level');
    level.forEach((elem) => {
      elem.addEventListener('click', () => {
        const buttonLevel = Number(elem.getAttribute('data-level'));
        if (buttonLevel) {
          this.storage.set('group', buttonLevel - 1);
          this.storage.set('page', 0);
          this.storage.set('position', 0);
        }
        this.startGame();
      });
    });
  }
  async fillWords(group: number, page = 0) {
    const data = await this.getWords(group, page);
    return data;
  }
  async getWords(group = 0, page = 0) {
    return await this.loader.get(`words?page=${page}&group=${group}`);
  }
  async getRightWord(page: number, group: number, position: number) {
    const words = await this.getWords(group, page);
    return words[position];
  }

  async getRandomWord() {
    const group = this.storage.get('group') as number;
    const page = this.getRandomNumber(0, MaxParam.maxPage);
    const position = this.getRandomNumber(0, MaxParam.maxPosition);
    const words = await this.getWords(group, page);
    return words[position];
  }
  async startGame() {
    this.updateGlobalStatistic()
    const position = this.storage.get('position') as number;
    if (!position) {
      this.storage.set('position', 0);
    }
    this.view.renderMainPage();
    this.life = MaxParam.maxLifes;
    this.updateInitStatistic();
    const [buildData, word] = [...(await this.getParams())];
    this.view.refreshResponse(buildData);
    this.view.refreshKeyWord(word.word, word.wordTranslate);
    this.controlAudioButton();
    this.controlNegationButton();
    this.controlAnswer(word);
  }
  async updateGlobalStatistic() {
    const user = this.storage.get('user') as ResponseAuth;
    if (user) {
      // const date = new Date();
      // const year = date.getFullYear();
      // const month = date.getMonth();
      // const day = date.getDate();
      // const today = `${day}.${month}.${year}`;
      const serverStat = await this.loader.getStatistic(`statistics`) as Statistic;
      const statistic = serverStat.optional as GlobalStat;
      if (statistic) {
        this.AudioCallStatistic = statistic;
      } else {
        this.AudioCallStatistic = {};
      }
    }
  }
  updateInitStatistic() {
    for (const stat in this.gameStatistic) {
      this.gameStatistic[stat].local = 0;
      this.gameStatistic[stat].inThisGame = false;
    }
    this.storage.set('gameStatistic', JSON.stringify(this.gameStatistic));
  }
  async setGlobalStatistic() {
    const localStat = JSON.parse(this.storage.get('gameStatistic') as string) as Stat;
    const user = this.storage.get('user') as ResponseAuth;
    if (user) {
      const date = new Date();
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      const today = `${day}.${month}.${year}`;
      console.log(localStat);
      const words = Object.keys(localStat);
      for (let i = 0; i < words.length; i += 1) {
        if (localStat[words[i]].inThisGame) {
          if (!this.AudioCallStatistic[today]) {
            this.AudioCallStatistic[today] = {};
          }
          if (!this.AudioCallStatistic[today].audioCall) {
            this.AudioCallStatistic[today].audioCall = {};
          }
          console.log(this.AudioCallStatistic, words[i]); 
          if (!this.AudioCallStatistic[today].audioCall[words[i]]) {
            this.AudioCallStatistic[today].audioCall[words[i]] = {};
          }
          if (localStat[words[i]].local === 1) {
            if (this.AudioCallStatistic[today].audioCall[words[i]].right) {
              this.AudioCallStatistic[today].audioCall[words[i]].right += 1;
            } else {
              this.AudioCallStatistic[today].audioCall[words[i]].right = 1;
            }
          } else {
            if (this.AudioCallStatistic[today].audioCall[words[i]].mistakes) {
              this.AudioCallStatistic[today].audioCall[words[i]].mistakes += 1;
            } else {
              this.AudioCallStatistic[today].audioCall[words[i]].mistakes = 1;
            }
          }
          if (localStat[words[i]].global == 3) {
            console.log('!!!');
            if (this.AudioCallStatistic[today].learnedWordsAudio) {
              this.AudioCallStatistic[today].learnedWordsAudio += 1;
            } else {
              this.AudioCallStatistic[today].learnedWordsAudio = 1;
            }
          } else {
            this.AudioCallStatistic[today].learnedWordsAudio = 0;
          }
        }
      }
    }
    this.loader.putStatistic(`statistics`, this.AudioCallStatistic, 0);
  }
  async getParams() {
    const group = this.storage.get('group') as number;
    const page = this.storage.get('page') as number;
    const position = this.storage.get('position') as number
    const word = await this.getRightWord(page, group, position);
    const buildData = await this.getButtonsData(word);
    return [buildData, word];
  }

  async getButtonsData(rightWord: string) {
    const newData = [];
    newData.push(rightWord);
    for (let i = 1; i <= maxButtons; i += 1) {
      const randWord = (await this.getRandomWord());
      if (!newData.includes(randWord)){
        newData.push(randWord);
      } else {
        const randWord = (await this.getRandomWord()).word;
        newData.push(randWord);
      }
    }
    const result = newData as Word[];
    return this.shuffle(result);
  }

  async updateAudio() {
    const group = this.storage.get('group') as number;
    const page = this.storage.get('page') as number;
    const position = this.storage.get('position') as number;
    const list = (await this.getWords(group, page))[position];
    this.setNewSrc(list.audio);
    this.audio.play();
  }
  async controlAudioButton() {
    const audioButton = document.querySelector('.audio-button') as HTMLButtonElement;
    audioButton.style.backgroundImage = 'url(../../../assets/img/audio-image.png)';
    this.updateAudio();
    audioButton?.addEventListener('click', async () => {
      this.audio.play();
    });
  }

  setNewSrc(src: string) {
    this.audio.src = `https://rs-back.herokuapp.com/${src}`;
  }
  setNewUrl(src: string): string {
    const newSrc = `https://rs-back.herokuapp.com/${src}`;
    return newSrc;
  }
  getRandomNumber(min: number, max: number) {
    return Math.ceil(Math.random() * (max - min) + min);
  } 

  shuffle(arr: Word[]){
    let j, temp;
    for(let i = arr.length - 1; i > 0; i--){
      j = Math.floor(Math.random()*(i + 1));
      temp = arr[j];
      arr[j] = arr[i];
      arr[i] = temp;
    }
    return arr;
  }

  refreshWord() {
    const group = this.storage.get('group') as number;
    const page = this.storage.get('page') as number;
    let position = this.storage.get('position') as number;
    if (!group) {
      this.storage.set('group', 0);
    }
    if (!page) {
      this.storage.set('page', 0);
    }
    if (!position) {
      this.storage.set('position', 0);
    }
    if (position >= MaxParam.maxPosition && page <= MaxParam.maxPage) {
      this.storage.set('page', page + 1);
      this.storage.set('position', -1);
      this.modal.renderModalWindow();
      this.setGlobalStatistic();
      this.controlModalWindow();
    } 
    if (page >= MaxParam.maxPage && group !== MaxParam.maxGroup) {
      this.storage.set('group', group + 1);
      this.storage.set('page', 0);
      this.storage.set('position', 0);
    } else if (group !== MaxParam.maxGroup + 1 && page !== MaxParam.maxPage + 1 && position !== MaxParam.maxPosition + 1) {
      position = this.storage.get('position') as number;
      this.storage.set('position', position + 1);
    }
  }

  async controlLife(life: number) {
    if (life >= 1) {
      this.refreshWord();
      const [buildData, word] = [...(await this.getParams())];
      this.view.refreshResponse(buildData);
      this.view.refreshKeyWord(word.word, word.wordTranslate);
      this.controlAudioButton();
      this.controlAnswer(word);
    } else {
      this.view.removeHearth();
      this.modal.renderModalWindow();
      this.setGlobalStatistic();
      this.controlModalWindow();
    }
  }

  controlNegationButton() {
    const negation = document.querySelector('.negation-button');
    negation?.addEventListener('click', async () => {
      this.life = this.view.removeHearth() - 1;
      this.addPreloader();
      this.controlLife(this.life);
    });
  }
  
  controlAnswer(buildWord: Word) {
    const answer = [...document.querySelectorAll('.word')];
    const audioButton = document.querySelector('.audio-button') as HTMLButtonElement;
    answer.forEach((elem) => {
      elem.addEventListener('click', () => {
        const right = document.querySelector('.key-word');
        right?.classList.remove('none');
        const translate = right?.getAttribute('data-ru');
        if (translate === elem.textContent) {
          elem.classList.add('right');
          const url = buildWord.image;
          if (this.gameStatistic[buildWord.word]) {
            this.gameStatistic[buildWord.word].local += 1;
            this.gameStatistic[buildWord.word].global += 1;
            this.gameStatistic[buildWord.word].general += 1;
            this.gameStatistic[buildWord.word].option = [buildWord.word, buildWord.wordTranslate, buildWord.audio]; 
            this.gameStatistic[buildWord.word].inThisGame = true;
          } else {
            this.gameStatistic[buildWord.word] = {};
            this.gameStatistic[buildWord.word].local = 1;
            this.gameStatistic[buildWord.word].global = 1;
            this.gameStatistic[buildWord.word].general = 1;
            this.gameStatistic[buildWord.word].option = [buildWord.word, buildWord.wordTranslate, buildWord.audio];
            this.gameStatistic[buildWord.word].inThisGame = true;
          }
          this.storage.set('gameStatistic', JSON.stringify(this.gameStatistic));
          audioButton.style.backgroundImage = `url(${this.setNewUrl(url)})`;
          // console.log('верно!');
          setTimeout(() => {
            this.addPreloader();
          }, 800);
          setTimeout(() => {
            this.controlLife(this.life);
          }, timer);
        } else {
          this.life = this.view.removeHearth() - 1;
          elem.classList.add('mistakes');
          if (this.gameStatistic[buildWord.word]) {
            this.gameStatistic[buildWord.word].local = 0;
            this.gameStatistic[buildWord.word].general += 1;
            this.gameStatistic[buildWord.word].option = [buildWord.word, buildWord.wordTranslate, buildWord.audio]; 
            this.gameStatistic[buildWord.word].inThisGame = true;
          } else {
            this.gameStatistic[buildWord.word] = {};
            this.gameStatistic[buildWord.word].local = 0;
            this.gameStatistic[buildWord.word].global = 0;
            this.gameStatistic[buildWord.word].general = 1;
            this.gameStatistic[buildWord.word].option = [buildWord.word, buildWord.wordTranslate, buildWord.audio];
            this.gameStatistic[buildWord.word].inThisGame = true;
          }
          this.storage.set('gameStatistic', JSON.stringify(this.gameStatistic));
          // console.log('не верно!');
          setTimeout(() => {
            this.addPreloader();
          }, 800);
          setTimeout(() => {
            this.controlLife(this.life);
          }, timer);
        }
      })
    });
  }
  createPreloader() {
    const statusMessage = document.createElement('img');
    statusMessage.classList.add('status');
    statusMessage.src = '../../../assets/svg/spinner.svg';
    statusMessage.style.cssText = `
      display: block;
      margin: 0 auto;
    `;
    return statusMessage;
  }
  addPreloader() {
    const response = document.querySelector('.response-options') as HTMLDivElement;
      response.textContent = '';
      response.append(this.preloader);
  }
  controlModalWindow() {
    const textBook = document.querySelector('.textbook');
    const refresh = document.querySelector('.refresh');
    const modalWindow = document.querySelector('.modal');
    refresh?.addEventListener('click', () => {
      this.startGame();
      modalWindow?.remove();
    });
    textBook?.addEventListener('click', () => {
      new TextbookPage().render();
      modalWindow?.remove();
    });
  }
}
