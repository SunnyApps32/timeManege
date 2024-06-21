<template>
  <div>
    <Menu pageTitle="" />
    <br/>
    <button class="back-button" @click="goBack">戻る</button>
    <p class="apply-button">ステータス：{{ userisReady ? '確定済' : '未申請' }}</p>

    <h3 class="user-info">{{ user ? `${user.studentNum} ${user.name}` : 'Loading...' }}</h3>
    <br />
   

    <MonthBar v-on:monthReceiver="receiveMonth" v-on:yearReceiver="receiveYear"
      v-on:monthYearReceiver="receiveCurrentMonth" />
    <br />
    <div class="header">
   
      <div class="tabs">
        <button :class="{ active: activeTab === '研究室バイト' }" @click="activeTab = '研究室バイト'">研究室バイト</button>
        <button :class="{ active: activeTab === 'TA' }" @click="activeTab = 'TA'">TA</button>
        <button :class="{ active: activeTab === '技術補佐員' }" @click="activeTab = '技術補佐員'">技術補佐員</button>
      </div>
    </div>
    <div>
      <br />
      <table>
        <thead>
          <tr>
            <th class="day">日付</th>
            <th class="day">曜日</th>
            <th>内容</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="day in filteredCalendar" :key="day.date" :class="getDayClass(day)">
            <td>{{ day.date }}</td>
            <td>{{ day.weekday }}</td>
            <td >
              <div v-for="note in day.notes" :key="note.startTime">
                <label>{{ note.startTime }} ~ {{ note.endTime }} ({{ note.content }})</label>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <TimePickerModal :show="showModal" @close="closeModal" @save="saveTime" />
  </div>
</template>

<script>
import MonthBar from '../components/MonthBar.vue';

import { getFirestore, doc, getDoc, } from 'firebase/firestore';

import TimePickerModal from '../components/TimePickerModal.vue';
import Menu from '../components/MenuBar.vue'

const db = getFirestore();

export default {
  props: {
    userId: String
  },
  data() {
    return {
      calendarYear: this.getCurrentYear(),
      calendarMonth: this.getCurrentMonth(),
      Calendar: [],
      TAAndTechAssistantData: [],
      teacherData: [],
      ResearchRoomJobData: [],
      currentMonth: '',
      uid: this.userId,
      showModal: false,
      selectedDay: null,
      activeTab: '研究室バイト', // 追加: 現在のアクティブなタブを管理
      isReady: false,
      userisReady: false,
      user: null,
    };
  },
  components: {
    MonthBar,
    TimePickerModal,
    Menu
  },
  created() {
   
  },
  methods: {
    async fetchUserInfo(){
      const docRef = doc(db, 'users', this.uid);
      const docSnapshot = await getDoc(docRef);
  
            if (docSnapshot.exists()) {
              this.user = docSnapshot.data();
              console.log(this.user)
            } else {
              console.log('No');
            }
    },


    async fetchCalender(){

      const docRef = doc(db, 'users', this.uid, 'jobItems', this.currentMonth);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        console.log("Document data:", docSnap.data().calendar);
        this.Calendar =  docSnap.data().calendar
      } else {
        // docSnap.data() will be undefined in this case
        console.log("No such document!");
        return false;
      }
      return true;
    },
  
    //申請しているか確認
    async checkReadyStatus() {
    
      try {
  
          const docRef = doc(db, 'users', this.uid, 'jobItems', this.currentMonth);
          const docSnapshot = await getDoc(docRef);
          if (docSnapshot.exists()) {
            this.userisReady = docSnapshot.data().isReady || false;
            console.log('document!');
          } else {
            this.userisReady = false;
            console.log('No');
          }
        } catch (error) {
          console.error('Error checking ready status: ', error);
        }
    },

    //calendarのデータ取得処理等
    getCurrentYear() {
      return new Date().getFullYear();
    },
    getCurrentMonth() {
      return new Date().getMonth() + 1;
    },
    getFirstDay() {
      const firstDay = new Date(this.calendarYear, this.calendarMonth - 1, 1);
      return firstDay;
    },
    getLastDay() {
      const lastDay = new Date(this.calendarYear, this.calendarMonth, 0);
      return lastDay;
    },
    getWeekday(date) {
      const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
      const day = new Date(this.calendarYear, this.calendarMonth - 1, date).getDay();
      return weekdays[day];
    },
    getMonthlyCalendar() {
      this.Calendar = [];
      for (let date = this.getFirstDay().getDate(); date <= this.getLastDay().getDate(); date++) {
        this.Calendar.push({
          date: date,
          weekday: this.getWeekday(date),
          notes: [],
          isWeekend: this.isWeekend(date)
        });
      }
     
    },
    receiveMonth(month) {
      this.calendarMonth = month;
      this.getMonthlyCalendar();
    },
    receiveYear(year) {
      this.calendarYear = year;
      this.getMonthlyCalendar(); // 年が変更された時にカレンダーを再取得する
    },
    receiveCurrentMonth(month) {
      this.currentMonth = month;
    },
    isWeekend(date) {
      const day = new Date(this.calendarYear, this.calendarMonth - 1, date).getDay();
      return day === 0 || day === 6;
    },
    getDayClass(day) {
      if (day.isHoliday) {
        return 'holiday';
      } else if (day.isWeekend) {
        return 'weekend';
      } else {
        return '';
      }
    },

    goBack() {
      this.$router.go(-1); // これで前のページに戻る
    }

  },
  watch: {
    currentMonth: {
      handler() {
        // newMonthが変更されたときの処理を記述

        this.Calendar =  [],
      this.TAAndTechAssistantData = [],
      this.teacherData = [],
      this.ResearchRoomJobData =  [],
      this.fetchUserInfo();
      this.getMonthlyCalendar(); //今月のカレンダー
        //ここを確認
        this.fetchCalender();
        this.checkReadyStatus();
       
      },
      immediate: false, // ページロード時にも呼び出す
    },
  },
  computed: {
    filteredCalendar() {
  return this.Calendar.map(day => {
    let filteredNotes;

    if (this.activeTab === '研究室バイト') {
      // 研究室バイトタブが選択された場合、TAと技術補佐員以外を表示
      filteredNotes = day.notes.filter(note => note.content !== 'TA' && note.content !== '技術補佐員');
    } else {
      // その他のタブが選択された場合、対応する役割を表示
      filteredNotes = day.notes.filter(note => note.content === this.activeTab);
    }

    // フィルタリングされたnotesがある場合、それをday.notesに設定
    return filteredNotes.length > 0 ? { ...day, notes: filteredNotes } : { ...day, notes: [] };
  });
},
  }
};
</script>

<style scoped>
table {
  width: 50%;
  border-collapse: collapse;
  margin: 0 auto;
}

th,
td {
  border: 1px solid #ddd;
  padding: 8px;
}

th {
  background-color: #f2f2f2;
  text-align: left;
}

.holiday {
  background-color: #ffdddd;
  /* 祝日の背景色 */
}

.weekend {
  background-color: #999999;
  /* 休日（土日）の背景色 */
}

.tabs {
  margin-left: 90px;
  display: flex;
  justify-content: center;
}

.tabs button {
  padding: 10px 20px;
  margin: 0 5px;
  cursor: pointer;
  margin-top: 10px;
  width: 200px;
}

.tabs .active {
  background-color: #007bff;
  color: white;
}

.header {
  /* display: flex;
  justify-content: space-between;
  align-items: center; */
}

.apply-button {
  float: right;
  margin-right: 20px;
  padding: 10px 20px;
  background-color: cadetblue;
  color: white;
  border: none;

  border-radius: 5px;
}



.day {
  width: 50px;
}

.disable-button{
  background-color: #cccccc;
}

/* ボタンのスタイル */
.back-button {
  float: left;
  margin-left: 20px;
  margin-right: 40px;
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.user-info{
  margin-top: 10px;
  font-size: 30px;
}
</style>
