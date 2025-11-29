import './style.css' // We'll keep this but empty it or use it for resets if needed
import { Game } from './Game'

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const game = new Game(canvas);

game.start();
