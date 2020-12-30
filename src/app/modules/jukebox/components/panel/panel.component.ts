import { Component, OnInit, Output, Input, EventEmitter, AfterViewChecked, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import * as _ from 'lodash'
import { ToastrService } from 'ngx-toastr';
import { filter } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { JukeboxService } from './../../jukebox.service';
import { Message, FeedbackMessage, SystemMessage } from '@teamberry/muscadine';
import { AuthSubject } from 'app/shared/models/session.model';
import { AuthService } from 'app/core/auth/auth.service';
import { BoxFormComponent } from 'app/shared/components/box-form/box-form.component';
import { Box } from 'app/shared/models/box.model';
import { ChatInputComponent } from '../chat-input/chat-input.component';

export type Panel = 'chat' | 'queue' | 'users' | 'commands' | 'help' | 'favorites' | 'search'

@Component({
    selector: 'app-panel',
    templateUrl: './panel.component.html',
    styleUrls: ['./panel.component.scss'],
})
export class PanelComponent implements OnInit, AfterViewInit, AfterViewChecked {
    @Input() box: Box;
    user: AuthSubject = AuthService.getAuthSubject();

    @Output() skipEvent = new EventEmitter();
    activePanel: Panel = 'chat';

    /**
     * Boolean to determine whether new messages have been received and the chat panel is not active
     *
     * @memberof PanelComponent
     */
    newMessages = false;

    @ViewChild('chatInput') chatInput: ChatInputComponent;

    constructor(
        private modalService: NgbModal,
        private jukeboxService: JukeboxService,
        private toastr: ToastrService,
    ) { }

    ngOnInit() {
        this.activePanel = 'chat';
        this.connectToStream();
    }

    ngAfterViewInit() {
    }

    ngAfterViewChecked() {
        if (this.activePanel === 'chat') {
            this.adjustView();
        }
    }

    adjustView() {
        const panelSpace = document.getElementById('panel-space');
        panelSpace.scrollTop = panelSpace.scrollHeight;
    }

    showPanel(panelToken: Panel) {
        this.activePanel = panelToken;
    }

    refreshChatStatus(event) {
        console.log(event);
    }

    /**
     * Connects to jukebox service chat stream to get messages to display
     *
     * @memberof ChatComponent
     */
    connectToStream() {
        this.jukeboxService.getBoxStream()
            .pipe( // Filtering to only act on Message instances
                filter(message =>
                    (message instanceof Message || message instanceof SystemMessage || message instanceof FeedbackMessage) && message.scope === this.boxToken
                ),
            )
            .subscribe(
                (message) => {
                    if (this.activePanel !== 'chat') {
                        if (message.source !== 'feedback') {
                            this.newMessages = true
                        } else {
                            switch (message.context) {
                                case 'success':
                                    this.toastr.success(message.contents, 'Success');
                                    break;

                                case 'warning':
                                    this.toastr.warning(message.contents, 'Warning');
                                    break;

                                case 'error':
                                    this.toastr.error(message.contents, 'Error');
                                    break;

                                case 'info':
                                default:
                                    this.toastr.info(message.contents, 'System Information');
                                    break;
                            }
                        }
                    }
                },
            );
    }

    openBoxSettings() {
        if (this.jukeboxService.evaluateCommandPower('editBox')) {
            const modalRef = this.modalService.open(BoxFormComponent, { size: 'xl' })
            modalRef.componentInstance.title = `Edit Box Settings`
            modalRef.componentInstance.box = _.cloneDeep(this.box)
        }
    }
}
