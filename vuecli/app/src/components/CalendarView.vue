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
      <button class="apply-button" :disabled="!isReady" @click="handleApply" :class="{ 'disable-button': userisReady }">{{
        userisReady ? '確定済み' : '確定' }}</button>
      <div class="tabs">
        <button :class="{ active: activeTab === '研究室バイト' }" @click="activeTab = '研究室バイト'">研究室バイト</button>
        <button :class="{ active: activeTab === 'TA' }" @click="activeTab = 'TA'">TA</button>
        <button :class="{ active: activeTab === '技術補佐員' }" @click="activeTab = '技術補佐員'">技術補佐員</button>
        <button :class="{ active: activeTab === '記入不可時間' }" @click="activeTab = '記入不可時間'">記入不可時間</button>
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


    <div v-if="activeTab !== '記入不可時間'">
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
      <h1>内容ごとの合計時間</h1>
      <ul>
        <li v-for="(totalHours, content) in totalHoursPerContent" :key="content">
          {{ content }}: {{ totalHours.toFixed(2) }} 時間
        </li>
      </ul>
    </div>
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
      hourlyRate: 900,
      hourlyRateForTa: 1000,
      hourlyRateForTech: 950,
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

          this.TAAndTechAssistantData = []
          //           this.teacherData = [],
          //           this.ResearchRoomJobData = [],


          for (const day of this.Calendar) {
            for (const note of day.notes) {
              if (note.content == "TA" || note.content == "技術補佐員" || note.content == "記入不可時間" ) {
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
                  date: day.date,
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
        for (const a of this.Calendar[index].notes) {
          if (a.content == this.activeTab) {
            this.Calendar[index].notes.splice(i)
          }
          i++;
        }
      }
      this.saveCalendarData();
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
      this.isLoading = true;
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
      for (const day of this.Calendar) {
        for (const note of day.notes) {
          if (note.content == "TA" || note.content == "技術補佐員" || note.content == "記入不可時間" ) {
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
              date: day.date,
            })
          }


        }
      }

      await this.getMonthlyCalendar(); //今月のカレンダー
      await this.fetchTeacherData(); //先生のデータを取得
      await this.fetchResearchRoomJobData();


      await this.process()
      await this.updateCalendarWithTAAndTechAssistantData();

      //   if (this.userisReady == true){
      await this.saveCalendarData();
      // }
      this.isLoading = false;
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
        const querySnapshot = await getDocs(query(collection(db, 'users', this.uid, 'scheduledItems'), where('role', 'in', ['TA', '技術補佐員', '時間割', '記入不可時間'])));
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
      } catch (error) {
        console.error('Error fetching Research Room Job data: ', error);
      }
    },

    async process() {

      await this.distributeWorkHours();
      if (this.roopCount >= this.maxRoopCount) {
        this.roopCount = 0;
        await this.getMonthlyCalendar();
        await this.algorithm2();
        if (this.roopCount >= this.maxRoopCount) {
          this.roopCount = 0;
          console.log("アルゴリズム2では，割り振れませんでした")
          await this.getMonthlyCalendar();

          const result = confirm('自動割り振りに失敗しました．今月の総バイト時間を修正することをお勧めします．再度自動振り分けを実行しますか？（再度実行することで，割り振れることもあります．）')

          if (!result) {
            return
          } else {

            await this.process();
          }


        } else {
          console.log('割り振りが完了2')
          console.log(this.Calendar)
          await this.saveCalendarData()
        }


      } else {
        console.log('割り振りが完了')
        console.log(this.Calendar)
        await this.saveCalendarData()
      }
      this.roopCount = 0;
    },

    algorithm2() {
      console.log("アルゴリズム2を実行中...");
      const jobs = this.ResearchRoomJobData;
      var weekdays = this.getWeekdaysInMonth(this.calendarYear, this.calendarMonth);

      // 週ごとの合計時間を追跡するためのデータ構造
      const weeklyHours = {};


      for (const job of jobs) {
        const totalWorkMinutes = parseFloat(job.time) * 60;
        this.assignWorkAlgorithm2(weekdays, totalWorkMinutes, job, weeklyHours);
      }
    },


    assignWorkAlgorithm2(weekdays, remainingMinutes, job, weeklyHours) {
      const maxWeeklyMinutes = 19 * 60 + 45; // 週の最大勤務時間を分に変換
      const maxDailyMinutes = 7 * 60 + 45; // 1日の最大勤務時間を分に変換
      const maxWorkMinutesPerShift = 6 * 60; // 1回の最大勤務時間を分に変換

      while (remainingMinutes > 0 && this.roopCount < this.maxRoopCount) {
        this.roopCount++;
        let maxFreePeriod = { start: 0, end: 0, duration: 0 };
        const randomIndex = Math.floor(Math.random() * weekdays.length);
        const day = weekdays[randomIndex];
        const freePeriods = this.calculateFreePeriods(day);

        console.log(day)

        //空いている時間がない日は処理を飛ばす
        if (freePeriods.length == 0) {
          continue
        }

        //空いている時間帯で，最も時間が長いものを選択
        for (const period of freePeriods) {
          if (period.duration > maxFreePeriod.duration) {
            maxFreePeriod = period;
          }
        }

        //15分もなければ処理を飛ばす
        if (maxFreePeriod.duration < 15) {
          continue
        }

        const weekNumber = this.getWeekNumber(day);
        if (!weeklyHours[weekNumber]) {
          weeklyHours[weekNumber] = 0;
        }

        //この週の残り割り当て可能時間
        let remainingWeeklyMinutes = maxWeeklyMinutes - weeklyHours[weekNumber];

        //この作業の残り時間，週の残り可能時間，今日の割り当て可能時間の中で一番小さいものを上限
        let workMinutes = Math.min(remainingMinutes, remainingWeeklyMinutes, maxFreePeriod.duration, maxWorkMinutesPerShift);

        let newStart = maxFreePeriod.start;
        let newEnd = newStart + workMinutes;

      
        //二つ研究室バイトがあれば処理を飛ばす
        if (this.calculateExistingDailyMinutes(day) == 2) {
          continue
        } else if (this.calculateExistingDailyMinutes(day) == 1) {


          //合計時間が7:45を超えていないか
          if (this.mathTotalTime(day) + workMinutes > maxDailyMinutes) {

            workMinutes = maxDailyMinutes - this.mathTotalTime(day)
          }
          console.log(this.calculateTime(newStart), this.calculateTime(newStart + workMinutes))



          //勤務の間に45分空いているか
          const _object = this.returnOthers(day)[0]

          const noteStart = this.convertTimeToMinutes(_object.startTime);
          const noteEnd = this.convertTimeToMinutes(_object.endTime);



          //新しい予定が，既存の予定より後
          if (newStart >= noteEnd && newStart - noteEnd < 45) {
            newStart += 45 - (newStart - noteEnd)
            workMinutes -= (45 - (newStart - noteEnd))


            //新しい予定が，既存の予定より前
          } else if (noteStart >= newStart && noteStart - newEnd < 45) {
            newStart += 45 - (noteStart - newEnd)
            workMinutes -= (45 - (noteStart - newEnd))

          }
        }


        workMinutes = Math.floor(workMinutes / 15) * 15;
        //15分もなければ処理を飛ばす
        if (workMinutes < 15) {
          continue
        }
        newEnd = newStart + workMinutes;

        const startOfDayMinutes = 8 * 60 + 30;
        const endOfDayMinutes = 17 * 60 + 15;

        if (newStart >= startOfDayMinutes && newEnd <= endOfDayMinutes) {
          this.assignWorkToDay(day, newStart, newEnd, job.content);
          remainingMinutes -= workMinutes;
          weeklyHours[weekNumber] += workMinutes;
        }
      }
    },

    calculateExistingDailyMinutes(day) {
      const dayObj = this.Calendar.find(d => d.date === day.getDate());
      if (!dayObj) return 0;

      const existingSchedules = [
        ...dayObj.notes.filter(note => note.content !== 'TA' && note.content !== '技術補佐員' && note.content !== '記入不可時間' && note.content !== '時間割')
      ];



      return existingSchedules.length;
    },

    mathTotalTime(day) {
      const dayObj = this.Calendar.find(d => d.date === day.getDate());
      if (!dayObj) return 0;

      const existingSchedules = [
        ...dayObj.notes.filter(note => note.content !== 'TA' && note.content !== '技術補佐員' && note.content !== '記入不可時間'  && note.content !== '時間割')
      ];

      let totalTime = 0
      for (const note of existingSchedules) {
        const noteStart = this.convertTimeToMinutes(note.startTime);
        const noteEnd = this.convertTimeToMinutes(note.endTime);
        totalTime += noteEnd - noteStart

      }
   
      return totalTime;
    },

    returnOthers(day) {

      const dayObj = this.Calendar.find(d => d.date === day.getDate());
      if (!dayObj) return 0;

      const existingSchedules = [
        ...dayObj.notes.filter(note => note.content !== 'TA' && note.content !== '技術補佐員' && note.content !== '記入不可時間' && note.content !== '時間割' )
      ];
      return existingSchedules;
    },

    checkAssignment(day, newStart, newEnd, existingDailyMinutes, workMinutes) {
      //const maxDailyMinutes = 7 * 60 + 45; // 1日の最大勤務時間
      const maxWorkMinutesPerShift = 6 * 60; // 1回の最大勤務時間
      const minBreakBetweenShifts = 45; // 2回の勤務の間に必要な最低休憩時間（分）

      if (workMinutes > maxWorkMinutesPerShift) return false;

      const dayObj = this.Calendar.find(d => d.date === day.getDate());
      if (!dayObj) return false;

      const existingSchedules = [
        ...dayObj.notes.filter(note => note.content !== 'TA' && note.content !== '技術補佐員' && note.content !== '記入不可時間'  && note.content !== '時間割')
      ];

      for (const note of existingSchedules) {
        const noteStart = this.convertTimeToMinutes(note.startTime);
        const noteEnd = this.convertTimeToMinutes(note.endTime);

        // 新しい時間帯と既存のスケジュールの重複チェック
        if ((newStart < noteEnd && newStart >= noteStart) || (newEnd > noteStart && newEnd <= noteEnd)) {
          return false;
        }

        // 2回の勤務の間に最低休憩時間を確保
        if (Math.abs(noteEnd - newStart) < minBreakBetweenShifts || Math.abs(newEnd - noteStart) < minBreakBetweenShifts) {
          return false;
        }
      }

      return true;
    },

    calculateFreePeriods(day) {
      const dayObj = this.Calendar.find(d => d.date === day.getDate());
      if (!dayObj) return [];

      const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
      const existingSchedules = [
        ...this.TAAndTechAssistantData.filter(item => item.day === weekdays[day.getDay()] || item.date === day.getDate()),
        ...this.teacherData.filter(item => item.day === day.getDate()),
        ...dayObj.notes.filter(note => note.content !== 'TA' && note.content !== '技術補佐員' && note.content !== '記入不可時間'  && note.content !== '時間割')
      ];

      const startOfDayMinutes = 8 * 60 + 30; // 8:30を分に変換
      const endOfDayMinutes = 17 * 60 + 15; // 17:15を分に変換
      let freePeriods = [];
      let orderTime = []

      existingSchedules.sort((a, b) => this.convertTimeToMinutes(a.startTime) - this.convertTimeToMinutes(b.startTime));

      if (existingSchedules.length == 0) {
        freePeriods.push({ start: startOfDayMinutes, end: endOfDayMinutes, duration: endOfDayMinutes - startOfDayMinutes });
        return freePeriods;

      }
      for (const note of existingSchedules) {
        const noteStart = this.convertTimeToMinutes(note.startTime);
        const noteEnd = this.convertTimeToMinutes(note.endTime);
        // if (noteStart < startOfDayMinutes){
        //   orderTime.push({time: startOfDayMinutes , count: -1})
        // }else{
        //   orderTime.push({time: noteStart , count: -1})
        // }

        // if (noteEnd < startOfDayMinutes){
        //   orderTime.push({time: startOfDayMinutes , count: 1})
        // }else{
        //   orderTime.push({time: noteEnd , count: 1})
        // }

        if (noteStart < endOfDayMinutes || noteEnd < endOfDayMinutes) {
          orderTime.push({ time: noteStart, count: -1 })
          orderTime.push({ time: noteEnd, count: 1 })

        }

      }

      orderTime.sort((a, b) => {
        if (a.time !== b.time) {
          return a.time - b.time; // 時間で並び替える
        } else {
          return b.count - a.count; // 同時刻の場合は count が大きい方を前に
        }
      });

      let flag = 1
      let _start = startOfDayMinutes
      let _end = null


      for (const order of orderTime) {
        flag += order.count;

        //予定がない&&スタート時間が設定されていない＝空白の始点
        if (flag >= 1 && _start == null) {
          _start = order.time

          //予定が入った&スタート時間が設定されている＝空白の終点
        } else if (flag < 1 && _start != null) {
          _end = order.time

          if (_start == startOfDayMinutes) {
            if (_end - _start - 15 > 0) {

              if (_start == startOfDayMinutes) {
                _start += 15
              }
              freePeriods.push({ start: _start + 15, end: _end - 15, duration: _end - _start - 30 });
            }
          } else {
            if (_end - _start - 30 > 0) {
              freePeriods.push({ start: _start + 15, end: _end - 15, duration: _end - _start - 30 });
            }
          }
          _start = null
          _end = null
        }
      }

      if (_start != null && _start < endOfDayMinutes) {
        freePeriods.push({ start: _start + 15, end: endOfDayMinutes, duration: endOfDayMinutes - _start - 15 });

      }

     

      return freePeriods;
    },

    //calendarにTA, 技術補佐員，時間割の予定を挿入
    updateCalendarWithTAAndTechAssistantData() {
      for (const entry of this.TAAndTechAssistantData) {
        for (const day of this.Calendar) {
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
    async distributeWorkHours() {
      console.log('arugorizumu1')
      const jobs = this.ResearchRoomJobData;
      var weekdays = this.getWeekdaysInMonth(this.calendarYear, this.calendarMonth);
      //weekdays = this.shuffleArray(weekdays);
      // 週ごとの合計時間を追跡するためのデータ構造
      const weeklyHours = {};
      for (const job of jobs) {
        const totalWorkMinutes = parseFloat(job.time) * 60;
        await this.assignWork(weekdays, totalWorkMinutes, job, weeklyHours);
      }
    },


    async assignWork(weekdays, remainingMinutes, job, weeklyHours) {
      const maxWeeklyMinutes = 19 * 60 + 45; // 19時間45分を分に変換


      while (remainingMinutes > 0 && this.roopCount < this.maxRoopCount) {
        this.roopCount++;
        const randomIndex = Math.floor(Math.random() * weekdays.length);
        const day = weekdays[randomIndex];
        const weekNumber = this.getWeekNumber(day);

        // 週のデータの保存領域がなければ追加
        if (!weeklyHours[weekNumber]) {
          weeklyHours[weekNumber] = 0;
        }

        // 割り当てる勤務時間の最小値を決定
        let minMinutes = 0;
        if (remainingMinutes > 1800) { //30時間以上残っている場合
          minMinutes = 360; // 6時間
        } else if (remainingMinutes > 120) {
          minMinutes = 120; // 2時間
        } else {
          minMinutes = remainingMinutes;
        }

        let remainingWeeklyMinutes = maxWeeklyMinutes - weeklyHours[weekNumber];
        // 割り当てる勤務時間の最大値を計算（週の残り時間を考慮）
        let maxMinutes = Math.min(remainingMinutes, remainingWeeklyMinutes);
        maxMinutes = Math.min(maxMinutes, 360);
        // 割り当てる勤務時間をランダムに決定
        const maxQuarters = Math.floor(maxMinutes / 15);
        const minQuarters = Math.floor(minMinutes / 15);
        let randomQuarters = Math.floor(Math.random() * (maxQuarters - minQuarters + 1)) + minQuarters;
        let workMinutes = randomQuarters * 15;

        // 1回の勤務が6時間を超えないようにするチェック
        const maxWorkMinutesPerShift = 6 * 60; // 6時間を分に変換
        while (workMinutes > maxWorkMinutesPerShift) {
          randomQuarters = Math.floor(Math.random() * (maxQuarters - minQuarters + 1)) + minQuarters;
          workMinutes = randomQuarters * 15;
        }

        // 勤務時間の開始と終了を決定
        const newStart = this.convertTimeToMinutes(this.generateRandomTime(workMinutes));
        const newEnd = newStart + workMinutes;

        remainingWeeklyMinutes = maxWeeklyMinutes - weeklyHours[weekNumber] - workMinutes;

        if (remainingWeeklyMinutes > 0) {
          // 割り当てる時間が有効かどうかをチェック


          if (this.checkAvailability(day, newStart, newEnd)) {

            this.assignWorkToDay(day, newStart, newEnd, job.content);
            remainingMinutes -= workMinutes;
            weeklyHours[weekNumber] += workMinutes;


          }
        }
      }

    },

    //重複確認＆ルールかくにん
    checkAvailability(day, newStart, newEnd) {

      //calendarから一致する日にちを持ってくる
      const dayObj = this.Calendar.find(d => d.date === day.getDate());
      if (!dayObj) return false;

      const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
      const existingSchedules = [
        ...this.TAAndTechAssistantData.filter(item => item.day === weekdays[day.getDay()] || item.date === day.getDate()),
        ...this.teacherData.filter(item => item.day === day.getDate()),
        ...dayObj.notes.filter(note => note.content !== 'TA' && note.content !== '技術補佐員' && note.content !== '記入不可時間'  && note.content !== '時間割')
      ];

      const labJobCount = dayObj.notes.filter(note => note.content !== 'TA' && note.content !== '技術補佐員' && note.content !== '記入不可時間'  && note.content !== '時間割').length;
      const labJobs = [
        ...dayObj.notes.filter(note => note.content !== 'TA' && note.content !== '技術補佐員' && note.content !== '記入不可時間'  && note.content !== '時間割')
      ];

      //研究室バイトは１日当たり，２回まで
      if (labJobCount == 2) {
        return false;
      } else if (labJobCount == 1) {

        //45分の休憩があるか
        if ((this.convertTimeToMinutes(labJobs[0].endTime) - this.convertTimeToMinutes(labJobs[0].startTime)) + (newEnd - newStart) > 360) {
          if (!(newEnd < this.convertTimeToMinutes(labJobs[0].startTime) - 45 || newStart > this.convertTimeToMinutes(labJobs[0].endTime) + 45)) {
            return false;
          }

        }
      }
      //既存の予定と重複がないか
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


      //スタートとエンドの時間が，8:30~17:15に収まっているか
      const startOfDayMinutes = 8 * 60 + 30;
      const endOfDayMinutes = 17 * 60 + 15;
      return newStart >= startOfDayMinutes && newEnd <= endOfDayMinutes;

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


    getWeekNumber(date) {
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
      return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
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
        this.getMonthlyCalendar();

        await this.checkReadyStatus(); // ユーザの提出状況を確認

        const calendarExists = await this.fetchCalender(); //カレンダーのデータの取得できるか判定
        if (calendarExists) { //カレンダーが保存されている場合
          console.log('Calendar exists and has been fetched.');

          let totalHou = 0;
          try { //カレンダーの合計時間と，バイトの合計時間が一致するか確認
            const docRef = collection(db, 'users', this.uid, 'jobItems', this.currentMonth, 'item');
            const querySnapshot = await getDocs(docRef);
            const a = querySnapshot.docs.map(doc => doc.data());
            for (const i of a) {
              totalHou += Number(i.time)

            }
          } catch (error) {
            console.error('Error fetching Research Room Job data: ', error);
          }
          if (this.totalHours != totalHou) { //一致しなかった場合，再度振り分け
            console.log('バイトの総合時間が一致していません')
            await this.getMonthlyCalendar();
            await this.fetchTeacherData(); // Fetch teacher data
            await this.fetchResearchRoomJobData(); // Fetch research room job data
            await this.process();
            await this.updateCalendarWithTAAndTechAssistantData(); // Update the calendar with TA and Technical Assistant data
          }

        } else { //カレンダーが保存されていない場合
          await this.fetchTAAndTechAssistantData(); // Fetch TA and Technical Assistant data
          await this.fetchTeacherData(); // Fetch teacher data
          await this.fetchResearchRoomJobData(); // Fetch research room job data
          await this.process();
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
          filteredNotes = day.notes.filter(note => note.content !== 'TA' && note.content !== '技術補佐員' && note.content !== '記入不可時間' && note.content !== '時間割' );
        } else if (this.activeTab === '記入不可時間') {
          filteredNotes = day.notes.filter(note => note.content === '記入不可時間' || note.content === '時間割');
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
      if (this.activeTab == '研究室バイト') {
        return this.totalHours * this.hourlyRate;
      } else if (this.activeTab == 'TA') {
        return this.totalHours * this.hourlyRateForTa;
      }
      return this.totalHours * this.hourlyRateForTech;


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
