import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import * as firebase from 'firebase';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { User } from '../models/user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly loginUrl = '/login';
  currentUser$: Observable<User>;
  currentUser: User;

  userRef = (uid: string) => this.afs.doc<User>(`users/${uid}`);
  user$ = (uid: string) =>
    this.userRef(uid)
      .get()
      .pipe(map(x => x.data() as User));

  constructor(private afAuth: AngularFireAuth, private afs: AngularFirestore, private router: Router) {
    this.currentUser$ = this.afAuth.authState.pipe(
      switchMap(user => {
        if (user) {
          return this.userRef(user.uid)
            .valueChanges()
            .pipe(
              map(u => {
                u.photoURL = u.photoURL || environment.gravatarUrl;
                this.currentUser = u;
                return u;
              })
            );
        } else {
          this.currentUser = null;
          this.router.navigateByUrl(this.loginUrl);
          return of(null);
        }
      })
    );
  }

  loginFacebook() {
    const provider = new firebase.auth.FacebookAuthProvider();
    return this.oAuthLogin(provider);
  }

  loginGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    return this.oAuthLogin(provider);
  }

  async logout() {
    await this.afAuth.auth.signOut();
    return this.router.navigateByUrl(this.loginUrl);
  }

  private oAuthLogin(provider) {
    return this.afAuth.auth.signInWithPopup(provider).then(credential => {
      console.log(credential);
      this.updateUser(credential.user);
    });
  }

  updateUser(user: any | firebase.User) {
    const userRef = this.userRef(user.uid);

    const data: any = {
      uid: user.uid,
      roles: user.roles || { user: true },
    };
    if (user.displayName) {
      data.displayName = user.displayName;
    }
    if (user.phoneNumber) {
      data.phoneNumber = user.phoneNumber;
    }
    if (user.email) {
      data.email = user.email;
    }
    if (user.photoURL) {
      data.photoURL = user.photoURL;
    }

    return userRef.set(Object.assign({}, data), { merge: true });
  }

  canRead(user: User): boolean {
    const allowed = ['admin', 'editor', 'subscriber'];
    return this.checkAuthorization(user, allowed);
  }
  canEdit(user: User): boolean {
    const allowed = ['admin', 'editor'];
    return this.checkAuthorization(user, allowed);
  }
  canDelete(user: User): boolean {
    const allowed = ['admin'];
    return this.checkAuthorization(user, allowed);
  }
  private checkAuthorization(user: User, allowedroles: string[]): boolean {
    if (!user) {
      return false;
    }
    for (const role of allowedroles) {
      if (user.roles[role]) {
        return true;
      }
    }

    return false;
  }
}
