<template>
  <Menu pageTitle="TA/技術補佐員 定時設定" />
  <ScheduleForm @formSubmitted="handleFormSubmission" />

<br>
<br>
  <h1>リスト</h1>
  <div class="table-container">
    <table>
      <thead>
        <tr>
         <th>曜日</th>
          <th>開始時刻</th>
          <th>終了時刻</th>
          <th>内容</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in requestItems" :key="index">
         <td>{{ item.day }}</td>
          <td>{{ item.startTime }}</td>
          <td>{{ item.endTime }}</td>
         
          <td>{{ item.role }}</td>
          <td class="delete">
            <button type="button" class="deleteButton" @click="confirmRemove(index)">削除</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import Menu from '../components/MenuBar.vue';
import ScheduleForm from '../components/ScheduleForm.vue';
import { onAuthStateChanged } from "firebase/auth";
import Firebase from "../firebase/firebase";
import { getFirestore, doc , deleteDoc} from 'firebase/firestore';

const auth = Firebase.auth

const db = getFirestore()

export default {
  data() {
    return {
      currentMonth: '',
      requestItems: [],
      uid : '',
    };
  },
  created() {
      this.requestItems = []
   
   onAuthStateChanged(auth, (user) => {
     if (user) {
       this.uid = user.uid;

     } else {
       console.log('User is not logged in.');
     }
   });

 },
  components: {
    Menu,

    ScheduleForm
  },
  methods: {
    receiveCurrentMonth(month) {
      this.currentMonth = month;
    },
    handleFormSubmission(schedule) {
      this.requestItems.push(schedule);
    },
    confirmRemove(index) {
      const result = confirm('削除しますか？');
      if (!result) return;
      this.removeRequest(index);
    },
    async removeRequest(index) {
        const itemToDelete = this.requestItems[index];
      //console.log(teacherToDelete.id);
      try {
        const docRef = doc(db,'users', this.uid , 'scheduledItems', itemToDelete.id); // teacherId は削除する教員のドキュメント ID
        await deleteDoc(docRef);
        this.requestItems.splice(index, 1);
        console.log('Teacher deleted successfully');
      } catch (error) {
        console.error('Error deleting teacher: ', error);
      }
      }
  }
};
</script>

<style scoped>
.table-container {
  margin-top: 20px;
}
table {
  width: 100%;
  border-collapse: collapse;
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
