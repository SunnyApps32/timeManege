<template>
  <div>
    <br />
    <MonthBar v-on:monthReceiver="receiveMonth" v-on:yearReceiver="receiveYear"
      v-on:monthYearReceiver="receiveCurrentMonth" />
    <br />
    <div class="header">
      <button class="apply-button" :disabled="!isReady" @click="handleApply"
        :class="{ 'disable-button': userisReady }">{{ userisReady ? '確定済み' : '確定' }}</button>
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
            <td @click="activeTab === '研究室バイト' ? null : handleCellClick(day)">
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
import Firebase from "../firebase/firebase";
import { collection, getDocs, query, where, getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
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
      teacherData: [],
      ResearchRoomJobData: [],
      currentMonth: '',
      uid: '',
      showModal: false,
      selectedDay: null,
      activeTab: '研究室バイト', // 追加: 現在のアクティブなタブを管理
      isReady: false,
      userisReady: false,
    };
  },
  components: {
    MonthBar,
    TimePickerModal
  },
  created() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.uid = user.uid;
        this.checkAndCreateUserDoc(); //ユーザのドキュメントがなければ作成
        this.getMonthlyCalendar(); //今月のカレンダー
       

        
        this.fetchTAAndTechAssistantData(); // TA・技術補佐員・時間割データ取得
        this.checkReadyStatus(); //先生の許可が出ているか取得
        this.fetchTeacherData(); //先生のデータを取得
        this.fetchResearchRoomJobData();
       


      } else {
        console.log('User is not logged in.');
      }
    });
  },
  methods: {

    handleCellClick(day) {
    if (day.notes.length > 0) {
      const confirmDelete = window.confirm('この予定を削除しますか？');
      if (confirmDelete) {
        this.deleteSchedule(day);
      }
    } else{
      this.openModal(day);
    }
  },
  deleteSchedule(day) {
    // 削除する処理をここに追加します
    const index = this.Calendar.findIndex(d => d.date === day.date);
    if (index !== -1) {
      this.Calendar[index].notes = [];
    }
  },


    openModal(day) {
      this.selectedDay = day;
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
    },
    saveTime(timeData) {
      this.selectedDay.notes.push({
      startTime: timeData.startTime,
      endTime: timeData.endTime,
      content: this.activeTab,
    });
      this.showModal = false;
    },
    async checkReadyStatus() {
      try {
  
        const docRef = doc(db, 'teacher', this.currentMonth);
        const docSnapshot = await getDoc(docRef);
        if (docSnapshot.exists()) {
          this.isReady = docSnapshot.data().isReady || false;
          console.log('document!');
        } else {
          this.isReady = false;
          console.log('No');
        }
      } catch (error) {
        console.error('Error checking ready status: ', error);
      }

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
    async fetchTAAndTechAssistantData() {
      try {
        const querySnapshot = await getDocs(query(collection(db, 'users', this.uid, 'scheduledItems'), where('role', 'in', ['TA', '技術補佐員', '時間割'])));
        this.TAAndTechAssistantData = querySnapshot.docs.map(doc => doc.data());
       
      } catch (error) {
        console.error('Error fetching TA and Technical Assistant data: ', error);
      }
    },
    async fetchTeacherData() {
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
          if(entry.role != '時間割'){
            if (day.weekday === entry.day) {
            day.notes.push({
            startTime: entry.startTime,
            endTime: entry.endTime,
            content: entry.role
          });
          }
          
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
          notes: [],
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
    async handleApply() {
      // 申請ボタンがクリックされた時の処理をここに書きます
      try {
      const userDocRef = doc(db, 'users', this.uid, 'jobItems', this.currentMonth);
      await setDoc(userDocRef, { isReady: true }, { merge: true });
      alert('申請が確定されました。');
      this.userisReady = true;
    } catch (error) {
      console.error('Error setting isReady: ', error);
      alert('申請の確定中にエラーが発生しました。');
    }


    },
    //時間をランダム振り分け
    distributeWorkHours() {
    const jobs = this.ResearchRoomJobData;
    var weekdays = this.getWeekdaysInMonth(this.calendarYear, this.calendarMonth);
    weekdays = this.shuffleArray(weekdays);

    // 週ごとの合計時間を追跡するためのデータ構造
    const weeklyHours = {};

    for (const job of jobs) {
      const totalWorkMinutes = parseFloat(job.time) * 60;
      this.assignWork(weekdays, totalWorkMinutes, job, weeklyHours);
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

  assignWork(weekdays, remainingMinutes, job, weeklyHours) {
    while (remainingMinutes > 0) {
      const randomIndex = Math.floor(Math.random() * weekdays.length);
      const day = weekdays[randomIndex];
      const weekNumber = this.getWeekNumber(day);

      // 週ごとの合計時間を計算
      if (!weeklyHours[weekNumber]) {
        weeklyHours[weekNumber] = 0;
      }

      // 19時間45分を分に変換
      const maxWeeklyMinutes = 19 * 60 + 45;
      const maxMinutes = Math.min(345, maxWeeklyMinutes - weeklyHours[weekNumber]); // 週の残り時間を考慮

      if (maxMinutes <= 0) {
        continue; // 週の残り時間がない場合、次の日へ
      }

      const minMinutes = 15; // 15分
      const maxQuarters = Math.floor(Math.min(remainingMinutes, maxMinutes) / 15);
      const minQuarters = Math.floor(Math.min(remainingMinutes, minMinutes) / 15);
      const randomQuarters = Math.floor(Math.random() * (maxQuarters - minQuarters + 1)) + minQuarters;
      const workMinutes = randomQuarters * 15;

      const newStart = this.convertTimeToMinutes(this.generateRandomTime(workMinutes));
      const newEnd = newStart + workMinutes;

      if (this.checkAvailability(day, newStart, newEnd)) {
        this.assignWorkToDay(day, newStart, newEnd, job.content);
        remainingMinutes -= workMinutes;
        weeklyHours[weekNumber] += workMinutes;
      }
    }
  },

  getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  },

  checkAvailability(day, newStart, newEnd) {
    const dayObj = this.Calendar.find(d => d.date === day.getDate());
    if (!dayObj) return false;

    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    const existingSchedules = [
      ...this.TAAndTechAssistantData.filter(item => item.day === weekdays[day.getDay()]),
      ...this.teacherData.filter(item => item.date === day.getDate()),
    ];

    const labJobCount = dayObj.notes.filter(note => note.content !== 'TA' || '技術補佐員').length;

    if (labJobCount == 2) {
      console.log("2つあります")
      return false;

    }
    for (const schedule of existingSchedules) {
      const existingStart = this.convertTimeToMinutes(schedule.startTime);
      const existingEnd = this.convertTimeToMinutes(schedule.endTime);

      if (!(newEnd < existingStart || newStart > existingEnd)) {
       console.log(schedule)
        return false;
      }
    }

    const startOfDayMinutes = 8 * 60 + 30;
    const endOfDayMinutes = 17 * 60 + 15;

    return newStart >= startOfDayMinutes && newEnd <= endOfDayMinutes;
  },

  generateRandomTime(workMinutes) {
    const startOfDayMinutes = 8 * 60 + 30; // 8:30を分に変換
    const endOfDayMinutes = 17 * 60 + 15; // 17:15を分に変換
    const latestStartTime = endOfDayMinutes - workMinutes;
    const randomStartMinutes = Math.floor(Math.random() * (latestStartTime - startOfDayMinutes + 1) / 15) * 15 + startOfDayMinutes;
    const hours = Math.floor(randomStartMinutes / 60);
    const minutes = randomStartMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  },

  assignWorkToDay(day, startTime, endTime, jobName) {
    const dayObj = this.Calendar.find(d => d.date === day.getDate());
    if (dayObj) {
      dayObj.notes.push({
        startTime: this.calculateTime(startTime),
        endTime: this.calculateTime(endTime),
        content: jobName,
      });
    }
  },

  calculateTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  },

  convertTimeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  },

    shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    },


    isOverlapping(existing, workMinutes) {
      const existingStart = this.convertTimeToMinutes(existing.startTime);
      const existingEnd = this.convertTimeToMinutes(existing.endTime);
      const workStart = 0; // Assuming work starts at the beginning of the day
      const workEnd = workMinutes;
      return !(workEnd <= existingStart || workStart >= existingEnd);
    }





  },
  watch: {
    currentMonth: {
      handler() {
        // newMonthが変更されたときの処理を記述
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

.disable-button{
  background-color: #cccccc;
}
</style>
