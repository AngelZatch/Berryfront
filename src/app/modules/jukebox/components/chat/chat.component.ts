import { Component, OnInit, Output, Input, EventEmitter, AfterViewChecked } from '@angular/core';
import { ChatService } from './../../../../shared/services/chat.service';
import { BoxService } from './../../../../shared/services/box.service';
import { PlayerService } from './../../../../shared/services/player.service';
import { UserService } from './../../../../shared/services/user.service';

@Component({
    selector: 'app-chat-widget',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss'],
    providers: [ChatService, BoxService, PlayerService, UserService]
})
export class ChatComponent implements OnInit, AfterViewChecked {
    @Input() token: string;
    @Output() skipEvent = new EventEmitter();
    contents = '';
    hasLink = false;
    hasCommand = false;
    messages = [];
    playlist;
    likes;
    activePanel = 'chat';

    constructor(
        private chatService: ChatService,
        private playerService: PlayerService,
        private userService: UserService
    ) { }

    ngOnInit() {
        if (this.token !== undefined) {
            this.fetchMessages();
            this.fetchPlaylist();
            this.fetchLikes();
        }
    }

    ngAfterViewChecked() {
        if (this.activePanel === 'chat') {
            this.adjustChat();
        }
    }

    showPanel(panelToken: string) {
        this.activePanel = panelToken;
    }

    watchContents() {
        const reg = new RegExp(/(\?v=([a-z0-9\-\_]+)\&?)|(\.be\/([a-z0-9\-\_]+)\&?)/i);
        let res;
        this.hasCommand = false;
        this.hasLink = false;
        if (this.contents.indexOf('!') === 0) {
            this.hasCommand = true;
        } else if (res = reg.exec(this.contents) != null) {
            this.hasLink = true;
        }
    }

    post(event) {
        event.preventDefault();
        const contents = this.contents;
        this.contents = '';
        if (this.hasLink && !event.ctrlKey) {
            this.handleLinks(contents);
        } else if (this.hasCommand && !event.ctrlKey) {
            this.handleCommands(contents);
        } else {
            this.handleMessage(contents);
        }
    }

    handleMessage(contents) {
        const message = {
            type: 1,
            scope: 1,
            contents: contents,
            author: 'D1JU70',
            destination: null,
        };
        this.chatService.post(this.token, message).subscribe(
            data => {
                this.hasCommand = false;
                this.hasLink = false;
                this.fetchMessages();
            }
        );
    }

    handleLinks(contents) {
        const reg = new RegExp(/(\?v=([a-z0-9\-\_]+)\&?)|(\.be\/([a-z0-9\-\_]+)\&?)/i);
        const res = reg.exec(contents);

        const video = {
            link: (res[2]) ? res[2] : res[4],
            author: 'D1JU70'
        };

        this.playerService.submit(this.token, video).subscribe(
            data => {
                this.fetchPlaylist();
            }
        );
    }

    handleCommands(contents) {
        const command = contents.substr(1).split(' ');
        switch (command[0]) {
            case 'skip':
            case 'next':
                this.emitSkip();
                break;

            case 'shuffle':
            case 'random':
                this.shuffle();
                break;

            default:
                break;
        }
    }

    fetchMessages() {
        this.chatService.list(this.token).subscribe(
            data => {
                this.messages = data;
            }
        );
    }

    fetchPlaylist() {
        this.playerService.playlist(this.token).subscribe(
            data => {
                this.playlist = data;
            }
        );
    }

    fetchLikes() {
        this.userService.likes('D1JU70').subscribe(
            data => {
                this.likes = data;
            }
        );
    }

    quickQueue(link: string) {
        const video = {
            link: link,
            author: 'D1JU70'
        };
        this.playerService.submit(this.token, video).subscribe(
            data => {
                this.fetchPlaylist();
            }
        );
    }

    emitSkip() {
        this.skipEvent.emit();
    }

    shuffle() {
        this.playerService.shuffle(this.token).subscribe(
            data => {
                this.fetchPlaylist();
            }
        );
    }

    swap(video: any, direction: string) {
        const action = {
            room_history_id: video.room_history_id,
            playlist_order: video.playlist_order,
            direction: direction
        };

        this.playerService.swap(this.token, action).subscribe(
            data => this.fetchPlaylist()
        );
    }

    banVideo(video: any) {
        video.video_status = 3;
        this.playerService.update(this.token, video).subscribe(
            data => this.fetchPlaylist()
        );
    }

    unbanVideo(video: any) {
        video.video_status = 0;
        this.playerService.update(this.token, video).subscribe(
            data => this.fetchPlaylist()
        );
    }

    adjustChat() {
        const chatSpace = document.getElementById('chat-space');
        chatSpace.scrollTop = chatSpace.scrollHeight;
    }

    requestSkip() { }
}
