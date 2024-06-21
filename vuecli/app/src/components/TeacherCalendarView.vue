<template>
  <div>
    <br />
    <MonthBar v-on:monthReceiver="receiveMonth" v-on:yearReceiver="receiveYear" @save="receiveAll"
      v-on:monthYearReceiver="receiveCurrentMonth" />
    <br />
    <div class="header">
      <button class="apply-button" :disabled="isReady" @click="handleApply">申請許可</button>
    </div>

    <div>
      <br />
      <table>
        <thead>
          <tr>
            <th class="day">日付</th>
            <th class="day">曜日</th>
            <th>記入不可時間</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="day in Calendar" :key="day.date" :class="getDayClass(day)">
            <td>{{ day.date }}</td>
            <td>{{ day.weekday }}</td>
            <td @click="day.isWeekend ? null : openModal(day)">
              <div v-for="note in day.notes" :key="note.startTime">
                <label>{{ note.startTime }} ~ {{ note.endTime }}</label>
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
import { collection, addDoc, getFirestore, doc, getDoc, setDoc, getDocs } from 'firebase/firestore';
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
      teacherData: [],
      currentMonth: '2024-6',
      uid: '',
      showModal: false,
      selectedDay: null,
      activeTab: '研究室バイト', // 追加: 現在のアクティブなタブを管理
      isReady: true,
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
        this.checkAndCreateUserDoc();
        this.checkReadyStatus();
        // this.getMonthlyCalendar();
      } else {
        console.log('User is not logged in.');
      }
    });
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
  methods: {
    openModal(day) {
      this.selectedDay = day;
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
    },
    async saveTime(timeData) {
      try {
        const item = {
          startTime: timeData.startTime,
          endTime: timeData.endTime,
          day: this.selectedDay.date,
        };

        const docRef = await addDoc(collection(db, 'teacher', this.currentMonth, 'unAvailable'), item);

        const sendItem = { id: docRef.id, ...item };
        this.teacherData.push(sendItem);

        if (!this.selectedDay.notes) {
          this.selectedDay.notes = [];
        }

        this.selectedDay.notes.push({
            startTime: timeData.startTime,
            endTime: timeData.endTime,
            content: '記入不可'
          });
        this.showModal = false;
      } catch (error) {
        console.error('Error adding : ', error);
      }
    },
    async checkAndCreateUserDoc() {
      try {
        const userDocRef = doc(db, 'teacher', this.currentMonth);
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
    async fetchTeacherData() {
      this.teacherData = [];
      try {
        const items = await getDocs(collection(db, 'teacher', this.currentMonth, 'unAvailable'));
        this.teacherData = items.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(this.teacherData)
        this.updateCalendar();
      } catch (error) {
        console.error('Error fetching : ', error);
      }
    },
    updateCalendar() {
      for (const entry of this.teacherData) {
        for (const day of this.Calendar) {
          if (day.date === entry.day) {
            if (!day.notes) {
              day.notes = [];
            }else{
              day.notes.push({
            startTime: entry.startTime,
            endTime: entry.endTime,
            content: this.activeTab
          });
              console.log(day.notes)
              day.notes.sort((a, b) => {
                console.log(a.startTime)
                const [aHours, aMinutes] = a.startTime.split(':').map(Number);
                const [bHours, bMinutes] = b.startTime.split(':').map(Number);
                return aHours * 60 + aMinutes - (bHours * 60 + bMinutes);
              })
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
      this.fetchTeacherData();
    },
    // receiveMonth(month) {
    //   //this.calendarMonth = month;
    //   //this.getMonthlyCalendar();
    // },
    // receiveYear(year) {
    //   // this.calendarYear = year;
    //   // this.getMonthlyCalendar();
    // },
    receiveAll(save) {
      this.currentMonth = save.yearMonth;
      this.calendarYear = save.year;
      this.calendarMonth = save.month;
      console.log(this.currentMonth)
      this.getMonthlyCalendar();
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
        console.log(this.isReady)
        console.log(this.currentMonth)
      } catch (error) {

        console.error('Error checking ready status: ', error);
      }
    },

    async handleApply() {

      try {
        const docRef = doc(db, 'teacher', this.currentMonth);
        await setDoc(docRef, { isReady: true });

        const api_url = "https://script.google.com/macros/s/AKfycbwNopO0_rU9PS_VLkm-7eBxe8ijRCyqwI14KcRlsDw3ZvsOkbxrjeJP5T0mERlLqRht/exec"

        const params = new URLSearchParams();
        params.append('param1', 'value1');
        params.append('param2', 'value2');

        fetch(api_url, {
          method: "get",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          mode: 'no-cors'

          //body: params,
        })
          .then((response) => {
            response.text().then(() => {
              //alert(text);
              alert('申請が許可されました');
            });
          })
          .catch((error) => {
            alert(error.message);
          });


      } catch (error) {
        console.error('Error updating document: ', error);
        alert('申請の許可に失敗しました');
      }
    },


  },
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
}

.weekend {
  background-color: #999999;
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
