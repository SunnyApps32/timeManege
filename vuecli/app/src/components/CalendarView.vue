<template>
  <div>
    <br />
    <div v-show=isLoading>
      <br />

    </div>
    <div v-show=!isLoading>
      <MonthBar v-on:monthReceiver="receiveMonth" v-on:yearReceiver="receiveYear"
        v-on:monthYearReceiver="receiveCurrentMonth" />
    </div>

    <div v-show=isLoading> Loading... (最大数十秒お待ちください)</div>
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
            <th>時間数</th>
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
            <td>
              <label>{{ getFormattedDuration(day.notes) }} </label>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <TimePickerModal :show="showModal" @close="closeModal" @save="saveTime" />
    <div>
      <br>

    </div>



    <table>

      <tbody>

        <!-- 合計時間の行 -->
        <tr>
          <td style="text-align: right;"><strong>合計時間数:</strong></td>
          <td>{{ totalHours.toFixed(2) }} 時間</td>
        </tr>
        <!-- 時給の入力フォーム -->
        <tr>
          <td style="text-align: right;"><strong>時給:</strong></td>
          <td>
            <input v-model.number="hourlyRate" type="number" placeholder="Enter Hourly Rate" />円
          </td>
        </tr>
        <!-- 月収の行 -->
        <tr>
          <td style="text-align: right;"><strong>給与:</strong></td>
          <td>{{ monthlyEarnings.toFixed(0) }} 円</td>
        </tr>
      </tbody>
    </table>
  </div>

  <h1>内容ごとの合計時間</h1>
  <ul>
    <li v-for="(totalHours, content) in totalHoursPerContent" :key="content">
      {{ content }}: {{ totalHours.toFixed(2) }} 時間
    </li>
  </ul>

</template>

<script>
import MonthBar from '../components/MonthBar.vue';
import Firebase from "../firebase/firebase";
import { collection, getDocs, query, where, getFirestore, doc, getDoc, setDoc, } from 'firebase/firestore';
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
      hourlyRate: 900,
      roopCount: 0,
      chanceCount: 0,
      isLoading: false,
      maxRoopCount: 1000,
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

      } else {
        console.log('User is not logged in.');
      }
    });
  },
  methods: {

    getNoteDuration(note) {
      const [startHours, startMinutes] = note.startTime.split(':').map(Number);
      const [endHours, endMinutes] = note.endTime.split(':').map(Number);

      const startDate = new Date(0, 0, 0, startHours, startMinutes);
      const endDate = new Date(0, 0, 0, endHours, endMinutes);

      const duration = (endDate - startDate) / (1000 * 60 * 60);
      return duration.toFixed(2);
    },


    getFormattedDuration(notes) {
      let durationHours = 0
      let durationMinutes = 0
      for (const note of notes) {
        const [startHours, startMinutes] = note.startTime.split(':').map(Number);
        const [endHours, endMinutes] = note.endTime.split(':').map(Number);

        const startDate = new Date(0, 0, 0, startHours, startMinutes);
        const endDate = new Date(0, 0, 0, endHours, endMinutes);

        durationHours += endDate.getHours() - startDate.getHours();
        durationMinutes += endDate.getMinutes() - startDate.getMinutes();

        if (durationMinutes < 0) {
          durationMinutes += 60;
          durationHours -= 1;
        } else if (durationMinutes >= 60) {
          durationMinutes -= 60;
          durationHours += 1;
        }

      }

      if (durationHours == 0 && durationMinutes == 0) {
        return '';
      }
      return `${durationHours}:${durationMinutes.toString().padStart(2, '0')}`;
    },

    async fetchCalender() {
      const docRef = doc(db, 'users', this.uid, 'jobItems', this.currentMonth);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        if (docSnap.data().calendar != null) {
          for (let i = 0; i < docSnap.data().calendar.length; i++) {
            if (this.Calendar[i].date == docSnap.data().calendar[i].date) {
              this.Calendar[i].notes = docSnap.data().calendar[i].notes
            }
          }
          console.log(this.Calendar)

          this.TAAndTechAssistantData = []
          //           this.teacherData = [],
          //           this.ResearchRoomJobData = [],


          for (const day of this.Calendar) {
            for (const note of day.notes) {
              console.log(note.content)
              if (note.content == "TA" || note.content == "技術補佐員") {
                this.TAAndTechAssistantData.push({
                  startTime: note.startTime,
                  endTime: note.endTime,
                  role: note.content,
                  date: day.date,
                })
              }
              if (note.content == "時間割") {
                this.TAAndTechAssistantData.push({
                  startTime: note.startTime,
                  endTime: note.endTime,
                  role: note.content,
                  day: day.day,
                })
              }

            }
          }


          return true;
        } else {
          return false
        }
      } else {
        // docSnap.data() will be undefined in this case
        console.log("No such document!");
        return false;
      }

    },
    //予定の削除
    handleCellClick(day) {
      if (day.notes.length > 0) {
        const confirmDelete = window.confirm('この予定を削除しますか？');
        if (confirmDelete) {
          this.deleteSchedule(day);
        }
      } else {
        this.openModal(day);
      }
    },
    deleteSchedule(day) {
      // 削除する処理をここに追加します
     
      const index = this.Calendar.findIndex(d => d.date === day.date);

      
      if (index !== -1) {
        
        let i = 0
        for (const a of this.Calendar[index].notes){

          if (a.content == this.activeTab){
            this.Calendar[index].notes.splice(i)
          }
          i++;
        }
      }
      //if (this.userisReady == true) {
        this.saveCalendarData();
      //}

    },


    //モーダル
    openModal(day) {
      this.selectedDay = day;
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
    },
    async saveTime(timeData) {
      this.showModal = false;
      //新しいスケジュールをCalendarのnotesに入れる
      for (const day of this.Calendar) {
        if (day.date === this.selectedDay.date) {
          day.notes.push({
            startTime: timeData.startTime,
            endTime: timeData.endTime,
            content: this.activeTab
          });
        }
      }


      this.TAAndTechAssistantData = []
      //           this.teacherData = [],
      //           this.ResearchRoomJobData = [],


      for (const day of this.Calendar) {
        for (const note of day.notes) {
          if (note.content == "TA" || note.content == "技術補佐員") {
            this.TAAndTechAssistantData.push({
              startTime: note.startTime,
              endTime: note.endTime,
              role: note.content,
              date: day.date,
            })
          }
          if (note.content == "時間割") {
            this.TAAndTechAssistantData.push({
              startTime: note.startTime,
              endTime: note.endTime,
              role: note.content,
              day: day.day,
            })
          }

        }
      }
      this.Calendar = [],
        this.getMonthlyCalendar(); //今月のカレンダー
      await this.fetchTeacherData(); //先生のデータを取得
      await this.fetchResearchRoomJobData();
      await this.updateCalendarWithTAAndTechAssistantData();

      //   if (this.userisReady == true){
      await this.saveCalendarData();
      // }

    },

    //先生から申請許可が出ているか，自分が申請しているか確認
    async checkReadyStatus() {
      try {

        const docRef = doc(db, 'teacher', this.currentMonth);
        const docSnapshot = await getDoc(docRef);
        if (docSnapshot.exists()) {
          this.isReady = docSnapshot.data().isReady || false;
        } else {
          this.isReady = false;
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

    //ユーザのドキュメントがなければ作成
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

    //TA，技術補佐員，時間割等データ取得
    async fetchTAAndTechAssistantData() {
      try {
        const querySnapshot = await getDocs(query(collection(db, 'users', this.uid, 'scheduledItems'), where('role', 'in', ['TA', '技術補佐員', '時間割'])));
        this.TAAndTechAssistantData = querySnapshot.docs.map(doc => doc.data());


      } catch (error) {
        console.error('Error fetching TA and Technical Assistant data: ', error);
      }
    },

    //先生の記入不可時間取得
    async fetchTeacherData() {
      try {
        const querySnapshot = await getDocs(query(collection(db, 'teacher', this.currentMonth, 'unAvailable')));
        this.teacherData = querySnapshot.docs.map(doc => doc.data());
      } catch (error) {
        console.error('Error fetching TA and Technical Assistant data: ', error);
      }
    },

    //研究室のバイト数を取得
    async fetchResearchRoomJobData() {
      try {
        const docRef = collection(db, 'users', this.uid, 'jobItems', this.currentMonth, 'item');
        const querySnapshot = await getDocs(docRef);
        this.ResearchRoomJobData = querySnapshot.docs.map(doc => doc.data());

        //if (this.isReady) {
          this.distributeWorkHours();
        //}

        this.process();



      } catch (error) {
        console.error('Error fetching Research Room Job data: ', error);
      }
    },

    process() {
      if (this.chanceCount >= this.maxRoopCount) {
        this.chanceCount = 0;
        console.log("アルゴリズム1では，割り振れませんでした")
        this.getMonthlyCalendar();

        const result = confirm('自動割り振りに失敗しました．今月の総バイト時間を修正することをお勧めします．再度自動振り分けを実行しますか？（再度実行することで，割り振れることもあります．）')
        if (!result) { return }
        this.distributeWorkHours();
        this.process();


      }
      this.chanceCount = 0;
    },

    //calendarにTA, 技術補佐員の予定を挿入
    updateCalendarWithTAAndTechAssistantData() {
      for (const entry of this.TAAndTechAssistantData) {
        for (const day of this.Calendar) {
          if (entry.role != '時間割') {
            if (entry.date == day.date) {
              day.notes.push({
                startTime: entry.startTime,
                endTime: entry.endTime,
                content: entry.role
              });
            } else {
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

    // 申請ボタンがクリックされた時の処理
    async handleApply() {
      try {
        const userDocRef = doc(db, 'users', this.uid, 'jobItems', this.currentMonth);
        await setDoc(userDocRef, { isReady: true }, { merge: true });
        await this.saveCalendarData();
        alert('申請が確定されました。');
        this.userisReady = true;
      } catch (error) {
        console.error('Error setting isReady: ', error);
        alert('申請の確定中にエラーが発生しました。');
      }
    },

    // カレンダーのデータを保存するメソッド
    async saveCalendarData() {
      try {
        // カレンダーのデータを Firestore に保存
        const userDocRef = doc(db, 'users', this.uid, 'jobItems', this.currentMonth);
        await setDoc(userDocRef, { calendar: this.Calendar, upDate: Date() }, { merge: true });
        console.log('Calendar data saved successfully.');
      } catch (error) {
        console.error('Error saving calendar data: ', error);
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



    //月の平日を取得
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
      while (remainingMinutes > 0 && this.roopCount < this.maxRoopCount) {
        this.roopCount++;
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

        let minMinutes = 0;
        if (remainingMinutes > 1800) {
          minMinutes = 360;
        } else if (remainingMinutes > 120) {
          minMinutes = 120;
        }
        else {
          minMinutes = remainingMinutes;
        }

        const maxQuarters = Math.floor(Math.min(remainingMinutes, maxMinutes) / 15);
        const minQuarters = Math.floor(Math.min(remainingMinutes, minMinutes) / 15);
        const randomQuarters = Math.floor(Math.random() * (maxQuarters - minQuarters + 1)) + minQuarters;
        let workMinutes = randomQuarters * 15;

        // 1回の勤務が6時間を超えないようにするチェック
        const maxWorkMinutesPerShift = 6 * 60; // 6時間を分に変換
        if (workMinutes > maxWorkMinutesPerShift) {
          workMinutes = maxWorkMinutesPerShift;
        }

        const newStart = this.convertTimeToMinutes(this.generateRandomTime(workMinutes));
        const newEnd = newStart + workMinutes;

        if (this.checkAvailability(day, newStart, newEnd)) {
          this.assignWorkToDay(day, newStart, newEnd, job.content);
          remainingMinutes -= workMinutes;
          weeklyHours[weekNumber] += workMinutes;
        }
      }
      this.roopCount = 0;

      while (remainingMinutes != 0 && this.chanceCount < this.maxRoopCount) {
        this.chanceCount++;

        this.getMonthlyCalendar();
        this.distributeWorkHours();
      }
    },

    getWeekNumber(date) {
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
      return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    },

    //重複確認＆ルールかくにん
    checkAvailability(day, newStart, newEnd) {
      const dayObj = this.Calendar.find(d => d.date === day.getDate());
      if (!dayObj) return false;

      const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
      const existingSchedules = [
        ...this.TAAndTechAssistantData.filter(item =>item.day === weekdays[day.getDay()] || item.date === day.getDate()),
        ...this.teacherData.filter(item => item.day === day.getDate()),
        ...dayObj.notes.filter(note => note.content !== 'TA' || '技術補佐員')
      ];
  
      const labJobCount = dayObj.notes.filter(note => note.content !== 'TA' || '技術補佐員').length;
      const labJobs = [
        ...dayObj.notes.filter(note => note.content !== 'TA' || '技術補佐員')
      ];
      if (labJobCount == 2) {
        return false;
      } else if (labJobCount == 1) {
        if (!(newEnd < this.convertTimeToMinutes(labJobs[0].startTime) - 45 || newStart > this.convertTimeToMinutes(labJobs[0].endTime) + 45)) {
          return false;
        }
      }

      for (const schedule of existingSchedules) {
        
        const existingStart = this.convertTimeToMinutes(schedule.startTime);
        const existingEnd = this.convertTimeToMinutes(schedule.endTime);

        if (!(newEnd < existingStart || newStart > existingEnd)) {
          return false;
        }
      }

      // 1日の勤務時間が7時間45分を超えないか確認
      const dayTotalMinutes = dayObj.notes.reduce((total, note) => {
        const noteStart = this.convertTimeToMinutes(note.startTime);
        const noteEnd = this.convertTimeToMinutes(note.endTime);
        return total + (noteEnd - noteStart);
      }, 0);
      if (dayTotalMinutes + (newEnd - newStart) > 7 * 60 + 45) {
        return false;
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
        dayObj.notes.sort((a, b) => {
          const [aHours, aMinutes] = a.startTime.split(':').map(Number);
          const [bHours, bMinutes] = b.startTime.split(':').map(Number);
          return aHours * 60 + aMinutes - (bHours * 60 + bMinutes);
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
    },

    getNoteDurationInHours(note) {
      const [startHours, startMinutes] = note.startTime.split(':').map(Number);
      const [endHours, endMinutes] = note.endTime.split(':').map(Number);
      const startDate = new Date(0, 0, 0, startHours, startMinutes);
      const endDate = new Date(0, 0, 0, endHours, endMinutes);
      const duration = (endDate - startDate) / (1000 * 60 * 60); // ミリ秒を時間に変換
      return duration;
    },
  },
  watch: {
    currentMonth: {
      async handler() {
        this.isLoading = true;
        // Ensure the handler function is async to use await
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            this.uid = user.uid;
          } else {
            console.log('User is not logged in.');
          }
        });

        this.TAAndTechAssistantData = [];
        this.teacherData = [];
        this.ResearchRoomJobData = [];
        this.Calendar = [];
        this.getMonthlyCalendar(); // Initialize the calendar for the current month

        await this.checkReadyStatus(); // Check if permissions are granted

        const calendarExists = await this.fetchCalender();
        if (calendarExists) {
          console.log('Calendar exists and has been fetched.');

          let totalHou = 0;
          try {
            const docRef = collection(db, 'users', this.uid, 'jobItems', this.currentMonth, 'item');
            const querySnapshot = await getDocs(docRef);
            const a = querySnapshot.docs.map(doc => doc.data());
            for (const i of a) {
              totalHou += Number(i.time)

            }
          } catch (error) {
            console.error('Error fetching Research Room Job data: ', error);
          }
          if (this.totalHours != totalHou) {
            this.Calendar = []
            this.getMonthlyCalendar();
            await this.fetchTeacherData(); // Fetch teacher data
            await this.fetchResearchRoomJobData(); // Fetch research room job data
            await this.updateCalendarWithTAAndTechAssistantData(); // Update the calendar with TA and Technical Assistant data
          }
        } else {
          await this.fetchTAAndTechAssistantData(); // Fetch TA and Technical Assistant data
          await this.fetchTeacherData(); // Fetch teacher data
          await this.fetchResearchRoomJobData(); // Fetch research room job data
          await this.updateCalendarWithTAAndTechAssistantData(); // Update the calendar with TA and Technical Assistant data
        }
        this.isLoading = false;
      }
    }
  }
  ,
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
    // 各内容ごとの合計時間を計算する
    totalHoursPerContent() {
      const totals = {};
      this.filteredCalendar.forEach(day => {
        day.notes.forEach(note => {
          if (!totals[note.content]) {
            totals[note.content] = 0;
          }
          totals[note.content] += this.getNoteDurationInHours(note);
        });
      });
      return totals;
    },

    totalHours() {
      return this.filteredCalendar.reduce((sum, day) => {
        return sum + day.notes.reduce((noteSum, note) => {
          return noteSum + this.getNoteDurationInHours(note);
        }, 0);
      }, 0);
    },

    // 月収を計算するプロパティ
    monthlyEarnings() {
      return this.totalHours * this.hourlyRate;
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

.disable-button {
  background-color: #cccccc;
}
</style>
