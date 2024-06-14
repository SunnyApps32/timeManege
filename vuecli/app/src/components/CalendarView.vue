<template>
  <div>
    <br />
    <MonthBar v-on:monthReceiver="receiveMonth" v-on:yearReceiver="receiveYear" v-on:monthYearReceiver="receiveCurrentMonth"/>
    <br />
    <div class="header">
      <button class="apply-button" :disabled="!isReady" @click="handleApply">確定</button>
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
            <td @click="day.isWeekend ? null : openModal(day)">
  <label>{{ day.notes || '' }}</label>
</td>

          </tr>
        </tbody>
      </table>
    </div>
    <TimePickerModal
      :show="showModal"
      @close="closeModal"
      @save="saveTime"
    />
  </div>
</template>

<script>
import MonthBar from '../components/MonthBar.vue';
import Firebase from "../firebase/firebase";
import { collection, getDocs, query, where, getFirestore , doc , getDoc, setDoc} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import TimePickerModal from '../components/TimePickerModal.vue';

const auth = Firebase.auth;
const db = getFirestore();

export default {
  data() {
    return {
      calendarYear: this.getCurrentYear(),
      calendarMonth: this.getCurrentMonth(),
      Calendar: [],
      TAAndTechAssistantData: [],
      teacherData:[],
      ResearchRoomJobData:[],
      currentMonth: '',
      uid: '',
      showModal: false,
      selectedDay: null,
      activeTab: '研究室バイト', // 追加: 現在のアクティブなタブを管理
      isReady: false,
    };
  },
  components: {
    MonthBar,
    TimePickerModal
  },
  created() {
    this.getMonthlyCalendar();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.uid = user.uid;
        this.checkAndCreateUserDoc();
        this.getMonthlyCalendar();
        this.fetchResearchRoomJobData();
        this.fetchTAAndTechAssistantData();
        this.checkReadyStatus();
        this.fetchTeacherData();
      } else {
        console.log('User is not logged in.');
      }
    });
  },
  methods: {
    openModal(day) {
      this.selectedDay = day;
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
    },
    saveTime(timeData) {
      this.selectedDay.notes = `${timeData.startTime}~${timeData.endTime}`;
      this.showModal = false;
    },
    async checkReadyStatus() {
      try {
        const docRef = doc(db, 'teacher', this.currentMonth);
        const docSnapshot = await getDoc(docRef);
        if (docSnapshot.exists()) {
          this.isReady = docSnapshot.data().isReady || false;
        } else {
          this.isReady = false;
          console.log('No such document!');
        }
      } catch (error) {

        console.error('Error checking ready status: ', error);
      }
    },
    async checkAndCreateUserDoc() {
      try {
        const userDocRef = doc(db, 'users', this.uid,  "jobItems" ,this.currentMonth);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          await setDoc(userDocRef, { month :this.currentMonth });
          console.log('User document created.');
        } else {
          console.log('User document already exists.');
        }

      } catch (error) {
        console.error('Error checking/creating user document: ', error);
      }
    },
    async fetchTAAndTechAssistantData() {
      try {
        const querySnapshot = await getDocs(query(collection(db, 'users', this.uid, 'scheduledItems'), where('role', 'in', ['TA', '技術補佐員', '研究室バイト'])));
        this.TAAndTechAssistantData = querySnapshot.docs.map(doc => doc.data());
        this.updateCalendarWithTAAndTechAssistantData();
      } catch (error) {
        console.error('Error fetching TA and Technical Assistant data: ', error);
      }
    },async fetchTeacherData() {
      try {
        const querySnapshot = await getDocs(query(collection(db, 'teacher', this.currentMonth, 'unAvailable')));
        this.teacherData = querySnapshot.docs.map(doc => doc.data());
        this.updateCalendarWithTAAndTechAssistantData();
      } catch (error) {
        console.error('Error fetching TA and Technical Assistant data: ', error);
      }
    },
    async fetchResearchRoomJobData() {
      try {
        const docRef = collection(db, 'users', this.uid, 'jobItems', this.currentMonth, 'item');
        const querySnapshot = await getDocs(docRef);
        this.ResearchRoomJobData = querySnapshot.docs.map(doc => doc.data());
        
          this.distributeWorkHours();
       
      } catch (error) {
        console.error('Error fetching Research Room Job data: ', error);
      }
    },
    updateCalendarWithTAAndTechAssistantData() {
      for (const entry of this.TAAndTechAssistantData) {
        for (const day of this.Calendar) {
          if (day.weekday === entry.day) {
            day.notes = `${entry.startTime}~${entry.endTime} (${entry.role})`;
          }
        }
      }
    },
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
          notes: '',
          isWeekend: this.isWeekend(date)
        });
      }
      this.updateCalendarWithTAAndTechAssistantData();
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
    handleApply() {
      // 申請ボタンがクリックされた時の処理をここに書きます
      alert('申請ボタンがクリックされました');
    },
    distributeWorkHours() {
    const jobs = this.ResearchRoomJobData;
    for (const job of jobs) {
      const totalWorkMinutes = parseFloat(job.time) * 60;
      let remainingMinutes = totalWorkMinutes;
      const weekdays = this.getWeekdaysInMonth(this.calendarYear, this.calendarMonth);

      while (remainingMinutes > 0 && weekdays.length > 0) {
        const randomIndex = Math.floor(Math.random() * weekdays.length);
        const day = weekdays[randomIndex];
        const maxMinutes = Math.min(remainingMinutes, 345); // 5時間45分
        const minMinutes = Math.min(remainingMinutes, 120); // 2時間
        const workMinutes = Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes;

        if (this.checkAvailability(day, workMinutes)) {
          this.assignWorkToDay(day, workMinutes, job.content);
          remainingMinutes -= workMinutes;
        }

        // 割り当てた日を除外して次のランダムな日に移動
        weekdays.splice(randomIndex, 1);
      }
    }
  },
  getWeekdaysInMonth(year, month) {
    const date = new Date(year, month - 1, 1);
    const weekdays = [];
    while (date.getMonth() === month - 1) {
      const day = date.getDay();
      if (day !== 0 && day !== 6) { // 日曜日（0）と土曜日（6）を無視
        weekdays.push(new Date(date));
      }
      date.setDate(date.getDate() + 1);
    }
    return weekdays;
  },
  checkAvailability(day, workMinutes) {
    const dayStr = day.toISOString().split('T')[0];
    const overlapping = this.TAAndTechAssistantData.some(item => item.date === dayStr && this.isOverlapping(item, workMinutes));
    return !overlapping;
  },
  isOverlapping(existing, workMinutes) {
    const existingStart = this.convertTimeToMinutes(existing.startTime);
    const existingEnd = this.convertTimeToMinutes(existing.endTime);
    const workStart = 0; // Assuming work starts at the beginning of the day
    const workEnd = workMinutes;
    return !(workEnd <= existingStart || workStart >= existingEnd);
  },
  convertTimeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  },

  assignWorkToDay(day, workMinutes, jobName) {
    const dayObj = this.Calendar.find(d => d.date === day.getDate());
    if (dayObj) {
      const startTime = this.generateRandomTime();
      const endTime = this.calculateEndTime(startTime, workMinutes);
      dayObj.notes = `${jobName}: ${startTime} ~ ${endTime}`;
    }
  },
  generateRandomTime() {
    const hours = Math.floor(Math.random() * 10) + 9; // 9時から18時の間でランダム
    const minutes = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45分のどれかをランダムに選択
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  },
  calculateEndTime(startTime, workMinutes) {
    const startMinutes = this.convertTimeToMinutes(startTime);
    const endMinutes = startMinutes + workMinutes;
    const hours = Math.floor(endMinutes / 60);
    const minutes = (endMinutes % 60) - ((endMinutes % 60) % 15); // 15分単位に丸める
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  },
  // 他のメソッドはそのままで、修正不要
},



  watch: {
    currentMonth: {
      handler() {
        // newMonthが変更されたときの処理を記述
        this.checkReadyStatus();
      },
      immediate: true, // ページロード時にも呼び出す
    },
  },
  computed: {
    filteredCalendar() {
      return this.Calendar.map(day => {
        const notesRole = day.notes.match(/\(([^)]+)\)/);
        if (notesRole && notesRole[1]) {
          return notesRole[1] === this.activeTab ? day : { ...day, notes: '' };
        }
        return this.activeTab === '研究室バイト' ? day : { ...day, notes: '' };
      });
    }
  }
};
</script>

<style scoped>
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
.holiday {
  background-color: #ffdddd; /* 祝日の背景色 */
}
.weekend {
  background-color: #999999; /* 休日（土日）の背景色 */
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
  ;}
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
  background-color: #007bff;
  color: white;
  border: none;
  cursor: pointer;
  border-radius: 5px;
}
.apply-button:hover {
  background-color: #0056b3;
}

.apply-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.day {
  width: 50px;
}
</style>