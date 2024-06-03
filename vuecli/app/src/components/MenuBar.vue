<template>
    <header>
        <div class="header_container">
            <h1 class="pageTitle">{{ pageTitle }}</h1>
            <div class="login_name">&nbsp;{{ login_name }}</div>

            <div class="header_menu">
                <div class="menu_item" v-on:click="goToHome">Home</div>
                <div class="menu_item" v-on:click="goToResearchRoomJob">研究室バイト</div>
                <!-- <div class="menu_item" v-on:click="goToTA">TA</div>
                <div class="menu_item" v-on:click="goToSkillSporter">技術補佐員</div> -->
                
                <div class="menu_item" v-on:click="goToTimeTable">時間割</div>
                <div class="menu_item" v-on:click="goToBaseSetting">TA/技術補佐員</div>
                
                <div class="menu_item" v-on:click="confirmLogout">Logout</div>
            </div>
        </div>
    </header>
</template>


<script>
  import { signOut } from "firebase/auth";
  import Firebase from "../firebase/firebase";
  const auth = Firebase.auth
export default {
    props: {
        pageTitle: String,
    },
    methods: {
         goToHome() {
            const nowRoute = this.$route.path
            if (nowRoute != '/') {
                this.$router.push('/')
            } else {
                window.location.reload()
            }
        },
        goToResearchRoomJob() {
            const nowRoute = this.$route.path
            if (nowRoute != '/ResearchRoomJob') {
                this.$router.push('/ResearchRoomJob')
            } else {
                window.location.reload()
            }
        },
        goToTA() {
            const nowRoute = this.$route.path
            if (nowRoute != '/TA') {
                this.$router.push('/TA')
            } else {
                window.location.reload()
            }
        },
        goToSkillSporter() {
            const nowRoute = this.$route.path
            if (nowRoute != '/SkillSuporter') {
                this.$router.push('/SkillSuporter')
            } else {
                window.location.reload()
            }
        },
        goToTimeTable() {
            const nowRoute = this.$route.path
            if (nowRoute != '/TimeTable') {
                this.$router.push('/TimeTable')
            } else {
                window.location.reload()
            }
        },
        goToBaseSetting() {
            const nowRoute = this.$route.path
            if (nowRoute != '/BaseSetting') {
                this.$router.push('/BaseSetting')
            } else {
                window.location.reload()
            }
        },
        

        confirmLogout() {
      const result = confirm('ログアウトしますか？')
      if (!result) { return }
      this.logOut()
    },

        //ログアウト処理
        logOut() {
          // ユーザー情報とイベント内容をログに記録
          signOut(auth).then(() => {
            // Sign-out successful.
            this.$router.push('/login')
            console.log("ログアウト成功")
            alert('ログアウトしました')
          }).catch((error) => {
            // An error happened.
            console.log('ログアウトエラー: error ->' + error)
            alert('ログアウト処理でエラーが発生しました')
          });
        },
    }
}

</script>

<style scoped>
.title_menu {
    display: flex;
    justify-content: center;
    padding: 2px 0 5px 0;
    margin: 0 0 0 10px;
}

.table-container {
    text-align: center;
    display: flex;
    justify-content: center;
}

table {
    border-collapse: collapse;
    width: 50%;

}

th,
td {
    border: 1px solid #ddd;
    padding: 3px;
    text-align: center;

}

.deleteButton {
    padding: 0;
}

.delete {
    width: 100px;
}

.addButton {
    padding: 2px;
}

th {
    padding: 8px;
    background-color: #f2f2f2;
}

.header_container {
    display: flex;
    justify-content: space-between;
    padding: 7px 25px 15px 25px;
    height: 60px;
    width: auto;
    background: #efefef;
    align-items: center;
}


.login_name {
    text-align: right;
}

.header_menu {
    display: flex;

    padding: 2px 0 5px 0;
    margin: 0 0 0 10px;
    justify-content: space-between;

}

.menu_item {
    width: max-content;
    margin-left: 30px;
}

.menu_item:hover {
    cursor: pointer;
    color: #2296f3;
    border-bottom: solid 3px #2296f3;
}

.pageTitle {
    display: flex;
    align-items: center;
}
</style>