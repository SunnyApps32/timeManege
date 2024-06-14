<template>
    <div class="register-container">
      <h2>ユーザー登録</h2>
      <form @submit.prevent="registerUser">
        <div>
          <label for="email">メールアドレス</label>
          <input type="email" v-model="email" required />
        </div>
        <div>
          <label for="password">パスワード</label>
          <input type="password" v-model="password" required />
        </div>
        <div>
          <label for="studentNum">学籍番号</label>
          <input type="number" v-model="studentNum" required />
        </div>
        <div>
          <label for="name">名前</label>
          <input type="text" v-model="name" required />
        </div>
        <button type="submit">登録</button>
      </form>
    </div>
      <br>
            <div>
                <button class="btn_url" v-on:click="login">ログインはこちら</button>
            </div>
   
  </template>
  
  <script>
  import Firebase from "../firebase/firebase";
  import { getFirestore, doc, setDoc } from "firebase/firestore";
  import { createUserWithEmailAndPassword } from "firebase/auth";
  
  const auth = Firebase.auth;
  const db = getFirestore();
  
  export default {
    data() {
      return {
        email: "",
        password: "",
        name: "",
        studentNum:"",
        type:"student",
      };
    },
    methods: {
      login(){
            this.$router.push('/login')
        },
      async registerUser() {
        try {
          // Firebase Authenticationでユーザー登録
          createUserWithEmailAndPassword(auth, this.email, this.password)
          .then((userCredential) => {
            // Signed in 
            const user = userCredential.user;
            console.log("成功 " + user.email)
            // ..
            this.setFirebase(user);
          })
          .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log("エラー" + errorCode + errorMessage);
            // ..
          });

  
        } catch (error) {
          console.error("ユーザー登録エラー: ", error);
          alert("ユーザー登録に失敗しました");
        }
      },

      async setFirebase(user){
        try {

          if (this.studentNum == "757951218171"){
            this.type = "teacher";
          }else if (this.studentNum == "757955230042"){
            this.type = "secretary";
          }
          // Firestoreにユーザー情報を保存
          await setDoc(doc(db, "users", user.uid), {
            email: this.email,
            name: this.name,
            uid: user.uid,
            studentNum: this.studentNum,
            type: this.type,
            createdAt: new Date()
          });
  
          alert("ユーザー登録が成功しました");
          this.$router.push('/');
        } catch (error) {
          console.error("ユーザー登録エラー: ", error);
          alert("ユーザー登録に失敗しました");
        }
      }
    }
  };
  </script>
  
  <style scoped>

.btn_url {
  border-radius: 0px;
  padding: 0;

  background-color: white;
  border-color: white;
  color: blue;

  transform: translate(0, 0px);

}

  .register-container {
    max-width: 400px;
    margin: 0 auto;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
  }
  
  form div {
    margin-bottom: 15px;
  }
  
  label {
    display: block;
    margin-bottom: 5px;
  }
  
  input {
    width: 100%;
    padding: 8px;
    box-sizing: border-box;
  }
  
  button {
    padding: 10px 15px;
    background-color: #007bff;
    color: white;
    border: none;
    cursor: pointer;
    border-radius: 5px;
  }
  
  button:hover {
    background-color: #0056b3;
  }


  </style>
  