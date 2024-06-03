<template>
<br>
    <MonthBar v-on:monthReceiver="receiveMonth"  v-on:yearReceiver="receiveYear"/>

  <div>
  <br>
    <table>
      <thead>
        <tr>
          <th>日付</th>
          <th>曜日</th>
          <th>備考</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="day in Calendar" :key="day.date" :class="getDayClass(day)">
          <td>{{ day.date }}</td>
          <td>{{ day.weekday }}</td>
          <td><input type="text" v-model="day.notes" placeholder="" /></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>


<script>
import MonthBar from '../components/MonthBar.vue'
import Firebase from "../firebase/firebase";
import { collection, getDocs, query, where, getFirestore } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

const auth = Firebase.auth

const db = getFirestore()

export default {
  data() {
    return {
      calendarYear: this.getCurrentYear(),
      calendarMonth: this.getCurrentMonth(),
      Calendar: [],
      TAAndTechAssistantData: [], // TAと技術補佐員のデータ
      currentMonth: '',
      uid: '',
    };
  },
  props: {},
  components: {

     MonthBar,
},
  created() {
    this.getMonthlyCalendar();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.uid = user.uid;
        this.getMonthlyCalendar();
        this.fetchTAAndTechAssistantData();
      } else {
        console.log('User is not logged in.');
      }
    });
  },
  methods: {
    async fetchTAAndTechAssistantData() {
      try {
        const querySnapshot = await getDocs(query(collection(db, 'users', this.uid, 'scheduledItems'), where('role', 'in', ['TA', '技術補佐員'])));
        this.TAAndTechAssistantData = querySnapshot.docs.map(doc => doc.data());
        this.updateCalendarWithTAAndTechAssistantData();
      } catch (error) {
        console.error('Error fetching TA and Technical Assistant data: ', error);
      }
    },
    updateCalendarWithTAAndTechAssistantData() {
      for (const entry of this.TAAndTechAssistantData) {
        for (const day of this.Calendar) {
          if (day.weekday === entry.day) {
            day.notes = `${entry.startTime}~${entry.endTime} (${entry.role})  `;
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
        this.Calendar = [] 

      for (let date = this.getFirstDay().getDate(); date < this.getLastDay().getDate() + 1; date++) {
        this.Calendar.push({
          date: date,
          weekday: this.getWeekday(date),
          notes: '',
          isWeekend: this.isWeekend(date)
        });
        

      }
      this.updateCalendarWithTAAndTechAssistantData(); // カレンダーを更新
    },
            receiveMonth(month) {
            this.calendarMonth = month;
            this.getMonthlyCalendar();

        },
                receiveYear(year) {
            this.calendarYear = year;
        },
           isWeekend(date) {
      const day = new Date(this.calendarYear, this.calendarMonth - 1, date).getDay();
      return day === 0 || day === 6; // 日曜日(0)と土曜日(6)
     
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

  },
};
</script>

<style scoped>
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
.holiday {
  background-color: #ffdddd; /* 祝日の背景色 */
}
.weekend {
  background-color: #999999; /* 休日（土日）の背景色 */
}
</style>

