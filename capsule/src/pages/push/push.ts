import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, Slides } from 'ionic-angular';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { AuthServiceProvider } from '../../providers/auth-service/auth-service';
import { ImagePicker, ImagePickerOptions } from '@ionic-native/image-picker';
import { Base64 } from '@ionic-native/base64';
import { MainPage } from '../main/main';
import { Geolocation } from '@ionic-native/geolocation';

/**
 * Generated class for the PushPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 * 
 * 이미지 피커 오류 해결법 :
 *  일단 이미지 피커를 삭제한다. - cordova plugin remove cordova-plugin-image-picker
 *  그 다음 이미지 피커를 git에서 가지고 온다 - cordova plugin add https://github.com/wymsee/cordova-imagePicker.git
 * 
 */
@IonicPage()
@Component({
  selector: 'page-push',
  templateUrl: 'push.html',
})
export class PushPage {

  // request data
  /**
   * 유저아이디,
   * 캡슐이름,
   * 사진,
   * 친구,
   * 봉인할 기간,
   * 좌표
   */
  responseData: any;
  requestData = {
    "user_id": "", 
    "capsule_name": "", // ok
    "friends":"", // ok
    "expiredate": "", // ok
    "photos": "",
    "latitude": 1,
    "longitude": 2
  };

  requestPhotos = {
    "base64String": ""
  };


  public photos: any;
  public base64Image: string;

  constructor(public navCtrl: NavController, public navParams: NavParams, private camera: Camera
  , private alertCtrl: AlertController, public authServiceProvider: AuthServiceProvider,
    public imagePicker: ImagePicker, private base64: Base64, public alerCtrl: AlertController,
    private geolocation: Geolocation) {
     const data = JSON.parse(localStorage.getItem('userData'));
      this.requestData.expiredate = "2017-07-20T07:20Z";
      this.requestData.user_id = data['user_id'];
      this.getGeolocation();
      // this.requestData.latitude = "12.5";
      // this.requestData.longitude = "34.4";
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad PushPage');
  }

  getGeolocation() {
    this.geolocation.getCurrentPosition().then((resp) => {

      this.requestData.latitude = resp.coords.latitude;
      this.requestData.longitude = resp.coords.longitude;

    }).catch((error) => {
      console.log('Error getting location', error);
    });
  }

  doAlert(title,content) {
    let alert = this.alerCtrl.create({
      title: title,
      message: content,
      buttons: ['Ok']
    });
    alert.present()
  }

  capsulePut() {
    
    this.requestData.capsule_name = this.requestData.capsule_name.trim();
    this.requestData.friends = this.requestData.friends.trim();
    this.requestData.expiredate = this.requestData.expiredate.trim();

    this.authServiceProvider.postData(this.requestData, '/capsulePush.php').then((result)=> {
      
      this.responseData = result;
      // console.log(this.responseData);
      var code = this.responseData[0]['code'];
      var message = this.responseData[0]['message'];
      
      if( code == "success" ) { // 회원가입 성공
        
        this.doAlert("캡슐 성공!", message);
        this.navCtrl.push(MainPage);

      } else {
        this.doAlert("캡슐 실패!",message);
      }

      // 1차 추출 데이터
      // {"user_id":"","capsule_name":"hello","friends":"fadsfa","expiredate":"2017-01-01","latitude":"","longitude":""}
      // 2차 추출 데이터
      // "user_id":"ccc23@cyh.com","capsule_name":"name","friends":"hello,cyh","expiredate":"2017-11-07","latitude":"12.5","longitude":"34.4"
      
    });

  }

  imageRequest(base64String) {
    this.requestPhotos.base64String = base64String;
    this.authServiceProvider.postData(this.requestPhotos, '/complete.php').then((result)=> {
      // this.responseData = result;
      // console.log(this.responseData);
    });
  }

 


  ngOnInit() {
    this.photos = [];
  }

  getPhoto() {
    /**
     * 
     * 따로 분리해서 보내는것이 좋을것같음.
     * 
     * 사진 전송 과정
     * 
     *  - 사용자가 사진을 선택함.
     *  - 사진을 base64로 인코딩함.
     *  - 서버로 base64로 인코딩된것을 전송함.
     *  - 서버에서는 base64인코딩을 디코딩하고 이미지 파일을 얻어서 지정된 경로에 저장한다.
     * 
     */

    // this.requestData.photos="hello" 

    let options: ImagePickerOptions = {
        // maximumImagesCount: 1, // Max number of selected images, I'm using only one for this example
        // width: 800,
        // height: 800,
        outputType: 0,
        quality: 100            // Higher is better
    };

    this.imagePicker.getPictures(options).then((results) => { // 사진 선택 및 가져오기
      for (var i=0; i<results.length; i++) {
        this.requestData.photos = results[i];
        this.getBase64ToRequest(results[i]);
      }
    }, (err) => {});

  }

  getBase64ToRequest(file_path) {
    this.base64.encodeFile(file_path).then((base64File: string) => {
      // console.log(base64File);

      this.requestData.photos = base64File;
      this.imageRequest(base64File);

    }, (err) => {
      console.log(err);
    });
  }

  takePhoto() {

    let options: CameraOptions = {
      quality: 100,
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE
    }

    this.camera.getPicture(options).then((imageData) => {
    // imageData is either a base64 encoded string or a file URI
    // If it's base64:
    let base64Image = 'data:image/jpeg;base64,' + imageData;
    this.photos.push(this.base64Image);
    this.photos.reverse();
    }, (err) => {
    // Handle error
    });
  }

  deletePhoto(index) {
    let alert = this.alertCtrl.create({
    title: 'Sure you want to delete this picture?',
    message: '',
    buttons: [
      {
        text: 'No',
        handler: () => {
          console.log('Cancel clicked');
        }
      },
      {
        text: 'Yes',
        handler: () => {
          this.photos.splice(index,1);
        }
      }
    ]
  });
  alert.present();
}

  @ViewChild(Slides) slides: Slides;

  goToNextSlide() {
    var index = this.slides.getActiveIndex();

    

    if(index < 3) {
      if(!((index == 0 && (<HTMLInputElement>document.getElementById("formInput1")).value == "") ||
      (index == 1 && (<HTMLInputElement>document.getElementById("formInput2")).value == "") ||
      (index == 2 && this.requestData.photos == ""))) {
        this.slides.slideTo((index + 1), 500);

        if(index == 2) {
          document.getElementById("pushNext").innerHTML="완료";
        }
      }
    } else if(index == 3) {
      if(((<HTMLInputElement>document.getElementById("formInput1")).value == "") && ((<HTMLInputElement>document.getElementById("formInput2")).value == "") && (this.requestData.photos == "")) {
        
      } else {
        this.capsulePut();
      }
    }
  }

  slideChanged() {
    var index = this.slides.getActiveIndex();

    if(index < 3) {
      document.getElementById("pushNext").innerHTML="다음";
    } else if(index == 3) {
      document.getElementById("pushNext").innerHTML="완료";
    }
  }

}
