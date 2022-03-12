import { HttpClient } from "@angular/common/http";
import { Component, ElementRef, Inject, ViewChild } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { GlobalConsts } from "src/app/common/global";

@Component({
    templateUrl: './html/dialog-add-friend.html'
})
export class DialogAddFriend {
    constructor(private http: HttpClient, @Inject(MAT_DIALOG_DATA) private data: any,
    private dialog: MatDialogRef<DialogAddFriend>) {}

    @ViewChild('error') error: ElementRef<HTMLDivElement>;

    submitFriend(username: string) {
        this.http.get(`${GlobalConsts.userApi}/user/name/` + username, {withCredentials: true}).subscribe({
            next: data => {
                console.log("tesst: " + username, data);
                
                if (!data)
                    this.error.nativeElement.textContent = 'Could not find user';
                else
                {
                    this.error.nativeElement.textContent = 'Invite sent to ' + username;
                    this.http.post(`${GlobalConsts.userApi}/friend`, {
                        first: this.data.my_id,
                        second: (data as any).id
                    }, {withCredentials: true}).subscribe({next: data => {
                        this.dialog.close();    
                    }});
                }
            }
        });

    }
}