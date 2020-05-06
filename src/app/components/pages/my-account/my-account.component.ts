import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReviewService } from '../../../shared/review.service';
import { CompanyService } from 'src/app/shared/company.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../../../shared/auth.service';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-my-account',
  templateUrl: './my-account.component.html',
  styleUrls: ['./my-account.component.scss']
})
export class MyAccountComponent implements OnInit, OnDestroy {
  companies = [];
  inputForm: FormGroup;
  accountChangesForm: FormGroup;
  public showDialog = false;
  private toastrMessages;
  private subscription: Subscription;

  constructor(
    private reviewService: ReviewService,
    private companyService: CompanyService,
    private authService: AuthService,
    private toastr: ToastrService,
    private translateService: TranslateService,
    private af: AngularFirestore
  ) {}

  ngOnInit() {
    this.translateService.get('TOASTR').subscribe(response => {
      this.toastrMessages = response;
    });
    this.authService.showHTTPLoader(true);
    this.subscription = this.companyService.getCompanies().subscribe(
      data => {
        this.authService.showHTTPLoader(false);
        data.map(e => {
          this.companies.push(e.payload.doc.data());
        });
      },
      errorRes => {
        this.authService.showHTTPLoader(false);
        this.toastr.error(errorRes.message, this.toastrMessages.ERROR_TITLE);
      }
    );

    this.initForms();
  }

  // <Create new review>
  create() {
    this.authService.showHTTPLoader(true);
    const review = this.inputForm.value;
    this.inputForm.reset();
    review.timeStamp = new Date();

    this.companies.forEach(c => {
      if (c.name === review.companyName) {
        review.imagePath = c.logo;
      }
    });
    this.authService.getUsername().subscribe(e => {
      if (!e.emailVerified) {
        this.toastr.error(
          this.toastrMessages.UNVERIFIED,
          this.toastrMessages.ERROR_TITLE
        );
        this.authService.showHTTPLoader(false);
        return;
      }
      review.userName = e.email;
      this.reviewService
        .postReview(review)
        .then(response => {
          this.reviewService.upvoteReview(response.id, 0, '');
          this.authService.showHTTPLoader(false);
          this.toastr.success(
            this.toastrMessages.SUBMITTED_REVIEW,
            this.toastrMessages.SUCCESS_TITLE
          );
        })
        .catch(errorRes => {
          this.authService.showHTTPLoader(false);
          this.toastr.error(errorRes.message, this.toastrMessages.ERROR_TITLE);
        });
    });
  }
  // </Create new review>

  requestVerification() {
    if (this.accountChangesForm.value.linkedInAccount) {
      this.authService.showHTTPLoader(true);
      this.authService.getUsername().subscribe(e => {
        this.af.collection('verifications').add({
          email: e.email,
          linkedin: this.accountChangesForm.value.linkedInAccount
        });
      });
      this.authService.showHTTPLoader(false);
      this.toastr.success(
        this.toastrMessages.VERIFICATION_SENT,
        this.toastrMessages.THANK
      );
    } else {
      this.authService.showHTTPLoader(false);
      this.toastr.error(this.toastrMessages.LINKEDIN, this.toastrMessages.OOPS);
    }
  }

  changeEmail() {
    this.toastr.info(this.toastrMessages.COMING_SOON, this.toastrMessages.OOPS);
  }

  toggleDialog() {
    this.showDialog = !this.showDialog;
  }

  forgotPasswordDialog() {
    this.authService.showHTTPLoader(true);
    this.authService.getUsername().subscribe(user => {
      this.authService.resetPassword(user.email);
      this.showDialog = false;
    });
  }

  updatePassword() {
    if (
      this.accountChangesForm.value.newPassword &&
      this.accountChangesForm.value.newPasswordConfirm
    ) {
      if (
        this.accountChangesForm.value.newPassword ===
        this.accountChangesForm.value.newPasswordConfirm
      ) {
        this.authService.showHTTPLoader(true);
        this.authService.getUsername().subscribe(e => {
          e.updatePassword(this.accountChangesForm.value.newPassword)
            .then(() => {
              this.authService.showHTTPLoader(false);
              this.toastr.success(
                this.toastrMessages.UPDATE_PASS,
                this.toastrMessages.SUCCESS_TITLE
              );
            })
            .catch(err => {
              this.authService.showHTTPLoader(false);
              this.toastr.error(err.message, this.toastrMessages.ERROR_TITLE);
            });
        });
      } else {
        this.toastr.error(
          this.toastrMessages.MATCHING,
          this.toastrMessages.ERROR_TITLE
        );
      }
    } else {
      this.toastr.error(
        this.toastrMessages.FILL_PASSWORD,
        this.toastrMessages.ERROR_TITLE
      );
    }
  }

  initForms() {
    // Review Input Form
    const companyName = '';
    const rating = '';
    const textExcerpt = '';

    this.inputForm = new FormGroup({
      companyName: new FormControl(companyName),
      rating: new FormControl(rating, Validators.required),
      textExcerpt: new FormControl(textExcerpt, Validators.required)
    });

    // Account Changes Form

    const linkedInAccount = '';
    const changeEmailInput = '';
    const newPassword = '';
    const newPasswordConfirm = '';
    const companyAddedNotification = '';
    const myCompanyNotifications = '';
    const multipleCompanies = '';

    this.accountChangesForm = new FormGroup({
      linkedInAccount: new FormControl(linkedInAccount),
      changeEmailInput: new FormControl(changeEmailInput, Validators.email),
      newPassword: new FormControl(newPassword),
      newPasswordConfirm: new FormControl(newPasswordConfirm),
      companyAddedNotification: new FormControl(companyAddedNotification),
      myCompanyNotifications: new FormControl(myCompanyNotifications),
      multipleCompanies: new FormControl(multipleCompanies)
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
