import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Subscription } from 'rxjs';

import { User } from '../../shared/models/user';
import { PhotoService } from '../../shared/services/photo.service';
import { UtilService } from '../../shared/services/util.service';
import { BlogService } from '../blog.service';
import { Post } from '../post';

@Component({
  templateUrl: './post-edit.component.html',
  styleUrls: ['./post-edit.component.scss'],
})
export class PostEditComponent implements OnInit, OnDestroy {
  constructor(
    public route: ActivatedRoute,
    public router: Router,
    public blogService: BlogService,
    public photoService: PhotoService,
    public util: UtilService
  ) {}
  private subs = new Subscription();
  @ViewChild('editForm', { static: false }) editform: NgForm;

  Editor = ClassicEditor;
  user: User;
  post: Post;

  selectedFile: any;

  async ngOnInit() {
    const postId = this.route.snapshot.paramMap.get('postId');
    if (postId) {
      this.post = await this.blogService.post$(postId).toPromise();
    } else {
      this.post = new Post();
    }
  }

  async save(post: Post) {
    await this.blogService.upsertPost(post, this.selectedFile);

    this.editform.reset();
    this.router.navigateByUrl(`/posts`);
  }

  processFile(imageInput: any) {
    this.selectedFile = this.photoService.processFile(imageInput);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
