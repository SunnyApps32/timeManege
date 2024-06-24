<template>
     <Menu pageTitle="申請学生一覧" />
    <div>
      <div v-show=!isLoading>
      <MonthBar v-on:monthReceiver="receiveMonth" v-on:yearReceiver="receiveYear"
        v-on:monthYearReceiver="receiveCurrentMonth" />
      </div>
     <br/>
     <br/>
      <ul>
        <li v-for="user in readyUsers" :key="user.uid" @click="handleUserClick(user)">
          <p>{{ user.studentNum }}  {{ user.name }} </p>
          <!-- Add more user details as needed -->
        </li>
      </ul>
    </div>
  </template>
  
  <script>
  import MonthBar from '../components/MonthBar.vue';
  import { collection, getDocs, getFirestore, getDoc, doc } from 'firebase/firestore';
  import Menu from '../components/MenuBar.vue'

  const db = getFirestore();
  
  export default {
    data() {
      return {
        readyUsers: [],
        currentMonth: '',
        users: [],
        documents: [],
        isLoading: false,
      };
    },
    components: {
      MonthBar,
      Menu
    },
    created() {
      // 初期化処理があればここに
    },
    methods: {
      async fetchUserList() {
        try {
          const usersRef = collection(db, 'users');
          const querySnapshot = await getDocs(usersRef);
  
          this.users = querySnapshot.docs.map(doc => ({
            uid: doc.id,
            ...doc.data()
          }));
  
          for (const i of this.users) {
            const docRef = doc(db, 'users', i.uid, 'jobItems', this.currentMonth);
            const docSnapshot = await getDoc(docRef);
  
            if (docSnapshot.exists()) {
              const j = docSnapshot.data().isReady || false;
              if (j === true) {
                this.readyUsers.push({
                  ...i,
                  ...docSnapshot.data()
                });
              }
            } else {
              console.log('No');
            }
          }
          console.log(this.readyUsers);
        } catch (error) {
          console.error('Error fetching ready users:', error);
        }
      },
      receiveCurrentMonth(month) {
        this.currentMonth = month;
      },
      handleUserClick(user) {
        console.log('User clicked:', user);
        this.$router.push({ name: 'UserDetail', params: { userId: user.uid, currentMonth_: this.currentMonth} });
      }
    },
    watch: {
      currentMonth: {
        async handler() {
          this.isLoading = true;
          this.users = [];
          this.readyUsers = [];
          await this.fetchUserList();
          this.isLoading = false;
        },
        immediate: false,
      },
    },
  };
  </script>
  
  <style scoped>
  /* 全体のレイアウト */
  div {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }
  
  /* ヘッダーのスタイル */
  h1 {
    text-align: center;
    color: #333;
    margin-bottom: 20px;
  }
  
  /* リストのスタイル */
  ul {
    list-style-type: none;
    padding: 0;
  }
  
  li {
    cursor: pointer;
    padding: 15px 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
    margin-bottom: 10px;
    background-color: #fff;
    transition: background-color 0.3s, box-shadow 0.3s;
  }
  
  li:hover {
    background-color: #f0f0f0;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  p {
    margin: 0;
    font-size: 16px;
    color: #555;
  }
  
  /* MonthBarのスタイル調整 */
  .month-bar {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
  }
  </style>
  