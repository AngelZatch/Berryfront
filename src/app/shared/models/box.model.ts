import { Injectable } from '@angular/core';

import { PlaylistItem } from './playlist-item.model';

@Injectable()
export class Box {
    _id: string;
    creator: string | {
        _id: string,
        name: string
    };
    description: string;
    lang: string;
    name: string;
    playlist: Array<PlaylistItem>;

    constructor(obj?: any) {
        this._id = obj && obj._id || null;
        this.creator = obj && obj.creator || null;
        this.description = obj && obj.description || null;
        this.lang = obj && obj.lang || 'English';
        this.name = obj && obj.name || null;
        this.playlist = obj && obj.playlist || [];
    }
}
