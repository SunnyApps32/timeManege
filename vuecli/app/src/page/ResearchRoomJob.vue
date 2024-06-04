<template>
  <div>
    <Menu pageTitle="研究室バイト" />
    <MonthBar v-on:monthYearReceiver="receiveCurrentMonth" />

    <form @submit.prevent="addNewRequest" class="request-form">
      <table>
        <tr>
        <th>
          <label>作業名 </label>
        </th>
        <th>
          <label>作業時間(※15分単位,記入例："5.25"時間)</label>
        </th>
      </tr>
      <tr>
        <td> <input v-model="requestName" required></td>
        <td>
          <NumberInput :value="requestInt" v-on:sendMessage="updateRequestInt"/>
        </td>
      </tr>
      </table>
    
     
  
      <button type="submit">登録</button>
    </form>

    <br>
    <h1>申請リスト</h1>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>プロジェクト名</th>
            <th>時間</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in monthItems" :key="item.id" draggable="true" @dragstart="dragStart(index)"
            @dragover.prevent @drop="drop(index)">
            <td>{{ item.content }}</td>
            <td>{{ item.time }}</td>
            <td class="delete"><button type="button" class="deleteButton" @click="confirmRemove(index)">削除</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import Menu from '../components/MenuBar.vue'
import NumberInput from '../components/NumberInput.vue'
import MonthBar from '../components/MonthBar.vue'
import { onAuthStateChanged } from "firebase/auth";
import Firebase from "../firebase/firebase";
import { getFirestore, setDoc, doc, getDoc, deleteDoc, getDocs, collection, addDoc } from 'firebase/firestore';

const auth = Firebase.auth

const db = getFirestore()

export default {
  data() {
    return {
      childMessage: '',
      currentMonth: '',
      monthItems: [],
      requestName: '',
      requestInt: '',
    }
  },
  created() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.uid = user.uid;
        this.checkAndCreateUserDoc();
        this.fetchItems();
      } else {
        console.log('User is not logged in.');
      }
    });
  },
  components: {
    Menu,
    NumberInput,
    MonthBar,
  },
  methods: {
    async fetchItems() {
      this.monthItems = []
      try {
        console.log(this.currentMonth);
        const items =  await getDocs(collection(db, 'users', this.uid, 'jobItems', this.currentMonth, 'item'));

        const batch = items.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        for (let i = 0; i < batch.length; i++) {
          this.monthItems.push(batch[i]);
          console.log(batch[i]);
        }
      } catch (error) {
        console.error('Error fetching : ', error);
      }
    },
    async checkAndCreateUserDoc() {
      try {
        const userDocRef = doc(db, 'users', this.uid, "jobItems", this.currentMonth);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          await setDoc(userDocRef, { month: this.currentMonth });
          console.log('User document created.');
        } else {
          console.log('User document already exists.');
        }

      } catch (error) {
        console.error('Error checking/creating user document: ', error);
      }
    },
    updateRequestInt(value) {
      this.requestInt = value;
    },
    receiveCurrentMonth(month) {
     
      this.currentMonth = month;
      this.fetchItems();
    },
    async addNewRequest() {
      try {


        const item = {
          time: this.requestInt,
          content: this.requestName,

        };

        const docRef = await addDoc(collection(db, 'users', this.uid, 'jobItems',this.currentMonth,'item'), item);

        const sendItem = { id: docRef.id, ...item };
        this.monthItems.push(sendItem);
        this.requestInt = '';
        this.requestName = '';



      } catch (error) {
        console.error('Error adding : ', error);
      }



    },

    confirmRemove(index) {
      const result = confirm('削除しますか？');
      if (!result) return;
      this.removeRequest(index);
    },
    async removeRequest(index) {
      const itemToDelete = this.monthItems[index];
      //console.log(teacherToDelete.id);
      try {
        const docRef = doc(db, 'users', this.uid, 'jobItems', this.currentMonth , 'item',itemToDelete.id ); // teacherId は削除する教員のドキュメント ID
        await deleteDoc(docRef);
        this.monthItems.splice(index, 1);
        console.log(' deleted successfully');
      } catch (error) {
        console.error('Error deleting : ', error);
      }
    },

  }
}
</script>

<style scoped>
.table-container {
  margin-top: 20px;
}

table {
  width: 50%;
  border-collapse: collapse;
  margin: 0 auto;
}
th, td {
  border: 1px solid #ddd;
  padding: 8px;
}
th {
  background-color: #f2f2f2;
  text-align: left;
}

.deleteButton {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
}

.deleteButton:hover {
  background-color: #d32f2f;
}
</style>
