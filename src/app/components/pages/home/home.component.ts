import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../shared/auth.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Review } from '../../reviews/review-element/Review.model';
import { ReviewService } from '../../../shared/review.service';
import * as moment from 'moment';
import { TranslateService } from '@ngx-translate/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { CompanyService } from 'src/app/shared/company.service';
import { Company } from '../companies/Company.model';
import { AngularFirestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  authForm: FormGroup;
  listOfReviews: any[] = [];
  loggedIn = false;
  reviewList: any;
  paginatedReviewList: any;
  topThreeCompanies = [];
  featuredCompany: any;
  lastVisible: any;

  constructor(
    private toastr: ToastrService,
    private formBuilder: FormBuilder,
    private auth: AuthService,
    private reviewService: ReviewService,
    private translateService: TranslateService,
    private companiesService: CompanyService,
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore
  ) {
    this.authForm = this.formBuilder.group({
      email: '',
      password: '',
    });
  }

  ngOnInit(): void {
    // HTTP Loader
    this.auth.showHTTPLoader(true);

    // GET Featured Company
    this.companiesService.getFeaturedCompany().subscribe((res) => {
      res.forEach(
        (element) => {
          this.auth.showHTTPLoader(false);
          this.featuredCompany = element.payload.doc.data();
        },
        (catchErr) => {
          this.auth.showHTTPLoader(false);
          this.toastr.error(catchErr.message);
        }
      );
    });

    // GET Top Three Companies
    this.companiesService.getTopThreeCompanies().subscribe(
      (res) => {
        res.forEach((element) => {
          this.topThreeCompanies.push(element.payload.doc.data());
        });
        this.auth.showHTTPLoader(false);
      },
      (catchErr) => {
        this.auth.showHTTPLoader(false);
        this.toastr.error(catchErr.message);
      }
    );

    // GET All Rviews
    // this.reviewService.getReviews().subscribe(
    //   (data) => {
    //     this.auth.showHTTPLoader(false);
    //     this.reviewList = data.map((e) => {
    //       return { data: e.payload.doc.data(), id: e.payload.doc.id };
    //     });
    //     this.listOfReviews = this.reviewList;
    //   },
    //   (errorRes) => {
    //     this.toastr.error(errorRes.message, 'Error.');
    //     this.auth.showHTTPLoader(false);
    //   }
    // );

    // Get Initial Three Reviews
    this.reviewService.getInitialReviewPage().subscribe(
      (data) => {
        this.auth.showHTTPLoader(false);
        this.paginatedReviewList = data.map((e) => {
          this.lastVisible = e.payload.doc;
          return { data: e.payload.doc.data(), id: e.payload.doc.id };
        });
        this.listOfReviews = this.paginatedReviewList;
      },
      (errorRes) => {
        this.toastr.error(errorRes.message, 'Error.');
        this.auth.showHTTPLoader(false);
      }
    );
  }

  checkIfLoggedIn() {
    this.afAuth.onAuthStateChanged((user) => {
      if (user) {
        this.loggedIn = true;
      } else {
        this.loggedIn = false;
      }
    });
  }

  onSubmit(authData) {
    this.auth.signUp(authData.email, authData.password);
    this.authForm.reset();
  }

  nextReviewPage() {
    this.reviewService.getNextReviewPage(this.lastVisible).subscribe((data) => {
      data.map((e) => {
        this.lastVisible = e.payload.doc;
        this.listOfReviews.push({
          data: e.payload.doc.data(),
          id: e.payload.doc.id,
        });
      });
    });
  }
}
