import { HttpClient } from '@angular/common/http';
import { Component, HostListener, Inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { GlobalConsts } from '../common/global';
import { UserApiService } from '../service/user_api/user-api.service';
import { Subscription } from "rxjs";
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DialogError } from './dialogs/error.component';

@Component({
	selector: 'app-game',
	templateUrl: './game.component.svg',
	styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit, OnDestroy {

	private user: any;
	private subscription: Subscription = new Subscription();
	private gameStarted: boolean = false;
	gameColor = 'rgb(20, 20, 20)';
	movablesColor = 'rgb(255, 255, 255)'

	public socket: Socket;
	gameID: string;

	game = {
		WIDTH: 100,
		HEIGHT: 100
	}

	paddle = {
		WIDTH: 1,
		HEIGHT: 20,
		PADDING: 4,
		RADIUS: 3,
		SPEED: 3
	}

	ball_t = {
		RADIUS: 1,
		SPEED: 1,
		X: 50,
		Y: 50
	}

	ball = {
		x: this.ball_t.X,
		y: this.ball_t.Y,
		xIncrement: 0,
		yIncrement: 0,
	}

	player1 = {
		score: 0,
		x: this.paddle.PADDING,
		y: (this.game.HEIGHT / 2) - (this.paddle.HEIGHT / 2)
	}

	player2 = {
		score: 0,
		x: this.game.WIDTH - this.paddle.WIDTH - this.paddle.PADDING,
		y: (this.game.HEIGHT / 2) - (this.paddle.HEIGHT / 2)
	}

	constructor(private http: HttpClient, private userApi: UserApiService,
		private route: ActivatedRoute, private dialog: MatDialog,
		private router: Router) {
		// this.start()
	}

	showError(error: string, redirect: boolean = true) {
		const tmp = this.dialog.open(DialogError, {
			data: {
				error: error
			}
		});
		if (redirect)
			tmp.afterClosed().subscribe(() => {
				this.router.navigate(['main']);
			})
		return tmp;
	}

	initSocket() {
		this.socket.onAny(data => {
		})		

		this.route.queryParams.subscribe((data: any) => {			
			if (data.id)
			{
				console.log("Connecting to game " + data.id);
				this.socket.emit('connectGame', {game_id: data.id})
			}
			else if (data.spec)
			{

			}
			else
			{
				const tmp = this.showError('Waiting for game', false);
				setTimeout(() => {
					this.socket.emit('startMatchmaking');
				}, 500);

				this.socket.on('joinedGame', (data) => {
					if (data.game_id)
					{
						this.gameID = data.game_id;
						tmp.close();
					}
					else
					{
						console.error("No gameID was sent to player");
					}
				})
			}
		})

		this.socket.on('error', (data: any) => {			
			if (!data.error)
				return;
			this.showError(data.error);
		});

		this.socket.on('user', () => {
			this.http.get(`${GlobalConsts.userApi}/user/id`).subscribe((data: any) => {
				this.socket.emit('user', {id: data.id});
			})
		});

		this.socket.on('refresh', (data: any) => {			
			this.ball.x = data[0].pos.x + 50;
			this.ball.y = data[0].pos.y + 50;
			this.player1.score = data[0].score.first;
			this.player2.score = data[0].score.second;
			this.player1.y = data[0].first + 50 - this.paddle.HEIGHT / 2;
			this.player2.y = data[0].second + 50 - this.paddle.HEIGHT / 2;
		});

		this.socket.on('joinedGame', (data: any) => {
			this.gameID = data.game_id;
		})

		this.subscription.add(this.userApi.getUser().subscribe({
			next: (data) => {
				this.user = { ...data }
				console.log('game_data:', this.user)
			},
			error: (e) => console.error('Error: get user in main:', e),
			complete: () => console.info('Complete: get user in main')
		}));
	}
	
	
	ngOnInit() : void {		
		this.socket = io(`ws://localhost:3002/game`, {
			path: '/game/socket.io',
			withCredentials: true,
			closeOnBeforeunload: true,
			reconnection: false,
			transports: ['websocket'],
			autoConnect: true,
			timeout: 3000
		}).on('connect', () => {
			this.initSocket();
		});

		setTimeout(() => {
			if (this.socket.disconnected)
			{
				this.showError('Could not connect to game server');
			}
		}, 3000);

		
	}
	
	ngOnDestroy(): void {
		this.socket.disconnect();
	}

	stopSocket() {
		this.socket.disconnect();		
	}

	resetBall() : void {
		
	}

	start(): void {
		if (!this.gameStarted) {
			this.gameStarted = true
			this.resetBall()
			window.requestAnimationFrame(() => this.moveBall());
		}
	}

	startMatchmaking() {
		this.socket.emit('startMatchmaking')
	}

	@HostListener("window:keydown", ["$event"])
	onKeyDown(e: any) {
		let threshold: number = 0
		e.preventDefault();
		if (this.socket.disconnected)
			return ;

		if (e.code === "ArrowUp") {
			threshold = -this.paddle.SPEED
		}
		if (e.code === "ArrowDown") {
			threshold = this.paddle.SPEED
		}

		/* animation was too slow - had to do this trick */
		let val: number = threshold < 0 ? -1 : 1
		this.socket.emit('input', {value: val, game_id: this.gameID});
		console.log("emit input", {value: val, game_id: this.gameID});
		
		
		// window.requestAnimationFrame(() => this.movePaddle(threshold));
	}

	movePaddle(val: number) : void {
	}

	goalCollision(x: number) {

	}

	wallCollision(y: number) {
	}

	paddleCollision(x: number, y: number) {
	}

	moveBall() : void {
		
	}

	changeColor(): void {
		const r = Math.floor(Math.random() * 256);
		const g = Math.floor(Math.random() * 256);
		const b = Math.floor(Math.random() * 256);
		this.gameColor = `rgb(${r}, ${g}, ${b})`;

		// revert ball & paddles color if the background color is too bright / dark
		if (r > 200 || g > 200 || b > 200)
			this.movablesColor = "rgb(30, 30, 30)";
		else
			this.movablesColor = "rgb(255, 255, 255)";
	}
}
