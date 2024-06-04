<template>
  <div>
    <form @submit.prevent="submitForm" class="schedule-form">
      <table class="forms">
        <th class="form-group">
          <div class="table-con">
            <tr for="day">曜日</tr>
            <tr>
              <select id="day" v-model="selectedDay" required>
                <option v-for="day in days" :key="day" :value="day">{{ day }}</option>

              </select>
            </tr>
          </div>
        </th>
        <th class="form-group">
          <div class="table-con">
            <tr for="startTime">開始時刻</tr>
            <tr>
              <select v-model="startHour" required>
                <option v-for="hour in startHours" :key="hour" :value="hour">{{ hour }}</option>
              </select>
              :
              <select v-model="startMinute" required>
                <option v-for="minute in minutes" :key="minute" :value="minute">{{ minute }}</option>
              </select>
            </tr>
          </div>
        </th>
        <th class="form-group">
          <div class="table-con">
            <tr for="endTime">終了時刻</tr>
            <tr>
              <select v-model="endHour" required>
                <option v-for="hour in endHours" :key="hour" :value="hour">{{ hour }}</option>
              </select>
              :
              <select v-model="endMinute" required>
                <option v-for="minute in minutes" :key="minute" :value="minute">{{ minute }}</option>
              </select>
            </tr>
          </div>

        </th>
        <th class="form-group">
          <div class="table-con">
            <tr for="role">内容</tr>
            <tr>
              <select id="role" v-model="selectedRole" required>
                <option v-for="role in roles" :key="role" :value="role">{{ role }}</option>
              </select>
            </tr>
          </div>
        </th>
        <th class="form-group">
          <div class="table-con">
            <button type="submit">追加</button>
          </div>
        </th>
      </table>
    </form>
  </div>
</template>

<script>
import { signOut, onAuthStateChanged } from "firebase/auth";
import Firebase from "../firebase/firebase";
import { getFirestore, collection, addDoc, getDocs,setDoc,doc , query, getDoc, where} from 'firebase/firestore';

const auth = Firebase.auth

const db = getFirestore()
export default {
  data() {
    return {
      startHour: '',
      startMinute: '',
      endHour: '',
      endMinute: '',
      selectedDay: '',
      selectedRole: '',
      days: ['月', '火', '水', '木', '金'],
      roles: ['TA','技術補佐員'],
      hours: Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')),
      minutes: Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0')),
      uid: '',
    };
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
  computed: {
    startHours() {
      // 8時から18時までの時間のみを選択可能にする
      return this.hours.slice(8, 19);
    },
    endHours() {
      // 開始時刻よりも後の時間のみを選択可能にする
      return this.hours.slice(this.startHour ? parseInt(this.startHour) : 9, 19);
    }
  },
  methods: {
    async checkAndCreateUserDoc() {
      try {
        const userDocRef = doc(db, 'users', this.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          await setDoc(userDocRef, { createdAt: new Date() });
          console.log('User document created.');
        } else {
          console.log('User document already exists.');
        }

      } catch (error) {
        console.error('Error checking/creating user document: ', error);
      }
    },
    submitForm() {
      this.addItems();
    },
    resetForm() {
      this.startHour = '';
      this.startMinute = '';
      this.endHour = '';
      this.endMinute = '';
      this.selectedDay = '';
      this.selectedRole = '';
    },
    // 教員を登録
    async addItems() {
      try {


        const schedule = {
          startTime: `${this.startHour}:${this.startMinute}`,
          endTime: `${this.endHour}:${this.endMinute}`,
          day: this.selectedDay,
          role: this.selectedRole
        };

        const docRef = await addDoc(collection(db, 'users', this.uid, 'scheduledItems'), schedule);

        const sendSchedule = { id: docRef.id, ...schedule };
        this.$emit('formSubmitted', sendSchedule);
        this.resetForm();



      } catch (error) {
        console.error('Error adding : ', error);
      }
    },
    async fetchItems() {
      try {
        const qTA = query(collection(db, 'users', this.uid, 'scheduledItems'), where('role', '==', 'TA'));
        const qTech = query(collection(db, 'users', this.uid, 'scheduledItems'), where('role', '==', '技術補佐員'));
        
        const [taSnapshot, techSnapshot] = await Promise.all([getDocs(qTA), getDocs(qTech)]);
        
        const taItems = taSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const techItems = techSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const batch = [...taItems, ...techItems];
        
        for (let i = 0; i < batch.length; i++){
          this.$emit('formSubmitted', batch[i]);
          console.log(batch[i]);
        }
      } catch (error) {
        console.error('Error fetching teachers: ', error);
      }
    },
    logOut() {
      // ユーザー情報とイベント内容をログに記録
      signOut(auth).then(() => {
        // Sign-out successful.
        this.$router.push('/login')
        console.log("ログアウト成功")
        alert('ログアウトしました')
      }).catch((error) => {
        // An error happened.
        console.log('ログアウトエラー: error ->' + error)
        alert('ログアウト処理でエラーが発生しました')
      });
    },
  }
};
</script>

<style scoped>
.schedule-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;

}

.form-row {
  display: flex;
  flex-wrap: wrap;

}

.form-group {
  vertical-align: middle
}

button {}

tr {
  text-align: center;
}


.table-con {
  display: inline-block
}

.forms {
  background: #CCFFFF;
  height: 70px;
}

</style>