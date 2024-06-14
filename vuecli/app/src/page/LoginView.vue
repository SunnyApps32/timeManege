<template>
    <body>
        <header>
            <div class="title">バイト時間管理
            </div>
        </header>

        <main>
            <div class="container">
                <p>ID(メールアドレス)</p>
                <input type="email" v-model="inputValueId">
                <!-- この下の<p></p>はテキストボックスを中央に配置するために必要な疑似要素です -->
                <p></p>
            </div>

            <div class="container">
                <p>パスワード</p>
                <input type="password" v-model="inputValuePassword">
                <!-- この下の<p></p>はテキストボックスを中央に配置するために必要な疑似要素です -->
                <p></p>
            </div>

            <div class="message">
                <p class="red">{{ errorMessage }}&nbsp;</p>
            </div>

            <div>
                <button class="btn_standard" type="submit" v-on:click="logIn">ログインする</button>
            </div>

            <br>
            <div>
                <button class="btn_url" v-on:click="register">新規登録はこちら</button>
            </div>

        </main>

 
    </body>
</template>

<script>

// Firebase関連のインポート
import { signInWithEmailAndPassword } from "firebase/auth";
import Firebase from "../firebase/firebase";
const auth = Firebase.auth

export default {



    methods: {
        // Home画面へ遷移
        goToHome() {
            this.$router.push('/')
        },

        // ログイン
        logIn() {
            // IDとパスワードの未入力チェック
            if (this.inputValueId === undefined || this.inputValueId === "" || this.inputValuePassword === undefined || this.inputValuePassword === "") {
                this.errorMessage = 'IDまたはパスワードが未入力です'
                return
            }

            // エラーメッセージの消去
            this.errorMessage = ""

            // ローディングアニメーション
            this.isLoading = true

            // id,passを取得
            const mId = this.inputValueId
            const mPass = this.inputValuePassword

            // 連続クリックを防ぐためにパスワード欄を空欄にする
            this.inputValuePassword = ""

            // サインインメソッド
            signInWithEmailAndPassword(auth, mId, mPass)
                // サインイン成功時
                .then((userCredential) => {
                    const user = userCredential.user;
                    console.log("ログイン成功 " + user.email)
                    this.goToHome()
                })

                // サインイン失敗時
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    console.log('ログインエラー: errorCode -> ' + errorCode + ', errorMessage -> ' + errorMessage)
                    this.JudgeErrorCode(errorCode)

                    // ローディングアニメーション
                    this.isLoading = false
                });
        },

        register(){
            this.$router.push('/register')
        },

        // FirebaseAuthから受け取ったエラーコードを判定しエラーメッセージを表示する
        JudgeErrorCode(mError) {
            const errorCode = String(mError)
            if (errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-email' || errorCode === 'auth/user-not-found') {
                this.errorMessage = "ログインに失敗しました。IDまたはパスワードが間違っています"
            } else {
                this.errorMessage = "ログインに失敗しました。予期せぬエラーが発生しました。"
            }
        },

    },

    data() {
        return {
            // ローディングアニメーション
            isLoading: false,

            // エラーメッセージ
            errorMessage: '',

            // 入力欄
            inputValueId: "",
            inputValuePassword: "",
        }
    },

    computed: {

    },


}
</script>

<style scoped>
header {
    height: 120px;
}

header .title {
    font-size: 40px;
    padding: 20px 0 0;
}

main {
    padding: 30px auto;
}

.container {
    display: flex;
    justify-content: center;
    margin: 30px 0 0;
}

.container input {
    width: 400px;
}

.container p {
    width: 200px;
    text-align: left;
    margin-top: 8px;
}

.login_info_container {
    display: flex;
    justify-content: center;
    margin-top: 10px;
}

.login_info {
    text-align: left;
    background-color: #efefef;
    padding: 20px 100px;
    border-radius: 20px;
}

.loading_animation_container {
    height: 15px;
    margin-top: 10px;
}

.btn_url {
  border-radius: 0px;
  padding: 0;

  background-color: white;
  border-color: white;
  color: blue;

  transform: translate(0, 0px);

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
